import { createClient } from '@supabase/supabase-js';
import { Bucket, Transaction, PaymentEntry, Milestone, Reminder, UserProfile, AppNotification } from '../types';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://soqllmwmojyzvathirdd.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWxsbXdtb2p5enZhdGhpcmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzE5NTAsImV4cCI6MjEwMDIwNzk1MH0.aTgkvp7erLcPj334U09NjQ57M99KOPxI_Oj8cEN8Yas';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Ensures user IDs are in valid PostgreSQL UUID format
 */
export function ensureUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  let hex = '';
  for (let i = 0; i < id.length; i++) {
    hex += id.charCodeAt(i).toString(16);
  }
  hex = (hex + '00000000000000000000000000000000').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Convert base64 data URL to Blob
 */
function base64ToBlob(base64Data: string): Blob | null {
  try {
    const parts = base64Data.split(';base64,');
    if (parts.length !== 2) return null;
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } catch (e) {
    console.warn('Failed to parse base64 image:', e);
    return null;
  }
}

/**
 * Upload a receipt or avatar file/base64 to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  bucketName: 'avatars' | 'receipts',
  filePath: string,
  fileOrBase64: File | Blob | string
): Promise<string | null> {
  try {
    let fileToUpload: File | Blob | null = null;
    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('data:image/')) {
        fileToUpload = base64ToBlob(fileOrBase64);
      } else if (fileOrBase64.startsWith('http')) {
        return fileOrBase64; // already hosted
      }
    } else {
      fileToUpload = fileOrBase64;
    }

    if (!fileToUpload) return null;

    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, fileToUpload, {
      upsert: true,
      cacheControl: '3600',
    });

    if (error) {
      console.warn(`Supabase storage upload error [${bucketName}]:`, error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return `${publicUrlData.publicUrl}?v=${Date.now()}`;
  } catch (err) {
    console.warn('Failed to upload to Supabase storage:', err);
    return null;
  }
}

/**
 * Trigger direct Google OAuth redirect via Supabase Auth
 */
export async function loginWithGoogleOAuth(): Promise<void> {
  try {
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.warn('Google OAuth error:', error.message);
      throw error;
    }
  } catch (err) {
    console.warn('Google OAuth initiation failed:', err);
    throw err;
  }
}

/**
 * Register & Sync new user accounts to Supabase Auth & public.profiles table
 */
export async function registerUserAccountToSupabase(user: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  defaultCurrency: string;
  phoneNumber?: string;
}): Promise<string | null> {
  const validUuid = ensureUuid(user.id);
  try {
    // 1. Register user on Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.passwordHash && user.passwordHash.length >= 6 ? user.passwordHash : 'SecurePassword123!',
      phone: user.phoneNumber || undefined,
      options: {
        data: {
          name: user.name,
          role: user.role,
          default_currency: user.defaultCurrency,
          phone_number: user.phoneNumber,
        }
      }
    });

    if (authError) {
      console.warn('Supabase Auth signUp info:', authError.message);
      // If user already exists, try to sign in to retrieve their ID
      if (authError.message.includes('already') || authError.status === 422 || authError.status === 400) {
        const loggedInId = await loginUserAccountToSupabase(user.email, user.passwordHash);
        if (loggedInId) return loggedInId;
      }
    }

    const finalUserId = authData?.user?.id || validUuid;

    // 2. Direct upsert into 'profiles' table
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: finalUserId,
      name: user.name,
      email: user.email,
      role: user.role || 'Personal Budgeter',
      avatar: 'preset-emerald',
      default_currency: user.defaultCurrency || 'NGN',
      phone_number: user.phoneNumber || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

    if (profileError) {
      console.warn('Supabase profile insertion error:', profileError.message);
    } else {
      console.log('User registered & synced to Supabase database successfully!');
    }
    return finalUserId;
  } catch (err) {
    console.warn('registerUserAccountToSupabase failed:', err);
    return null;
  }
}

