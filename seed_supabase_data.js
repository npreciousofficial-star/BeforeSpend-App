import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://soqllmwmojyzvathirdd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWxsbXdtb2p5enZhdGhpcmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzE5NTAsImV4cCI6MjEwMDIwNzk1MH0.aTgkvp7erLcPj334U09NjQ57M99KOPxI_Oj8cEN8Yas';

const usersToSeed = [
  {
    email: 'admin@beforespend.app',
    password: 'SecurePassword123!',
    profile: { id: 'ad305d54-75b4-431b-adb2-e95e8cd6701a', name: 'Root Admin', email: 'admin@beforespend.app', role: 'Platform Administrator', default_currency: 'NGN' },
    buckets: [],
    transactions: []
  },
  {
    email: 'chidi@example.com',
    password: 'SecurePassword123!',
    profile: { id: 'de305d54-75b4-431b-adb2-e95e8cd6701f', name: 'Chidi Okafor', email: 'chidi@example.com', role: 'Freelancer & Contractor', default_currency: 'NGN' },
    buckets: [
      { id: 'b1111111-1111-4111-a111-111111111111', user_id: 'de305d54-75b4-431b-adb2-e95e8cd6701f', name: 'Emergency Savings', allocation_percentage: 30, color: 'emerald', destination_account: 'GTBank Savings', target_bank: 'GTBank' },
      { id: 'b2222222-2222-4222-a222-222222222222', user_id: 'de305d54-75b4-431b-adb2-e95e8cd6701f', name: 'Business Taxes', allocation_percentage: 20, color: 'blue', destination_account: 'Access Corporate', target_bank: 'Access Bank' }
    ],
    transactions: [
      { id: 'd1111111-1111-4111-a111-111111111111', user_id: 'de305d54-75b4-431b-adb2-e95e8cd6701f', bucket_id: 'b1111111-1111-4111-a111-111111111111', type: 'INCOME_SPLIT', amount: 1250000, direction: 'CREDIT', description: 'Monthly Consulting Inflow Receipt', source_type: 'MANUAL_ENTRY' },
      { id: 'd2222222-2222-4222-a222-222222222222', user_id: 'de305d54-75b4-431b-adb2-e95e8cd6701f', bucket_id: 'b2222222-2222-4222-a222-222222222222', type: 'INCOME_SPLIT', amount: 1000000, direction: 'CREDIT', description: 'Consulting Inflow Part 2', source_type: 'MANUAL_ENTRY' },
      { id: 'd3333333-3333-4333-a333-333333333333', user_id: 'de305d54-75b4-431b-adb2-e95e8cd6701f', bucket_id: 'b2222222-2222-4222-a222-222222222222', type: 'EXPENSE', amount: 161500, direction: 'DEBIT', description: 'Office Space Rent Payment', source_type: 'MANUAL_ENTRY' }
    ]
  },
  {
    email: 'amina@example.com',
    password: 'SecurePassword123!',
    profile: { id: 'a4920b72-f673-4ea2-8d76-e137cd53f185', name: 'Amina Bello', email: 'amina@example.com', role: 'Salaried Employee / Professional', default_currency: 'NGN' },
    buckets: [
      { id: 'b3333333-3333-4333-a333-333333333333', user_id: 'a4920b72-f673-4ea2-8d76-e137cd53f185', name: 'Rent Fund', allocation_percentage: 25, color: 'amber', destination_account: 'Zenith Rental', target_bank: 'Zenith Bank' }
    ],
    transactions: [
      { id: 'd4444444-4444-4444-a444-444444444444', user_id: 'a4920b72-f673-4ea2-8d76-e137cd53f185', bucket_id: 'b3333333-3333-4333-a333-333333333333', type: 'INCOME_SPLIT', amount: 838500, direction: 'CREDIT', description: 'Monthly Payroll Credit', source_type: 'MANUAL_ENTRY' }
    ]
  },
  {
    email: 'emeka@example.com',
    password: 'SecurePassword123!',
    profile: { id: '87bfbc1f-829d-4768-a42e-d007c082729a', name: 'Emeka Nwosu', email: 'emeka@example.com', role: 'Business Owner / Entrepreneur', default_currency: 'NGN' },
    buckets: [
      { id: 'b4444444-4444-4444-a444-444444444444', user_id: '87bfbc1f-829d-4768-a42e-d007c082729a', name: 'Asset Investment', allocation_percentage: 15, color: 'purple', destination_account: 'Stanbic Invest', target_bank: 'Stanbic IBTC' }
    ],
    transactions: [
      { id: 'd5555555-5555-4555-a555-555555555555', user_id: '87bfbc1f-829d-4768-a42e-d007c082729a', bucket_id: 'b4444444-4444-4444-a444-444444444444', type: 'INCOME_SPLIT', amount: 295000, direction: 'CREDIT', description: 'E-Commerce Inflow Settlement', source_type: 'MANUAL_ENTRY' }
    ]
  }
];

async function seed() {
  for (const item of usersToSeed) {
    console.log(`\n--- Seeding user: ${item.email} ---`);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 1. Sign up the user
    let sessionUserId = null;
    const { data: signUpData, error: signUpError } = await userClient.auth.signUp({
      email: item.email,
      password: item.password,
      options: {
        data: {
          name: item.profile.name,
          role: item.profile.role,
          default_currency: item.profile.default_currency
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already')) {
        console.log('User already registered. Logging in...');
        const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
          email: item.email,
          password: item.password
        });
        if (signInError) {
          console.error(`Sign in failed for ${item.email}:`, signInError.message);
          continue;
        }
        sessionUserId = signInData?.user?.id;
      } else {
        console.error(`Sign up failed for ${item.email}:`, signUpError.message);
        continue;
      }
    } else {
      sessionUserId = signUpData?.user?.id;
      console.log(`Registered user successfully. Auth UUID: ${sessionUserId}`);
    }

    if (!sessionUserId) {
      console.error('Could not obtain session user ID');
      continue;
    }

    const finalUserId = sessionUserId;
    const finalProfile = { ...item.profile, id: finalUserId };
    const finalBuckets = item.buckets.map(b => ({ ...b, user_id: finalUserId }));
    const finalTxns = item.transactions.map(t => ({ ...t, user_id: finalUserId }));

    // 2. Direct upsert of profiles
    console.log('Updating profile in profiles table...');
    const { error: profileError } = await userClient.from('profiles').upsert(finalProfile, { onConflict: 'email' });
    if (profileError) {
      console.error('Profile upsert failed:', profileError.message);
    } else {
      console.log('Profile upsert succeeded.');
    }

    // 3. Upsert buckets
    if (finalBuckets.length > 0) {
      console.log(`Upserting ${finalBuckets.length} buckets...`);
      const { error: bucketsError } = await userClient.from('buckets').upsert(finalBuckets);
      if (bucketsError) {
        console.error('Buckets upsert failed:', bucketsError.message);
      } else {
        console.log('Buckets upsert succeeded.');
      }
    }

    // 4. Upsert transactions
    if (finalTxns.length > 0) {
      console.log(`Upserting ${finalTxns.length} transactions...`);
      const { error: txError } = await userClient.from('transactions').upsert(finalTxns);
      if (txError) {
        console.error('Transactions upsert failed:', txError.message);
      } else {
        console.log('Transactions upsert succeeded.');
      }
    }
  }
  console.log('\nAll seed operations finished!');
}

seed();