/**
 * Authenticate existing user accounts against Supabase Auth
 */
export async function loginUserAccountToSupabase(email: string, passwordHash: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: passwordHash && passwordHash.length >= 6 ? passwordHash : 'SecurePassword123!',
    });

    if (error) {
      console.warn('Supabase Auth signIn error:', error.message);
      return null;
    }

    return data?.user?.id || null;
  } catch (err) {
    console.warn('loginUserAccountToSupabase failed:', err);
    return null;
  }
}

/**
 * Copies user local storage data from an old ID prefix to a new ID prefix.
 */
export function copyLocalStorageData(oldId: string, newId: string) {
  if (!oldId || !newId || oldId === newId) return;
  const keys = [
    'before spend_buckets',
    'beforespend_transactions',
    'beforespend_history',
    'beforespend_expenses',
    'beforespend_milestones',
    'beforespend_reminders',
    'beforespend_profile',
    'beforespend_exchange_rates',
    'beforespend_hide_balance',
    'beforespend_active_tab',
    'beforespend_notifications',
  ];

  keys.forEach(key => {
    const oldKey = `user_${oldId}_${key}`;
    const newKey = `user_${newId}_${key}`;
    const value = window.localStorage.getItem(oldKey);
    if (value !== null) {
      window.localStorage.setItem(newKey, value);
    }
  });
}


/**
 * Sync user profile to Supabase 'profiles' table
 */
export async function syncProfileToSupabase(profile: UserProfile, userId: string): Promise<string | undefined> {
  try {
    const validUuid = ensureUuid(userId);
    let avatarUrl = profile.avatar;
    if (avatarUrl && avatarUrl.startsWith('data:image/')) {
      const uploadedUrl = await uploadToSupabaseStorage('avatars', `${validUuid}/avatar.png`, avatarUrl);
      if (uploadedUrl) avatarUrl = uploadedUrl;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: validUuid,
      name: profile.name,
      email: profile.email,
      role: profile.role || 'Personal Budgeter',
      avatar: avatarUrl || 'preset-emerald',
      default_currency: profile.defaultCurrency || 'NGN',
      phone_number: profile.phoneNumber || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

    if (error) {
      if (error.message.includes('foreign key constraint')) {
        console.info('Supabase FK notice: Run SUPABASE_SCHEMA_FIX.sql in Supabase SQL editor to enable unconstrained multi-user profile sync.');
      } else {
        console.warn('Supabase profile sync error:', error.message);
      }
    }

    return avatarUrl;
  } catch (err) {
    console.warn('Supabase syncProfile failed:', err);
    return profile.avatar;
  }
}

/**
 * Sync buckets to Supabase
 */
export async function syncBucketsToSupabase(buckets: Bucket[], userId: string) {
  try {
    const validUuid = ensureUuid(userId);
    // Skip sync if no buckets or all buckets have undefined percentages (prevents NOT NULL violation)
    const validBuckets = buckets.filter(b => b.name && typeof b.percentage === 'number');
    if (validBuckets.length === 0) return;

    const records = validBuckets.map(b => ({
      id: ensureUuid(b.id),
      user_id: validUuid,
      name: b.name,
      // Send both column names to handle either DB schema (old: 'allocation_percentage', actual may differ)
      allocation_percentage: Number(b.percentage) || 0,
      color: b.color || 'emerald',
      destination_account: b.destinationAccount || 'Default Account',
      target_bank: b.targetBank || 'Default Bank',
      is_system: b.isSystem || false,
      note: b.note || null
    }));

    const { error } = await supabase.from('buckets').upsert(records, {
      onConflict: 'user_id,name',
      ignoreDuplicates: false
    });
    if (error) {
      if (error.message.includes('foreign key constraint')) {
        console.info('Supabase buckets FK notice: Run SUPABASE_SCHEMA_FIX.sql to enable unconstrained bucket sync.');
      } else {
        console.warn('Supabase buckets sync error:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase syncBuckets failed:', err);
  }
}

/**
 * Sync payments / history entries to Supabase
 */
export async function syncPaymentsToSupabase(payments: PaymentEntry[], userId: string) {
  try {
    const validUuid = ensureUuid(userId);
    for (const p of payments) {
      let receiptUrl = p.receiptImage;
      if (receiptUrl && receiptUrl.startsWith('data:image/')) {
        const uploaded = await uploadToSupabaseStorage('receipts', `${validUuid}/payment_${p.id}.png`, receiptUrl);
        if (uploaded) receiptUrl = uploaded;
      }

      const { error } = await supabase.from('payments').upsert({
        id: ensureUuid(p.id),
        user_id: validUuid,
        date: p.date,
        amount: p.amount,
        currency: p.currency,
        converted_amount: p.convertedAmount,
        note: p.note || null,
        receipt_image: receiptUrl || null,
        splits: p.splits || []
      });

      if (error) {
        if (error.message.includes('foreign key constraint')) {
          console.info('Supabase payments FK notice: Run SUPABASE_SCHEMA_FIX.sql to enable unconstrained payments sync.');
        } else {
          console.warn('Supabase payment sync error:', error.message);
        }
      }
    }
  } catch (err) {
    console.warn('Supabase syncPayments failed:', err);
  }
}

/**
 * Sync transactions (immutable double-entry ledger) to Supabase.
 * This is the most critical sync — without it, bucket balances are lost on cache clear.
 */
export async function syncTransactionsToSupabase(transactions: Transaction[], userId: string) {
  try {
    const validUuid = ensureUuid(userId);
    if (!transactions || transactions.length === 0) return;

    const records = transactions.map(t => ({
      id: ensureUuid(t.id),
      user_id: validUuid,
      bucket_id: t.bucketId ? ensureUuid(t.bucketId) : null,
      type: t.type || 'EXPENSE',
      amount: Number(t.amount) || 0,
      direction: t.direction || 'DEBIT',
      description: t.description || '',
      receipt_url: t.receiptUrl || null,
      source_type: t.sourceType || 'MANUAL_ENTRY',
      deduplication_hash: t.deduplicationHash || null,
      created_at: t.createdAt || new Date().toISOString(),
    }));

    // Upsert in batches of 50 to avoid payload size limits
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase.from('transactions').upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
      
      if (error) {
        if (error.message.includes('foreign key constraint') || error.message.includes('transactions_bucket_id_fkey')) {
          console.info('Supabase transactions FK notice: Run SUPABASE_SCHEMA_FIX.sql to enable unconstrained transactions sync.');
          const fallbackBatch = batch.map(r => ({ ...r, bucket_id: null }));
          await supabase.from('transactions').upsert(fallbackBatch, { onConflict: 'id' });
        } else {
          console.warn('Supabase transactions sync error:', error.message);
        }
      }
    }
  } catch (err) {
    console.warn('Supabase syncTransactions failed:', err);
  }
}


/**
 * Sync milestones to Supabase
 */
export async function syncMilestonesToSupabase(milestones: Milestone[], userId: string) {
  try {
    const validUuid = ensureUuid(userId);
    const records = milestones.map(m => ({
      id: ensureUuid(m.id),
      user_id: validUuid,
      name: m.name,
      target_amount: m.targetAmount,
      bucket_id: m.bucketId ? ensureUuid(m.bucketId) : null,
      created_date: m.createdDate || new Date().toISOString()
    }));

    const { error } = await supabase.from('milestones').upsert(records);
    if (error) {
      if (error.message.includes('foreign key constraint')) {
        console.info('Supabase milestones FK notice: Run SUPABASE_SCHEMA_FIX.sql.');
      } else {
        console.warn('Supabase milestones sync error:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase syncMilestones failed:', err);
  }
}

/**
 * Sync reminders to Supabase
 */
export async function syncRemindersToSupabase(reminders: Reminder[], userId: string) {
  try {
    const validUuid = ensureUuid(userId);
    const records = reminders.map(r => ({
      id: ensureUuid(r.id),
      user_id: validUuid,
      text: r.text,
      due_date: r.dueDate,
      done: r.done,
      type: r.type || 'manual',
      period: r.period || null,
      note: r.note || null,
      cost: r.cost || null
    }));

    const { error } = await supabase.from('reminders').upsert(records);
    if (error) console.warn('Supabase reminders sync error:', error.message);
  } catch (err) {
    console.warn('Supabase syncReminders failed:', err);
  }
}

/**
 * Load user profile from Supabase
 */
export async function loadProfileFromSupabase(userId: string): Promise<UserProfile | null> {
  try {
    const validUuid = ensureUuid(userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', validUuid)
      .maybeSingle();

    if (error || !data) {
      if (error) console.warn('Info loading profile from Supabase:', error.message);
      return null;
    }

    return {
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.avatar || 'preset-emerald',
      defaultCurrency: data.default_currency || 'NGN',
      phoneNumber: data.phone_number || undefined,
    };
  } catch (err) {
    console.warn('loadProfileFromSupabase failed:', err);
    return null;
  }
}

/**
 * Load buckets from Supabase
 */
export async function loadBucketsFromSupabase(userId: string): Promise<Bucket[] | null> {
  try {
    const validUuid = ensureUuid(userId);
    const { data, error } = await supabase
      .from('buckets')
      .select('*')
      .eq('user_id', validUuid);

    if (error) {
      console.warn('Error loading buckets from Supabase:', error.message);
      return null;
    }

    return data.map(b => ({
      id: b.id,
      name: b.name,
      percentage: Number(b.allocation_percentage),
      color: b.color,
      destinationAccount: b.destination_account,
      targetBank: b.target_bank,
      isSystem: b.is_system,
      note: b.note || undefined,
      balance: 0, // Will be computed dynamically
    }));
  } catch (err) {
    console.warn('loadBucketsFromSupabase failed:', err);
    return null;
  }
}

/**
 * Load transactions from Supabase
 */
export async function loadTransactionsFromSupabase(userId: string): Promise<Transaction[] | null> {
  try {
    const validUuid = ensureUuid(userId);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', validUuid)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error loading transactions from Supabase:', error.message);
      return null;
    }

    return data.map(t => ({
      id: t.id,
      userId: t.user_id,
      bucketId: t.bucket_id,
      type: t.type,
      amount: Number(t.amount),
      direction: t.direction,
      description: t.description,
      receiptUrl: t.receipt_url || undefined,
      sourceType: t.source_type,
      deduplicationHash: t.deduplication_hash || undefined,
      createdAt: t.created_at,
    }));
  } catch (err) {
    console.warn('loadTransactionsFromSupabase failed:', err);
    return null;
  }
}

/**
 * Load payments / split history from Supabase
 */
export async function loadPaymentsFromSupabase(userId: string): Promise<PaymentEntry[] | null> {
  try {
    const validUuid = ensureUuid(userId);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', validUuid)
      .order('date', { ascending: false });

    if (error) {
      console.warn('Error loading payments from Supabase:', error.message);
      return null;
    }

    return data.map(p => ({
      id: p.id,
      date: p.date,
      amount: Number(p.amount),
      currency: p.currency,
      convertedAmount: Number(p.converted_amount),
      splits: p.splits || [],
      note: p.note || undefined,
      receiptImage: p.receipt_image || undefined,
    }));
  } catch (err) {
    console.warn('loadPaymentsFromSupabase failed:', err);
    return null;
  }
}

/**
 * Load milestones from Supabase
 */
export async function loadMilestonesFromSupabase(userId: string): Promise<Milestone[] | null> {
  try {
    const validUuid = ensureUuid(userId);
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', validUuid)
      .order('created_date', { ascending: false });

    if (error) {
      console.warn('Error loading milestones from Supabase:', error.message);
      return null;
    }

    return data.map(m => ({
      id: m.id,
      name: m.name,
      targetAmount: Number(m.target_amount),
      bucketId: m.bucket_id,
      createdDate: m.created_date,
    }));
  } catch (err) {
    console.warn('loadMilestonesFromSupabase failed:', err);
    return null;
  }
}

/**
 * Load reminders from Supabase
 */
export async function loadRemindersFromSupabase(userId: string): Promise<Reminder[] | null> {
  try {
    const validUuid = ensureUuid(userId);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', validUuid)
      .order('due_date', { ascending: true });

    if (error) {
      console.warn('Error loading reminders from Supabase:', error.message);
      return null;
    }

    return data.map(r => ({
      id: r.id,
      text: r.text,
      dueDate: r.due_date,
      done: r.done,
      type: r.type,
      period: r.period || undefined,
      note: r.note || undefined,
      cost: r.cost ? Number(r.cost) : undefined,
    }));
  } catch (err) {
    console.warn('loadRemindersFromSupabase failed:', err);
    return null;
  }
}

/**
 * Admin: Load all user profiles
 */
export async function adminLoadProfilesFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('adminLoadProfilesFromSupabase failed:', err);
    return null;
  }
}

/**
 * Admin: Load all buckets across all users
 */
export async function adminLoadBucketsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('buckets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('adminLoadBucketsFromSupabase failed:', err);
    return null;
  }
}

/**
 * Admin: Load all transactions across all users
 */
export async function adminLoadTransactionsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('adminLoadTransactionsFromSupabase failed:', err);
    return null;
  }
}

/**
 * Admin: Load all payments across all users
 */
export async function adminLoadPaymentsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('adminLoadPaymentsFromSupabase failed:', err);
    return null;
  }
}

/**
 * Admin: Load all reminders across all users
 */
export async function adminLoadRemindersFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('adminLoadRemindersFromSupabase failed:', err);
    return null;
  }
}

/**
 * Admin: Update user profile
 */
export async function adminUpdateProfileInSupabase(profileId: string, updates: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        email: updates.email,
        role: updates.role,
        default_currency: updates.defaultCurrency,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('adminUpdateProfileInSupabase failed:', err);
    return false;
  }
}

/**
 * Admin: Delete profile and all their associated application data
 */
export async function adminDeleteProfileFromSupabase(profileId: string): Promise<boolean> {
  try {
    // Delete profile
    const { error: profileErr } = await supabase.from('profiles').delete().eq('id', profileId);
    if (profileErr) throw profileErr;

    // Delete associated data
    await supabase.from('buckets').delete().eq('user_id', profileId);
    await supabase.from('transactions').delete().eq('user_id', profileId);
    await supabase.from('payments').delete().eq('user_id', profileId);
    await supabase.from('milestones').delete().eq('user_id', profileId);
    await supabase.from('reminders').delete().eq('user_id', profileId);
    await supabase.from('notifications').delete().eq('user_id', profileId);

    return true;
  } catch (err) {
    console.warn('adminDeleteProfileFromSupabase failed:', err);
    return false;
  }
}

/**
 * Admin: Update a bucket
 */
export async function adminUpdateBucketInSupabase(bucketId: string, updates: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('buckets')
      .update({
        name: updates.name,
        allocation_percentage: Number(updates.allocationPercentage),
        color: updates.color,
        destination_account: updates.destinationAccount,
        target_bank: updates.targetBank,
        note: updates.note,
        updated_at: new Date().toISOString()
      })
      .eq('id', bucketId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('adminUpdateBucketInSupabase failed:', err);
    return false;
  }
}

/**
 * Admin: Delete a bucket
 */
export async function adminDeleteBucketFromSupabase(bucketId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('buckets').delete().eq('id', bucketId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('adminDeleteBucketFromSupabase failed:', err);
    return false;
  }
}

/**
 * Admin: Update a transaction
 */
export async function adminUpdateTransactionInSupabase(transactionId: string, updates: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        description: updates.description,
        amount: Number(updates.amount),
        type: updates.type,
        direction: updates.direction,
      })
      .eq('id', transactionId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('adminUpdateTransactionInSupabase failed:', err);
    return false;
  }
}

/**
 * Admin: Delete a transaction
 */
export async function adminDeleteTransactionFromSupabase(transactionId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('adminDeleteTransactionFromSupabase failed:', err);
    return false;
  }
}

/**
 * Admin: Broadcast notification to all user profiles
 */
export async function adminBroadcastNotificationToAll(title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info'): Promise<boolean> {
  try {
    // 1. Fetch all profiles
    const { data: profiles, error: fetchErr } = await supabase.from('profiles').select('id');
    if (fetchErr) throw fetchErr;
    if (!profiles || profiles.length === 0) return false;

    // 2. Insert notification for each user
    const records = profiles.map(p => ({
      user_id: p.id,
      title,
      message,
      type,
      read: false,
      time: new Date().toISOString()
    }));

    const { error: insertErr } = await supabase.from('notifications').insert(records);
    if (insertErr) throw insertErr;
    return true;
  } catch (err) {
    console.warn('adminBroadcastNotificationToAll failed:', err);
    return false;
  }
}

/**
 * Load notifications for a specific user from Supabase
 */
export async function loadNotificationsFromSupabase(userId: string): Promise<AppNotification[]> {
  try {
    const validUuid = ensureUuid(userId);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', validUuid)
      .order('time', { ascending: false });

    if (error) {
      console.warn('Error loading notifications from Supabase:', error.message);
      return [];
    }

    return (data || []).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: n.time || new Date().toISOString(),
      type: (n.type as any) || 'info',
      read: n.read || false
    }));
  } catch (err) {
    console.warn('loadNotificationsFromSupabase failed:', err);
    return [];
  }
}

/**
 * Sync notifications to Supabase (inserts or updates state)
 */
export async function syncNotificationsToSupabase(notifications: AppNotification[], userId: string) {
  try {
    const validUuid = ensureUuid(userId);
    if (!notifications || notifications.length === 0) return;

    const records = notifications.map(n => ({
      id: ensureUuid(n.id),
      user_id: validUuid,
      title: n.title,
      message: n.message,
      time: n.time,
      type: n.type,
      read: n.read
    }));

    const { error } = await supabase
      .from('notifications')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      console.warn('Error syncing notifications to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('syncNotificationsToSupabase failed:', err);
  }
}

/**
 * Delete a specific notification from Supabase
 */
export async function deleteNotificationFromSupabase(notificationId: string): Promise<boolean> {
  try {
    const validId = ensureUuid(notificationId);
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', validId);

    if (error) {
      console.warn('Error deleting notification from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deleteNotificationFromSupabase failed:', err);
    return false;
  }
}

/**
 * Clear all notifications for a specific user from Supabase
 */
export async function clearAllNotificationsFromSupabase(userId: string): Promise<boolean> {
  try {
    const validUuid = ensureUuid(userId);
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', validUuid);

    if (error) {
      console.warn('Error clearing notifications from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('clearAllNotificationsFromSupabase failed:', err);
    return false;
  }
}

/**
 * Keep-Alive Heartbeat: Pings Supabase database to ensure connection is active
 */
export async function pingSupabaseDatabase(): Promise<boolean> {
  try {
    const { status, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    if (error) {
      console.warn('Supabase ping warning:', error.message);
      return false;
    }
    console.log('Supabase DB connection active. Status:', status);
    return true;
  } catch (err) {
    console.warn('pingSupabaseDatabase error:', err);
    return false;
  }
}
