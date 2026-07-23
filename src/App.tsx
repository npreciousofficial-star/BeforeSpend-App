/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_BUCKETS, BUCKET_TEMPLATES } from './data/defaultBuckets';
import { DEFAULT_EXCHANGE_RATES, formatCurrency, generateId, convertCurrency } from './lib/utils';
import { Bucket, PaymentEntry, Expense, Milestone, Reminder, UserProfile, ToastMessage, AppNotification, Transaction } from './types';
import { 
  syncProfileToSupabase, syncBucketsToSupabase, syncTransactionsToSupabase, syncPaymentsToSupabase, syncMilestonesToSupabase, syncRemindersToSupabase,
  loadProfileFromSupabase, loadBucketsFromSupabase, loadTransactionsFromSupabase, loadPaymentsFromSupabase, loadMilestonesFromSupabase, loadRemindersFromSupabase,
  loadNotificationsFromSupabase, syncNotificationsToSupabase, deleteNotificationFromSupabase,
  adminLoadProfilesFromSupabase, adminLoadBucketsFromSupabase, adminLoadTransactionsFromSupabase, adminLoadPaymentsFromSupabase, adminLoadRemindersFromSupabase,
  adminUpdateProfileInSupabase, adminDeleteProfileFromSupabase, adminUpdateBucketInSupabase, adminDeleteBucketFromSupabase,
  adminUpdateTransactionInSupabase, adminDeleteTransactionFromSupabase, adminBroadcastNotificationToAll, pingSupabaseDatabase
} from './lib/supabase';

// Components
import { ToastContainer } from './components/Toast';
import { SplitCalculator } from './components/SplitCalculator';
import { FinanceCalculators } from './components/FinanceCalculators';
import { BucketCard } from './components/BucketCard';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ExpensePieChart } from './components/ExpensePieChart';
import { MilestoneCard } from './components/MilestoneCard';
import { MilestoneForm } from './components/MilestoneForm';
import { ReminderItem } from './components/ReminderItem';
import { ReminderForm } from './components/ReminderForm';
import { HistoryEntryList } from './components/HistoryEntry';
import { FinanceCharts } from './components/FinanceCharts';
import { LoginRegisterScreen } from './components/LoginRegisterScreen';
import { LandingPage } from './components/LandingPage';
import { Avatar, AVATAR_PRESETS } from './components/Avatar';
import { NotificationBell } from './components/NotificationBell';
import { ReconciliationModal } from './components/ReconciliationModal';
import { StatementParserModal } from './components/StatementParserModal';
import { LedgerTable } from './components/LedgerTable';
import { BeforeSpendLogo } from './components/BeforeSpendLogo';
import { BeforeSpendIcon } from './components/BeforeSpendIcon';
import { AdminCommandCenter } from './components/AdminCommandCenter';

// Icons
import { 
  Wallet, 
  TrendingDown, 
  Layers, 
  Target, 
  Bell, 
  History, 
  BarChart3, 
  Settings, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Moon, 
  Sun, 
  User, 
  Sparkles,
  Database,
  ArrowRight,
  Plus,
  Trash2,
  Lock,
  RotateCcw,
  Upload,
  UserCheck,
  X,
  LogOut,
  LayoutGrid,
  Eye,
  EyeOff,
  Calculator,
  Scale,
  Globe,
  Users,
  Edit3,
  Send
} from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; subtext: string }> = {
  ledger: {
    title: 'Transactions & Bank Statements',
    subtext: 'View your income and expense records, import bank statements, and check your balances.'
  },
  split: {
    title: 'Money Splitter',
    subtext: 'Easily divide income into your categories or split bills with friends.'
  },
  expenses: {
    title: 'Expense Tracker',
    subtext: 'Keep track of what you spend and see where your money goes.'
  },
  history: {
    title: 'Payment History',
    subtext: 'See all your past income splits and payment records.'
  },
  milestones: {
    title: 'Savings Goals',
    subtext: 'Set savings targets, track your progress, and reach your goals.'
  },
  reminders: {
    title: 'Bills & Subscriptions',
    subtext: 'Never miss a payment with automatic bill and subscription reminders.'
  },
  analytics: {
    title: 'Spending Insights',
    subtext: 'See simple charts and summaries of your income and spending habits.'
  },
  settings: {
    title: 'Account Settings',
    subtext: 'Customize your spending categories, currency, and profile details.'
  },
  admin: {
    title: 'Data & Backups',
    subtext: 'Save a backup copy of your data or restore your saved records.'
  },
  calculators: {
    title: 'Money Calculators',
    subtext: 'Simple tools to estimate savings growth, interest, and monthly loan payments.'
  },
  hub: {
    title: 'More Tools',
    subtext: 'Access extra features, savings tools, and settings.'
  }
};

export function AuthenticatedApp({ 
  currentUserId, 
  onLogout, 
  onGoToLanding 
}: { 
  currentUserId: string; 
  onLogout: () => void; 
  onGoToLanding?: () => void; 
}) {
  const userPrefix = `user_${currentUserId}_`;

  // 1. Core State with LocalStorage Persistence
  const [buckets, setBuckets] = useLocalStorage<Bucket[]>(`${userPrefix}before spend_buckets`, DEFAULT_BUCKETS);
  
  // 1.0 Immutable Double-Entry Ledger Transactions
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(`${userPrefix}beforespend_transactions`, []);

  // Reconciliation & Statement Modals
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [reconciliationBucketId, setReconciliationBucketId] = useState<string | undefined>(undefined);
  const [showStatementParserModal, setShowStatementParserModal] = useState(false);
  const [history, setHistory] = useLocalStorage<PaymentEntry[]>(`${userPrefix}beforespend_history`, []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(`${userPrefix}beforespend_expenses`, []);
  const [milestones, setMilestones] = useLocalStorage<Milestone[]>(`${userPrefix}beforespend_milestones`, []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(`${userPrefix}beforespend_reminders`, []);

  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>(`${userPrefix}beforespend_profile`, {
    name: 'Chidi Okechukwu',
    email: 'chidi.design@gmail.com',
    role: 'Freelance UI/UX Designer',
    defaultCurrency: 'NGN',
    avatar: 'preset-chidi',
  });
  const [exchangeRates, setExchangeRates] = useLocalStorage<{ [key: string]: number }>(`${userPrefix}beforespend_exchange_rates`, DEFAULT_EXCHANGE_RATES);
  const [hideBalance, setHideBalance] = useLocalStorage<boolean>(`${userPrefix}beforespend_hide_balance`, false);

  // 2. Local App UI state - Context Aware Tab Persistence across Browser Refreshes
  const [activeTab, setActiveTab] = useLocalStorage<string>(`${userPrefix}beforespend_active_tab`, 'split');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // guards sync from firing before load completes
  
  // Settings bucket states
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [showEditBucketModal, setShowEditBucketModal] = useState(false);
  const [tempBucketName, setTempBucketName] = useState('');
  const [tempBucketPercentage, setTempBucketPercentage] = useState<number>(0);
  const [tempBucketAccount, setTempBucketAccount] = useState('');
  const [tempBucketColor, setTempBucketColor] = useState('');
  const [tempBucketNote, setTempBucketNote] = useState('');
  const [tempBucketThreshold, setTempBucketThreshold] = useState<number | string>('');

  // Custom bucket creation form
  const [showAddCustomBucketModal, setShowAddCustomBucketModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketPercentage, setNewBucketPercentage] = useState<number>(0);
  const [newBucketAccount, setNewBucketAccount] = useState('');
  const [newBucketColor, setNewBucketColor] = useState('emerald');
  const [newBucketNote, setNewBucketNote] = useState('');
  const [newBucketThreshold, setNewBucketThreshold] = useState<number | string>('');

  // Admin DB config raw code
  const [rawDbJson, setRawDbJson] = useState('');
  const [showImportDbModal, setShowImportDbModal] = useState(false);

  // 1.2 Administrative Dashboard State
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const [adminBuckets, setAdminBuckets] = useState<any[]>([]);
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [adminReminders, setAdminReminders] = useState<any[]>([]);
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<string>('overview');
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [adminIsLoading, setAdminIsLoading] = useState<boolean>(false);

  // Edit states for admin
  const [adminEditingUser, setAdminEditingUser] = useState<any | null>(null);
  const [adminEditUserName, setAdminEditUserName] = useState('');
  const [adminEditUserEmail, setAdminEditUserEmail] = useState('');
  const [adminEditUserRole, setAdminEditUserRole] = useState('');
  const [adminEditUserCurrency, setAdminEditUserCurrency] = useState('NGN');

  const [adminEditingBucket, setAdminEditingBucket] = useState<any | null>(null);
  const [adminEditBucketName, setAdminEditBucketName] = useState('');
  const [adminEditBucketPercentage, setAdminEditBucketPercentage] = useState<number>(0);
  const [adminEditBucketAccount, setAdminEditBucketAccount] = useState('');
  const [adminEditBucketBank, setAdminEditBucketBank] = useState('');
  const [adminEditBucketColor, setAdminEditBucketColor] = useState('emerald');
  const [adminEditBucketNote, setAdminEditBucketNote] = useState('');

  const [adminEditingTransaction, setAdminEditingTransaction] = useState<any | null>(null);
  const [adminEditTransactionDesc, setAdminEditTransactionDesc] = useState('');
  const [adminEditTransactionAmount, setAdminEditTransactionAmount] = useState<number>(0);
  const [adminEditTransactionType, setAdminEditTransactionType] = useState('EXPENSE');
  const [adminEditTransactionDirection, setAdminEditTransactionDirection] = useState('DEBIT');

  // Broadcast states
  const [adminBroadcastTitle, setAdminBroadcastTitle] = useState('');
  const [adminBroadcastMessage, setAdminBroadcastMessage] = useState('');
  const [adminBroadcastType, setAdminBroadcastType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');

  // Profile editing
  const [editProfileName, setEditProfileName] = useState(userProfile.name);
  const [editProfileEmail, setEditProfileEmail] = useState(userProfile.email);
  const [editProfileRole, setEditProfileRole] = useState(userProfile.role);
  const [editProfileCurrency, setEditProfileCurrency] = useState(userProfile.defaultCurrency);
  const [editProfileAvatar, setEditProfileAvatar] = useState(userProfile.avatar || 'preset-chidi');

  // 1.1 Notification System State
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(
    `${userPrefix}beforespend_notifications`,
    [
      {
        id: 'n-welcome',
        title: 'Welcome to BeforeSpend! 🎉',
        message: 'Your personal finance workspace is ready. You can allocate buckets, log shared splits, and monitor your visual expense categories securely.',
        time: new Date().toISOString(),
        type: 'success',
        read: false,
      },
      {
        id: 'n-backup',
        title: 'Database Local Storage Enabled',
        message: 'All your database and profile entries are stored locally on your device. Remember to export a backup from the Admin Center regularly.',
        time: new Date(Date.now() - 3600000).toISOString(),
        type: 'info',
        read: false,
      },
      {
        id: 'n-reminders',
        title: 'Subscription Auto-due Setup',
        message: 'We have configured several recurring bill dues in your Reminders tab. Keep track of upcoming automatic deductions.',
        time: new Date(Date.now() - 7200000).toISOString(),
        type: 'info',
        read: false,
      }
    ]
  );

  // Load data from Supabase DB on mount/login
  useEffect(() => {
    if (!currentUserId || currentUserId.startsWith('00000000-')) {
      return;
    }

    async function loadData() {
      try {
        pingSupabaseDatabase();
        console.log('Fetching user data from Supabase database...');
        
        // 1. Load Profile
        const profile = await loadProfileFromSupabase(currentUserId);
        if (profile) {
          setUserProfile(profile);
        }

        // 2. Load Buckets
        const dbBuckets = await loadBucketsFromSupabase(currentUserId);
        if (dbBuckets && dbBuckets.length > 0) {
          setBuckets(dbBuckets);
        }

        // 3. Load Transactions
        const dbTxns = await loadTransactionsFromSupabase(currentUserId);
        if (dbTxns && dbTxns.length > 0) {
          setTransactions(dbTxns);
        }

        // 4. Load Payments (History)
        const dbPayments = await loadPaymentsFromSupabase(currentUserId);
        if (dbPayments && dbPayments.length > 0) {
          setHistory(dbPayments);
        }

        // 5. Load Milestones
        const dbMilestones = await loadMilestonesFromSupabase(currentUserId);
        if (dbMilestones && dbMilestones.length > 0) {
          setMilestones(dbMilestones);
        }

        // 6. Load Reminders
        const dbReminders = await loadRemindersFromSupabase(currentUserId);
        if (dbReminders && dbReminders.length > 0) {
          setReminders(dbReminders);
        }

        // 7. Load Notifications
        const dbNotifications = await loadNotificationsFromSupabase(currentUserId);
        if (dbNotifications && dbNotifications.length > 0) {
          setNotifications(dbNotifications);
        }

        console.log('Supabase user data loaded successfully!');
        setDataLoaded(true);
      } catch (err) {
        console.warn('Failed to load user data from Supabase:', err);
        setDataLoaded(true); // allow sync even on partial load failure
      }
    }

    loadData();
  }, [currentUserId]);

  // Supabase background sync for cloud persistent storage (only after initial data load)
  useEffect(() => {
    if (!currentUserId || currentUserId.startsWith('00000000-') || !dataLoaded) {
      return; // Skip sync for guests and until load completes (prevents race condition)
    }
    syncProfileToSupabase(userProfile, currentUserId);
    syncBucketsToSupabase(buckets, currentUserId);
    syncTransactionsToSupabase(transactions, currentUserId);
    syncPaymentsToSupabase(history, currentUserId);
    syncMilestonesToSupabase(milestones, currentUserId);
    syncRemindersToSupabase(reminders, currentUserId);
    syncNotificationsToSupabase(notifications, currentUserId);
  }, [userProfile, buckets, transactions, history, milestones, reminders, notifications, currentUserId, dataLoaded]);

  // Dynamic system notifications logic
  useEffect(() => {
    const totalAlloc = buckets.reduce((sum, b) => sum + b.percentage, 0);
    const hasMismatchNotification = notifications.some(n => n.id === 'n-mismatch');

    let updated = [...notifications];
    let changed = false;

    if (totalAlloc !== 100 && !hasMismatchNotification) {
      updated.unshift({
        id: 'n-mismatch',
        title: 'Budget Allocation Mismatch!',
        message: `Your active buckets sum to ${totalAlloc}% instead of exactly 100%. Automatic splits will be inaccurate until updated in settings.`,
        time: new Date().toISOString(),
        type: 'warning',
        read: false
      });
      changed = true;
    } else if (totalAlloc === 100 && hasMismatchNotification) {
      updated = updated.filter(n => n.id !== 'n-mismatch');
      changed = true;
    }

    // Low balance warnings per bucket
    buckets.forEach((bucket) => {
      const notifId = `n-low-balance-${bucket.id}`;
      const existingNotif = updated.find(n => n.id === notifId);
      const isBelowThreshold = bucket.lowBalanceThreshold !== undefined && bucket.lowBalanceThreshold > 0 && bucket.balance < bucket.lowBalanceThreshold;

      if (isBelowThreshold && !existingNotif) {
        updated.unshift({
          id: notifId,
          title: `Low Balance: ${bucket.name}`,
          message: `${bucket.name} balance (${formatCurrency(bucket.balance, userProfile.defaultCurrency)}) has fallen below your set threshold of ${formatCurrency(bucket.lowBalanceThreshold!, userProfile.defaultCurrency)}.`,
          time: new Date().toISOString(),
          type: 'warning',
          read: false
        });
        changed = true;
      } else if (!isBelowThreshold && existingNotif) {
        updated = updated.filter(n => n.id !== notifId);
        changed = true;
      }
    });

    if (changed) {
      setNotifications(updated);
    }
  }, [buckets, userProfile.defaultCurrency]);

  // Trigger dark mode effects
  useEffect(() => {
    const isDarkStored = window.localStorage.getItem('before spend_dark_mode') === 'true';
    setIsDarkMode(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    window.localStorage.setItem('before spend_dark_mode', String(newValue));
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Immutable Ledger: Recalculate bucket running balances directly from transactions
  useEffect(() => {
    const updatedBuckets = buckets.map((bucket) => {
      const calcBalance = transactions
        .filter((t) => t.bucketId === bucket.id)
        .reduce((sum, t) => sum + (t.direction === 'CREDIT' ? t.amount : -t.amount), 0);
      return { ...bucket, balance: calcBalance };
    });

    let balancesChanged = false;
    for (let i = 0; i < updatedBuckets.length; i++) {
      if (updatedBuckets[i].balance !== buckets[i].balance) {
        balancesChanged = true;
        break;
      }
    }

    if (balancesChanged) {
      setBuckets(updatedBuckets);
    }
  }, [transactions]);

  // Toast dispatch helper
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Save payment splits handler (creates CREDIT transactions for each bucket)
  const handleSavePayment = (payment: {
    amount: number;
    currency: string;
    convertedAmount: number;
    splits: any[];
    receiptImage?: string;
  }) => {
    const newEntry: PaymentEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      amount: payment.amount,
      currency: payment.currency,
      convertedAmount: payment.convertedAmount,
      splits: payment.splits,
      receiptImage: payment.receiptImage,
    };

    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);

    // Create immutable ledger double-entry transaction records for each split
    const newLedgerTxns: Transaction[] = payment.splits.map((s) => ({
      id: generateId('txn'),
      bucketId: s.bucketId,
      bucketName: s.bucketName,
      type: 'INCOME_SPLIT',
      amount: s.amount,
      direction: 'CREDIT',
      description: `Income Allocation Split (${payment.currency} ${payment.amount})`,
      receiptUrl: payment.receiptImage,
      sourceType: 'MANUAL_ENTRY',
      createdAt: new Date().toISOString()
    }));

    setTransactions((prev) => [...newLedgerTxns, ...prev]);

    // Dynamic milestone checks right after updates
    setTimeout(() => {
      milestones.forEach((milestone) => {
        const associatedBucket = buckets.find((b) => b.id === milestone.bucketId);
        if (associatedBucket) {
          const preBalance = associatedBucket.balance;
          const splitPortion = payment.splits.find((s) => s.bucketId === milestone.bucketId)?.amount || 0;
          const postBalance = preBalance + splitPortion;
          
          if (preBalance < milestone.targetAmount && postBalance >= milestone.targetAmount) {
            addToast(`🎉 Milestone reached: ${milestone.name}!`, 'success');
          }
        }
      });
    }, 100);
  };

  // Delete/reverse split history item — also removes associated CREDIT ledger entries
  const handleDeleteHistory = (id: string) => {
    const entry = history.find((h) => h.id === id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (entry && entry.splits?.length > 0) {
      const bucketIdsInEntry = new Set(entry.splits.map((s: any) => s.bucketId));
      setTransactions((prev) =>
        prev.filter(
          (t) =>
            !(t.direction === 'CREDIT' &&
              t.type === 'INCOME_SPLIT' &&
              bucketIdsInEntry.has(t.bucketId))
        )
      );
    }
    addToast('Payment reversed and ledger entries removed.', 'info');
  };

  const handleClearHistory = (revertBalances?: boolean) => {
    if (revertBalances) {
      const updatedBuckets = [...buckets];
      history.forEach((entry) => {
        entry.splits.forEach((split) => {
          const bucket = updatedBuckets.find((b) => b.id === split.bucketId);
          if (bucket) {
            bucket.balance -= split.amount;
          }
        });
      });
      setBuckets(updatedBuckets);
      addToast('Split history cleared & bucket balances reversed!', 'info');
    } else {
      addToast('Split history log cleared! Bucket balances remain intact.', 'success');
    }
    setHistory([]);
  };

  // Log expense handler (creates DEBIT transaction)
  const handleAddExpense = (expense: {
    id: string;
    description: string;
    amount: number;
    bucketId: string;
    bucketName: string;
    date: string;
    receiptImage?: string;
  }) => {
    const newTxn: Transaction = {
      id: generateId('txn'),
      bucketId: expense.bucketId,
      bucketName: expense.bucketName,
      type: 'EXPENSE',
      amount: expense.amount,
      direction: 'DEBIT',
      description: expense.description,
      receiptUrl: expense.receiptImage,
      sourceType: 'MANUAL_ENTRY',
      createdAt: new Date(expense.date).toISOString()
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setExpenses((prev) => [expense, ...prev]);
    addToast(`Expense logged: -${formatCurrency(expense.amount, userProfile.defaultCurrency)} from ${expense.bucketName}`, 'success');
  };

  // Handle manual reconciliation adjustment transaction
  const handleReconcileTransaction = (txn: Transaction) => {
    setTransactions((prev) => [txn, ...prev]);
    addToast(`Reconciliation adjustment recorded: ${txn.direction} of ${formatCurrency(txn.amount, userProfile.defaultCurrency)}`, 'success');
  };

  // Handle batch statement import
  const handleBatchImport = (importedTxns: Transaction[], creditSplitTotal?: number) => {
    setTransactions((prev) => [...importedTxns, ...prev]);
    addToast(`Batch imported ${importedTxns.length} statement rows to double-entry ledger!`, 'success');
    if (creditSplitTotal && creditSplitTotal > 0) {
      addToast(`Detected ${formatCurrency(creditSplitTotal, userProfile.defaultCurrency)} deposit inflow. Route in Splits Calculator!`, 'info');
      setActiveTab('split');
    }
  };

  // Delete expense — also removes the corresponding DEBIT ledger transaction to truly restore balance
  const handleDeleteExpense = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (expense) {
      setTransactions((prev) =>
        prev.filter(
          (t) =>
            !(t.direction === 'DEBIT' &&
              t.bucketId === expense.bucketId &&
              t.amount === expense.amount &&
              t.description === expense.description)
        )
      );
    }
    addToast('Expense deleted. Balance restored.', 'info');
  };

  const handleClearExpenses = () => {
    setExpenses([]);
  };

  // Milestone actions
  const handleAddMilestone = (milestone: Milestone) => {
    setMilestones((prev) => [...prev, milestone]);
    addToast(`Milestone set: ${milestone.name}`, 'success');
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    addToast('Milestone deleted.', 'info');
  };

  // Reminder actions
  const handleAddReminder = (reminder: Reminder) => {
    setReminders((prev) => [...prev, reminder]);
    addToast(`Reminder set!`, 'success');
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          // If auto subscription and toggled to true/done, let's auto renew or suggest next month
          const updatedDone = !r.done;
          if (updatedDone && r.type === 'auto') {
            // Suggest moving renewal to next month!
            setTimeout(() => {
              const confirmRenew = window.confirm(
                `Would you like to auto-schedule the next renewal date for "${r.text}"? This will advance the due date by 1 month.`
              );
              if (confirmRenew) {
                setReminders((currReminders) =>
                  currReminders.map((cr) => {
                    if (cr.id === id) {
                      const currentDueDate = new Date(cr.dueDate);
                      if (cr.period === 'yearly') {
                        currentDueDate.setFullYear(currentDueDate.getFullYear() + 1);
                      } else {
                        currentDueDate.setMonth(currentDueDate.getMonth() + 1);
                      }
                      return {
                        ...cr,
                        dueDate: currentDueDate.toISOString().split('T')[0],
                        done: false, // reset back to undone for next month!
                      };
                    }
                    return cr;
                  })
                );
                addToast(`Advanced renewal date for ${r.text}`, 'success');
              }
            }, 150);
          }
          return { ...r, done: updatedDone };
        }
        return r;
      })
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    addToast('Reminder removed.', 'info');
  };

  // Sorting Reminders: undone first, then sorted by due date
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Settings: Edit bucket save
  const handleSaveEditedBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBucket) return;

    if (!tempBucketName.trim()) {
      addToast('Please enter a bucket name.', 'error');
      return;
    }

    const parsedPercent = parseFloat(tempBucketPercentage.toString());
    if (isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
      addToast('Percentage must be between 0 and 100.', 'error');
      return;
    }

    // Check if new total exceeds 100%
    const otherBucketsPercent = buckets
      .filter((b) => b.id !== editingBucket.id)
      .reduce((sum, b) => sum + b.percentage, 0);

    const newTotal = otherBucketsPercent + parsedPercent;

    const parsedThreshold = tempBucketThreshold !== '' && tempBucketThreshold !== undefined 
      ? parseFloat(tempBucketThreshold.toString()) 
      : undefined;

    const updatedBuckets = buckets.map((b) => {
      if (b.id === editingBucket.id) {
        return {
          ...b,
          name: tempBucketName.trim(),
          percentage: parsedPercent,
          destinationAccount: tempBucketAccount.trim(),
          color: tempBucketColor,
          note: tempBucketNote.trim() || undefined,
          lowBalanceThreshold: parsedThreshold !== undefined && !isNaN(parsedThreshold) && parsedThreshold > 0 ? parsedThreshold : undefined,
        };
      }
      return b;
    });

    setBuckets(updatedBuckets);
    setShowEditBucketModal(false);
    setEditingBucket(null);
    addToast('Bucket configuration updated!', 'success');

    if (newTotal !== 100) {
      addToast(`⚠️ Visual Warning: Total allocation is currently ${newTotal}%. It must equal 100% for precise automatic calculations.`, 'warning');
    }
  };

  // Settings: Add custom bucket
  const handleAddCustomBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) {
      addToast('Please enter a bucket name.', 'error');
      return;
    }

    const parsedPercent = parseFloat(newBucketPercentage.toString());
    if (isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
      addToast('Percentage must be between 0 and 100.', 'error');
      return;
    }

    const currentTotal = buckets.reduce((sum, b) => sum + b.percentage, 0);
    const newTotal = currentTotal + parsedPercent;

    const parsedThreshold = newBucketThreshold !== '' && newBucketThreshold !== undefined 
      ? parseFloat(newBucketThreshold.toString()) 
      : undefined;

    const newBucket: Bucket = {
      id: 'custom-' + generateId(),
      name: newBucketName.trim(),
      percentage: parsedPercent,
      color: newBucketColor,
      destinationAccount: newBucketAccount.trim() || 'Fidelity',
      note: newBucketNote.trim() || undefined,
      balance: 0,
      lowBalanceThreshold: parsedThreshold !== undefined && !isNaN(parsedThreshold) && parsedThreshold > 0 ? parsedThreshold : undefined,
    };

    setBuckets([...buckets, newBucket]);
    setShowAddCustomBucketModal(false);
    
    // Reset Form
    setNewBucketName('');
    setNewBucketPercentage(0);
    setNewBucketAccount('');
    setNewBucketColor('emerald');
    setNewBucketNote('');
    setNewBucketThreshold('');

    addToast('Custom budget bucket added!', 'success');

    if (newTotal !== 100) {
      addToast(`⚠️ Visual Warning: Total allocation is currently ${newTotal}%. It must equal 100% for precise automatic calculations.`, 'warning');
    }
  };

  // Delete custom bucket
  const handleDeleteBucket = (id: string) => {
    const bucketToDelete = buckets.find((b) => b.id === id);
    if (!bucketToDelete) return;

    if (bucketToDelete.balance !== 0) {
      const confirmForce = window.confirm(
        `This bucket currently holds ${formatCurrency(bucketToDelete.balance, userProfile.defaultCurrency)}. Deleting it will re-route these funds. Do you wish to proceed?`
      );
      if (!confirmForce) return;
    }

    setBuckets(buckets.filter((b) => b.id !== id));
    addToast('Bucket deleted successfully.', 'info');
  };

  // Reset buckets to template
  const handleLoadTemplate = (template: typeof BUCKET_TEMPLATES[0]) => {
    const confirmTemplate = window.confirm(
      `Loading template "${template.name}" will completely replace your current budget buckets. Running balances will reset to 0. Do you wish to proceed?`
    );
    if (!confirmTemplate) return;

    const loaded: Bucket[] = template.buckets.map((b, idx) => ({
      id: `t-${idx}-${generateId()}`,
      name: b.name,
      percentage: b.percentage,
      color: b.color,
      destinationAccount: b.destinationAccount,
      note: b.note,
      balance: 0,
    }));

    setBuckets(loaded);
    setHistory([]);
    setExpenses([]);
    addToast(`Loaded ${template.name} template!`, 'success');
  };

  const handleResetToDefaultBuckets = () => {
    const confirmReset = window.confirm('Reset all buckets back to default freelance setup? This will clear history and expenses.');
    if (!confirmReset) return;

    setBuckets(DEFAULT_BUCKETS);
    setHistory([]);
    setExpenses([]);
    addToast('Reset to default configurations completed.', 'success');
  };

  // User Profile save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile({
      name: editProfileName,
      email: editProfileEmail,
      role: editProfileRole,
      defaultCurrency: editProfileCurrency,
      avatar: editProfileAvatar,
      phoneNumber: userProfile.phoneNumber, // preserve phone number — never silently drop it
    });
    addToast('Profile configuration saved!', 'success');
  };

  // Database simulator functions
  const handleExportDb = () => {
    const fullDb = {
      buckets,
      history,
      expenses,
      milestones,
      reminders,
      userProfile,
      exchangeRates,
    };
    setRawDbJson(JSON.stringify(fullDb, null, 2));
    addToast('Database snapshot generated! Copy it below.', 'success');
  };

  const handleImportDb = () => {
    try {
      const parsed = JSON.parse(rawDbJson);
      if (parsed.buckets) setBuckets(parsed.buckets);
      if (parsed.history) setHistory(parsed.history);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.milestones) setMilestones(parsed.milestones);
      if (parsed.reminders) setReminders(parsed.reminders);
      if (parsed.userProfile) setUserProfile(parsed.userProfile);
      if (parsed.exchangeRates) setExchangeRates(parsed.exchangeRates);

      addToast('Database snapshot successfully imported! Refreshing state.', 'success');
      setShowImportDbModal(false);
    } catch (e) {
      addToast('Invalid JSON structure. Please verify details.', 'error');
    }
  };

  const calculateLocalStorageQuota = () => {
    let total = 0;
    for (const key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        total += (window.localStorage[key].length * 2) / 1024; // KB
      }
    }
    return total.toFixed(2);
  };

  // 1.3 Admin center API actions
  const isAdmin = userProfile.role === 'Platform Administrator' || userProfile.email.toLowerCase() === 'admin@beforespend.app' || userProfile.email.toLowerCase() === 'admin@beforespend.xyz';

  // Standalone Admin Command Center overlay state - auto-open for admins on login
  const [showAdminCenter, setShowAdminCenter] = useState(false);

  // Auto-redirect admin directly to Admin Command Center on login
  useEffect(() => {
    if (isAdmin) {
      setShowAdminCenter(true);
    }
  }, [isAdmin]);

  // Keyboard shortcut: Ctrl+Shift+A toggles Admin Command Center (admins only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAdmin && e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminCenter(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      loadAdminData();
    }
  }, [activeTab, isAdmin]);

  async function loadAdminData() {
    setAdminIsLoading(true);
    try {
      const [profiles, dbBuckets, txns, dbPayments, dbReminders] = await Promise.all([
        adminLoadProfilesFromSupabase(),
        adminLoadBucketsFromSupabase(),
        adminLoadTransactionsFromSupabase(),
        adminLoadPaymentsFromSupabase(),
        adminLoadRemindersFromSupabase()
      ]);
      
      if (profiles) setAdminProfiles(profiles);
      if (dbBuckets) setAdminBuckets(dbBuckets);
      if (txns) setAdminTransactions(txns);
      if (dbPayments) setAdminPayments(dbPayments);
      if (dbReminders) setAdminReminders(dbReminders);
    } catch (err) {
      console.error('Failed to load administrative data:', err);
    } finally {
      setAdminIsLoading(false);
    }
  }

  async function handleAdminSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!adminEditingUser) return;
    const success = await adminUpdateProfileInSupabase(adminEditingUser.id, {
      name: adminEditUserName,
      email: adminEditUserEmail,
      role: adminEditUserRole,
      defaultCurrency: adminEditUserCurrency
    });
    if (success) {
      addToast('User profile updated successfully!', 'success');
      setAdminEditingUser(null);
      loadAdminData();
    } else {
      addToast('Failed to update user profile.', 'error');
    }
  }

  async function handleAdminDeleteProfile(userId: string) {
    if (!window.confirm('Are you absolutely sure you want to delete this user profile and ALL their associated financial ledger records? This cannot be undone.')) {
      return;
    }
    const success = await adminDeleteProfileFromSupabase(userId);
    if (success) {
      addToast('User profile and associated data deleted.', 'success');
      loadAdminData();
    } else {
      addToast('Failed to delete user profile.', 'error');
    }
  }

  async function handleAdminSaveBucket(e: React.FormEvent) {
    e.preventDefault();
    if (!adminEditingBucket) return;
    const success = await adminUpdateBucketInSupabase(adminEditingBucket.id, {
      name: adminEditBucketName,
      allocationPercentage: adminEditBucketPercentage,
      color: adminEditBucketColor,
      destinationAccount: adminEditBucketAccount,
      targetBank: adminEditBucketBank,
      note: adminEditBucketNote
    });
    if (success) {
      addToast('Bucket updated successfully!', 'success');
      setAdminEditingBucket(null);
      loadAdminData();
    } else {
      addToast('Failed to update bucket.', 'error');
    }
  }

  async function handleAdminDeleteBucket(bucketId: string) {
    if (!window.confirm('Are you sure you want to delete this bucket?')) return;
    const success = await adminDeleteBucketFromSupabase(bucketId);
    if (success) {
      addToast('Bucket deleted successfully.', 'success');
      loadAdminData();
    } else {
      addToast('Failed to delete bucket.', 'error');
    }
  }

  async function handleAdminSaveTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!adminEditingTransaction) return;
    const success = await adminUpdateTransactionInSupabase(adminEditingTransaction.id, {
      description: adminEditTransactionDesc,
      amount: adminEditTransactionAmount,
      type: adminEditTransactionType,
      direction: adminEditTransactionDirection
    });
    if (success) {
      addToast('Transaction updated successfully!', 'success');
      setAdminEditingTransaction(null);
      loadAdminData();
    } else {
      addToast('Failed to update transaction.', 'error');
    }
  }

  async function handleAdminDeleteTransaction(transactionId: string) {
    if (!window.confirm('Are you sure you want to delete this ledger transaction?')) return;
    const success = await adminDeleteTransactionFromSupabase(transactionId);
    if (success) {
      addToast('Transaction deleted from ledger.', 'success');
      loadAdminData();
    } else {
      addToast('Failed to delete transaction.', 'error');
    }
  }

  async function handleAdminBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!adminBroadcastTitle.trim() || !adminBroadcastMessage.trim()) {
      addToast('Please fill out the notification title and message.', 'warning');
      return;
    }
    setAdminIsLoading(true);
    const success = await adminBroadcastNotificationToAll(
      adminBroadcastTitle.trim(),
      adminBroadcastMessage.trim(),
      adminBroadcastType
    );
    setAdminIsLoading(false);
    if (success) {
      addToast('Global notification broadcasted to all users!', 'success');
      setAdminBroadcastTitle('');
      setAdminBroadcastMessage('');
      setAdminBroadcastType('info');
    } else {
      addToast('Failed to broadcast global notification.', 'error');
    }
  }

  const currentTotalAllocPercentage = buckets.reduce((sum, b) => sum + b.percentage, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200 font-sans flex flex-col md:flex-row pb-16 md:pb-0">
      
      {/* Toast Overlay */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Admin Command Center — Full-screen overlay, admins only */}
      {isAdmin && showAdminCenter && (
        <AdminCommandCenter
          currentUserId={currentUserId}
          userProfile={userProfile}
          onExit={() => setShowAdminCenter(false)}
          onLogout={onLogout}
          exchangeRates={exchangeRates}
          setExchangeRates={setExchangeRates}
          rawDbJson={rawDbJson}
          setRawDbJson={setRawDbJson}
          handleExportDb={handleExportDb}
          handleImportDb={handleImportDb}
          showImportDbModal={showImportDbModal}
          setShowImportDbModal={setShowImportDbModal}
          calculateLocalStorageQuota={calculateLocalStorageQuota}
          formatCurrency={formatCurrency}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          notifications={notifications}
          setNotifications={setNotifications}
        />
      )}

      {/* DESKTOP SIDEBAR (md and up) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 p-6 space-y-6 flex-shrink-0 sticky top-0 h-screen">
        {/* Brand Logo */}
        <div 
          onClick={onGoToLanding} 
          className="cursor-pointer hover:opacity-85 transition-opacity" 
          title="View Homepage / About"
        >
          <BeforeSpendLogo size="md" />
        </div>

        {/* User Profile Block */}
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-800 rounded-2xl space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-zinc-800">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-gray-900 dark:text-zinc-100 truncate">{userProfile.name}</p>
              <p className="text-[9px] text-[#00A896] font-bold truncate">{userProfile.role}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-150 dark:border-zinc-850 text-[10px] text-gray-500">
            <span className="flex items-center gap-1 font-bold">
              Total Managed
              <button 
                onClick={() => setHideBalance(!hideBalance)}
                className="text-gray-400 hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors p-0.5 rounded cursor-pointer"
                title={hideBalance ? "Reveal balances" : "Hide balances"}
              >
                {hideBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </span>
            <span className={`font-black text-[#00A896] transition-all duration-300 ${hideBalance ? 'blur-md select-none' : ''}`}>
              {formatCurrency(buckets.reduce((sum, b) => sum + b.balance, 0), userProfile.defaultCurrency)}
            </span>
          </div>
        </div>

        {/* Desktop Sidebar Navigation links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-none">
          {[
            { id: 'buckets', label: 'Dashboard & Categories', icon: Layers },
            { id: 'ledger', label: 'Transactions & Statements', icon: Scale },
            { id: 'split', label: 'Income Splitter', icon: Wallet },
            { id: 'calculators', label: 'Money Calculators', icon: Calculator },
            { id: 'expenses', label: 'Expense Tracker', icon: TrendingDown },
            { id: 'history', label: 'Payment History', icon: History },
            { id: 'milestones', label: 'Savings Goals', icon: Target },
            { id: 'reminders', label: 'Bills & Reminders', icon: Bell },
            { id: 'analytics', label: 'Spending Insights', icon: BarChart3 },
            { id: 'settings', label: 'Account Settings', icon: Settings },
            { id: 'admin', label: 'Backups & Data', icon: Database },
            { id: 'home_landing', label: 'Homepage / About', icon: Globe },
          ].filter(tab => tab.id !== 'admin' || !isAdmin).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'home_landing') {
                    onGoToLanding?.();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#00A896]/10 text-[#0E2A47] dark:text-[#00A896] border-l-4 border-[#00A896]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-850/50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin Console access button - visible to admins only */}
        {isAdmin && (
          <button
            onClick={() => setShowAdminCenter(true)}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer text-left bg-[#00A896]/10 text-[#00A896] border border-[#00A896]/20 hover:bg-[#00A896]/20 mb-2"
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Admin Console</span>
          </button>
        )}

        {/* Bottom Theme and Logout Action buttons */}
        <div className="pt-4 border-t border-gray-150 dark:border-zinc-800 flex gap-2">
          <button
            onClick={toggleDarkMode}
            className="flex-1 py-2 px-3 rounded-lg border border-gray-250 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-gray-500 dark:text-zinc-400 hover:text-[#00A896] transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-bold"
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-[#00A896]" />}
            Theme
          </button>
          <button
            onClick={onLogout}
            className="py-2 px-3 rounded-lg border border-gray-250 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* MOBILE TOPBAR (md and below) */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 shadow-xs">
        <div 
          onClick={onGoToLanding} 
          className="cursor-pointer hover:opacity-85 transition-opacity" 
          title="View Homepage / About"
        >
          <BeforeSpendLogo size="md" />
        </div>

        <div className="flex items-center gap-2">
          {/* Advanced Notification System */}
          <NotificationBell 
            notifications={notifications} 
            setNotifications={setNotifications} 
            onNavigate={(tabId) => setActiveTab(tabId)}
            currentUserId={currentUserId}
          />

          {/* Theme Switcher */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg border border-gray-250 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-zinc-400 cursor-pointer"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-[#00A896]" />}
          </button>

          {/* Quick Profile Avatar */}
          <button
            onClick={() => setActiveTab('settings')}
            className="w-8 h-8 rounded-xl overflow-hidden focus:outline-none cursor-pointer"
          >
            <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION (md and below) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-250 dark:border-zinc-850 z-40 flex items-center justify-around py-1.5 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-lg">
        {[
          { id: 'buckets', label: 'Home', icon: Layers },
          { id: 'split', label: 'Splits', icon: Wallet },
          { id: 'expenses', label: 'Expenses', icon: TrendingDown },
          { id: 'history', label: 'History', icon: History },
          { id: 'hub', label: 'More', icon: LayoutGrid },
        ].map((tab) => {
          const Icon = tab.icon;
          const isHubTabActive = ['milestones', 'reminders', 'analytics', 'settings', 'admin', 'calculators', 'hub'].includes(activeTab);
          const isActive = tab.id === 'hub' ? isHubTabActive : activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'hub') {
                  setActiveTab('hub');
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-[#00A896] dark:text-[#00A896] font-bold' 
                  : 'text-gray-400 dark:text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-black tracking-wider uppercase">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto w-full px-4 md:px-8 py-6 space-y-6 md:overflow-y-auto">
        
        {/* Mobile Header Banner showing balance */}
        <div className="md:hidden p-4 rounded-2xl bg-gradient-to-r from-[#0E2A47] to-[#00A896] text-white shadow-xs flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-teal-100 uppercase tracking-wider font-semibold">Total Managed Balance</span>
              <button 
                onClick={() => setHideBalance(!hideBalance)}
                className="text-teal-200 hover:text-white transition-colors p-0.5 rounded cursor-pointer"
                title={hideBalance ? "Reveal balances" : "Hide balances"}
              >
                {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className={`text-xl font-black transition-all duration-300 ${hideBalance ? 'blur-md select-none' : ''}`}>
              {formatCurrency(buckets.reduce((sum, b) => sum + b.balance, 0), userProfile.defaultCurrency)}
            </p>
          </div>
          <div className="text-right text-[10px] text-teal-100">
            <p className="font-bold">{userProfile.name}</p>
            <p className="opacity-80">{userProfile.role}</p>
          </div>
        </div>

        {/* Dynamic Page Header & Desktop Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-zinc-850">
          <div className="min-w-0 flex-1">
            {activeTab !== 'buckets' && PAGE_TITLES[activeTab] ? (
              <div className="space-y-1">
                <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 tracking-tight">
                  {PAGE_TITLES[activeTab].title}
                </h2>
                <p className="text-xs text-gray-400">
                  {PAGE_TITLES[activeTab].subtext}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Workspace Dashboard</span>
                <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-300">Welcome, {userProfile.name}</h2>
              </div>
            )}
          </div>

          {/* Desktop Controls (Beside Theme and Profile) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Advanced Notification System */}
            <NotificationBell 
              notifications={notifications} 
              setNotifications={setNotifications} 
              onNavigate={(tabId) => setActiveTab(tabId)}
              currentUserId={currentUserId}
            />

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-[#00A896]/50 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 cursor-pointer transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#00A896]" />}
            </button>

            {/* Profile Avatar Trigger */}
            <button
              onClick={() => setActiveTab('settings')}
              className="w-8.5 h-8.5 rounded-full overflow-hidden focus:outline-none cursor-pointer border border-gray-200 dark:border-zinc-800 hover:border-[#00A896] transition-colors shadow-2xs"
              title="View Account Profile"
            >
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
            </button>
          </div>
        </div>

        <main className="flex-1">

          {/* 0. MOBILE HUB TAB (Mobile portal for sub-menus) */}
          {activeTab === 'hub' && (
            <div id="view-hub-tab" className="space-y-6 md:hidden">
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { id: 'ledger', label: 'Ledger Audit', desc: 'Double-entry log & statements', icon: Scale, color: 'bg-teal-50 border-teal-100 dark:bg-teal-950/10 dark:border-teal-900/20 text-[#00A896] dark:text-[#00A896] hover:bg-teal-100/50' },
                  { id: 'milestones', label: 'Milestones', desc: 'Savings & goals tracker', icon: Target, color: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50' },
                  { id: 'reminders', label: 'Reminders', desc: 'Subscriptions & bills', icon: Bell, color: 'bg-amber-50 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100/50' },
                  { id: 'calculators', label: 'Calculators', desc: 'Compound & loan schedules', icon: Calculator, color: 'bg-teal-50 border-teal-100 dark:bg-teal-950/10 dark:border-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100/50' },
                  { id: 'analytics', label: 'Analytics', desc: 'Income & spending insights', icon: BarChart3, color: 'bg-sky-50 border-sky-100 dark:bg-sky-950/10 dark:border-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100/50' },
                  { id: 'settings', label: 'Settings', desc: 'Configure account settings', icon: Settings, color: 'bg-gray-100 border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200/50 dark:hover:bg-zinc-850' },
                  { id: 'admin', label: 'Database', desc: 'Import or export local backups', icon: Database, color: 'bg-purple-50 border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100/50' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${item.color}`}
                    >
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 w-fit">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black tracking-tight">{item.label}</p>
                        <p className="text-[10px] opacity-80 line-clamp-1">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Logout Banner */}
              <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 dark:bg-rose-950/10 dark:border-rose-900/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-400">Need to switch profiles?</p>
                  <p className="text-[10px] text-gray-400">Safely log out of this workspace</p>
                </div>
                <button
                  onClick={onLogout}
                  className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* 0.1 IMMUTABLE DOUBLE-ENTRY LEDGER TAB */}
          {activeTab === 'ledger' && (
            <div id="view-ledger-tab" className="space-y-6">
              <LedgerTable
                transactions={transactions}
                buckets={buckets}
                currency={userProfile.defaultCurrency}
                onOpenReconciliation={(bId) => {
                  setReconciliationBucketId(bId);
                  setShowReconciliationModal(true);
                }}
                onOpenStatementParser={() => setShowStatementParserModal(true)}
              />
            </div>
          )}

          {/* 1. SPLIT CALCULATOR TAB */}
          {activeTab === 'split' && (
            <div id="view-split-tab" className="space-y-6">
              {currentTotalAllocPercentage !== 100 && (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">Allocation Mismatch ({currentTotalAllocPercentage}%)</span>: Budget percentages must sum to exactly 100% for precise automatic split calculations. Update this in the <span className="underline cursor-pointer font-bold" onClick={() => setActiveTab('settings')}>Settings Tab</span>.
                  </div>
                </div>
              )}
              <SplitCalculator 
                buckets={buckets}
                defaultCurrency={userProfile.defaultCurrency}
                exchangeRates={exchangeRates}
                onSavePayment={handleSavePayment}
                addToast={addToast}
              />
            </div>
          )}

          {/* 1.1 FINANCIAL CALCULATORS TAB */}
          {activeTab === 'calculators' && (
            <div id="view-calculators-tab" className="space-y-6">
              <FinanceCalculators 
                currency={userProfile.defaultCurrency}
              />
            </div>
          )}

          {/* 2. EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div id="view-expenses-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <ExpenseForm 
                  buckets={buckets}
                  currency={userProfile.defaultCurrency}
                  onAdd={handleAddExpense}
                  addToast={addToast}
                />
              </div>
              <div className="lg:col-span-8 space-y-5">
                <ExpensePieChart 
                  expenses={expenses}
                  buckets={buckets}
                  currency={userProfile.defaultCurrency}
                />
                <ExpenseList 
                  expenses={expenses}
                  buckets={buckets}
                  currency={userProfile.defaultCurrency}
                  onDeleteExpense={handleDeleteExpense}
                  onClearAll={handleClearExpenses}
                  addToast={addToast}
                />
              </div>
            </div>
          )}

          {/* 3. BUCKETS TAB */}
          {activeTab === 'buckets' && (
            <div id="view-buckets-tab" className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-base font-black text-gray-900 dark:text-zinc-50">
                  Budget Allocations Breakdown
                </h2>
                <button
                  id="add-custom-bucket-trigger"
                  onClick={() => setShowAddCustomBucketModal(true)}
                  className="text-xs font-bold text-[#00A896] hover:text-[#0E2A47] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Custom Bucket
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {buckets.map((bucket) => (
                  <div key={bucket.id} className="relative group">
                    <BucketCard 
                      bucket={bucket}
                      currency={userProfile.defaultCurrency}
                      hideBalance={hideBalance}
                    />
                    
                    {/* Hover delete button for Custom Buckets */}
                    {bucket.id.startsWith('custom-') && (
                      <button
                        id={`delete-custom-bucket-${bucket.id}`}
                        onClick={() => handleDeleteBucket(bucket.id)}
                        className="absolute bottom-4 right-4 p-1 rounded bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 text-gray-400 dark:bg-zinc-900 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete custom bucket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. MILESTONES TAB */}
          {activeTab === 'milestones' && (
            <div id="view-milestones-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <MilestoneForm 
                  buckets={buckets}
                  currency={userProfile.defaultCurrency}
                  onAdd={handleAddMilestone}
                />
              </div>
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider block px-1">Active Milestones</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {milestones.length === 0 ? (
                    <div className="col-span-full text-center py-12 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-2">
                      <Target className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700 stroke-[1.5]" />
                      <h4 className="font-bold text-gray-700 dark:text-zinc-300 text-sm">No savings milestones set</h4>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Create goals like hardware, workstation builds, or runways to see progress updates on every payment split!
                      </p>
                    </div>
                  ) : (
                    milestones.map((milestone) => (
                      <MilestoneCard 
                        key={milestone.id}
                        milestone={milestone}
                        associatedBucket={buckets.find((b) => b.id === milestone.bucketId)}
                        currency={userProfile.defaultCurrency}
                        onDelete={handleDeleteMilestone}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. REMINDERS & SUBS TAB */}
          {activeTab === 'reminders' && (
            <div id="view-reminders-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <ReminderForm 
                  currency={userProfile.defaultCurrency}
                  onAdd={handleAddReminder}
                />
              </div>
              <div className="lg:col-span-8 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider block">Financial Deadlines & Subs</h3>
                  <span className="text-xs text-gray-400 font-medium">Undone items listed first</span>
                </div>

                <div className="space-y-2">
                  {sortedReminders.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-2">
                      <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700 stroke-[1.5]" />
                      <h4 className="font-bold text-gray-700 dark:text-zinc-300 text-sm">All clear! No pending reminders</h4>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Track upcoming invoices, service domain registrations, and recurring subscription cancel triggers easily.
                      </p>
                    </div>
                  ) : (
                    sortedReminders.map((reminder) => (
                      <ReminderItem 
                        key={reminder.id}
                        reminder={reminder}
                        currency={userProfile.defaultCurrency}
                        onToggle={handleToggleReminder}
                        onDelete={handleDeleteReminder}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. HISTORY TAB */}
          {activeTab === 'history' && (
            <div id="view-history-tab">
              <HistoryEntryList 
                history={history}
                currency={userProfile.defaultCurrency}
                onDeleteHistory={handleDeleteHistory}
                onClearAll={handleClearHistory}
                addToast={addToast}
              />
            </div>
          )}

          {/* 7. ANALYTICS / CHARTS TAB */}
          {activeTab === 'analytics' && (
            <div id="view-analytics-tab">
              <FinanceCharts 
                buckets={buckets}
                history={history}
                expenses={expenses}
                currency={userProfile.defaultCurrency}
              />
            </div>
          )}

          {/* 8. SETTINGS & TEMPLATES TAB */}
          {activeTab === 'settings' && (
            <div id="view-settings-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Profile Config Form */}
              <div className="lg:col-span-4 space-y-5">
                <form
                  id="profile-settings-form"
                  onSubmit={handleSaveProfile}
                  className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-5 h-5 text-[#00A896]" />
                    <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
                      Account Profile Details
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Interactive Avatar Selection */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider mb-2">Profile Avatar</label>
                      <div className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-gray-150 dark:border-zinc-850">
                        <Avatar avatar={editProfileAvatar} name={editProfileName} className="w-12 h-12 text-base flex-shrink-0" />
                        <div className="space-y-1 flex-1">
                          <input
                            type="file"
                            id="avatar-upload-input"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  addToast('Image size should be less than 2MB', 'error');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    setEditProfileAvatar(reader.result);
                                    addToast('Avatar uploaded! Click Save Changes below to save.', 'success');
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor="avatar-upload-input"
                            className="px-2.5 py-1.5 bg-[#00A896] hover:bg-[#0E2A47] text-white text-[10px] font-bold rounded-lg shadow-2xs cursor-pointer transition-colors inline-flex items-center gap-1 select-none"
                          >
                            <Upload className="w-3 h-3" /> Upload Device Image
                          </label>
                          <p className="text-[9px] text-gray-400 leading-tight">Supports PNG, JPEG or WebP (max 2MB).</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editProfileName}
                        onChange={(e) => setEditProfileName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Your Profile Role / Tagline</label>
                      <input
                        type="text"
                        value={editProfileRole}
                        onChange={(e) => setEditProfileRole(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={editProfileEmail}
                        onChange={(e) => setEditProfileEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Default Base Currency</label>
                      <select
                        value={editProfileCurrency}
                        onChange={(e) => setEditProfileCurrency(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none cursor-pointer"
                      >
                        <option value="NGN">Naira (₦ NGN)</option>
                        <option value="USD">US Dollar ($ USD)</option>
                        <option value="GBP">Pound Sterling (£ GBP)</option>
                        <option value="EUR">Euro (€ EUR)</option>
                        <option value="CAD">Canadian Dollar (C$ CAD)</option>
                      </select>
                    </div>

                    <button
                      id="save-profile-button"
                      type="submit"
                      className="w-full py-2 px-4 rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      Save Account Profile
                    </button>

                    <button
                      id="settings-logout-button"
                      type="button"
                      onClick={onLogout}
                      className="w-full py-2 px-4 rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-700 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-900 text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out of Account
                    </button>
                  </div>
                </form>

                {/* Account Mapping Reference Info Card */}
                <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-sm space-y-3">
                  <h4 className="font-bold text-gray-900 dark:text-zinc-50 text-xs uppercase tracking-wider">
                    Bank Vault Routing Reference
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0E2A47] dark:bg-[#00A896] mt-1.5" />
                      <div>
                        <strong className="text-gray-800 dark:text-zinc-200 font-bold">Fidelity Savings & Current</strong>: Recurrent Business Reserves, operating expenses, quarterly bonus vaults.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00A896] mt-1.5" />
                      <div>
                        <strong className="text-gray-800 dark:text-zinc-200 font-bold">OPay Vaults</strong>: Personal income channels, salary draws, standard lifestyle pockets.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                      <div>
                        <strong className="text-gray-800 dark:text-zinc-200 font-bold">Kuda Locked</strong>: Highly isolated tax pools and long-term emergency reservoirs.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bucket Allocation Manager & Templates */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Bucket Allocation Table list */}
                <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
                        Budget Buckets Setup
                      </h3>
                      <p className="text-xs text-gray-400">Specify running splits, accounts, and color tags.</p>
                    </div>
                    <button
                      id="reset-to-defaults-btn"
                      onClick={handleResetToDefaultBuckets}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-500">
                      <thead>
                        <tr className="border-b border-gray-150 dark:border-zinc-900 pb-2 text-gray-400 font-bold">
                          <th className="py-2 font-bold">Bucket Name</th>
                          <th className="py-2 font-bold">Account</th>
                          <th className="py-2 font-bold text-center">Percentage</th>
                          <th className="py-2 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-900">
                        {buckets.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/10">
                            <td className="py-2.5 font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full bg-${b.color}-500`} style={{ backgroundColor: b.color }} />
                              {b.name}
                            </td>
                            <td className="py-2.5 font-semibold text-gray-600 dark:text-zinc-400">{b.destinationAccount}</td>
                            <td className="py-2.5 font-bold text-center text-gray-900 dark:text-zinc-50">{b.percentage}%</td>
                            <td className="py-2.5 text-right space-x-2">
                              <button
                                id={`edit-bucket-btn-${b.id}`}
                                onClick={() => {
                                  setEditingBucket(b);
                                  setTempBucketName(b.name);
                                  setTempBucketPercentage(b.percentage);
                                  setTempBucketAccount(b.destinationAccount);
                                  setTempBucketColor(b.color);
                                  setTempBucketNote(b.note || '');
                                  setTempBucketThreshold(b.lowBalanceThreshold !== undefined ? b.lowBalanceThreshold : '');
                                  setShowEditBucketModal(true);
                                }}
                                className="text-[#00A896] hover:text-[#0E2A47] font-bold hover:underline cursor-pointer"
                              >
                                Configure
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center pt-2 text-xs font-bold">
                    <span className="text-gray-400">Total Split Allocations:</span>
                    <span className={currentTotalAllocPercentage === 100 ? 'text-[#00A896]' : 'text-rose-500'}>
                      {currentTotalAllocPercentage}% / 100%
                    </span>
                  </div>
                </div>

                {/* Templates Box */}
                <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#00A896] animate-pulse" /> Load Industry Blueprints
                    </h3>
                    <p className="text-xs text-gray-400">Load system budget setups directly mapped to global standards.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BUCKET_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.name}
                        id={`template-card-${tmpl.name.replace(/\s+/g, '-').toLowerCase()}`}
                        className="p-4 rounded-xl border border-gray-200 hover:border-[#00A896] dark:border-zinc-800 dark:hover:border-zinc-700 bg-gray-50/20 dark:bg-zinc-950/25 flex flex-col justify-between gap-3.5 group/tmpl"
                      >
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-zinc-100 text-xs">
                            {tmpl.name}
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {tmpl.description}
                          </p>
                        </div>
                        <button
                          id={`apply-template-btn-${tmpl.name.replace(/\s+/g, '-').toLowerCase()}`}
                          onClick={() => handleLoadTemplate(tmpl)}
                          className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold bg-white hover:bg-teal-50 border border-gray-200 text-gray-700 group-hover/tmpl:border-[#00A896] dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:text-zinc-200 dark:border-zinc-800 transition-all cursor-pointer"
                        >
                          Apply Blueprint
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 9. ADMIN CENTER TAB */}
          {activeTab === 'admin' && (
            !isAdmin ? (
              <div id="view-admin-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Stats & Exchange Rates */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Local Storage details */}
                  <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-sm flex items-center gap-2">
                      <Database className="w-5 h-5 text-[#00A896]" /> BeforeSpend Storage Space
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-medium">Storage Space Used:</span>
                        <span className="font-bold text-gray-700 dark:text-zinc-200">{calculateLocalStorageQuota()} KB / 5120 KB</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, (parseFloat(calculateLocalStorageQuota()) / 5120) * 100)}%` }}
                          className="h-full bg-[#00A896] rounded-full"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400">All your financial data is saved privately on your device.</p>
                    </div>
                  </div>

                  {/* Exchange Rates Config */}
                  <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-sm flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#00A896]" /> Exchange Rates Manager
                    </h3>
                    <p className="text-xs text-gray-400">Configure global Naira (₦) equivalents for freelance payments.</p>
                    
                    <div className="space-y-2.5 pt-1">
                      {Object.keys(exchangeRates).filter(k => k !== 'NGN').map((currencyCode) => (
                        <div key={currencyCode} className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700 dark:text-zinc-300">1 {currencyCode} Equivalent (₦)</span>
                          <input
                            id={`exchange-rate-input-${currencyCode}`}
                            type="number"
                            value={exchangeRates[currencyCode]}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              setExchangeRates({ ...exchangeRates, [currencyCode]: val });
                            }}
                            className="w-24 px-2 py-1 text-xs text-right rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#00A896]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Database Snapshot (raw backup JSON) */}
                <div className="lg:col-span-7">
                  <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
                          Data Backup & Restore
                        </h3>
                        <p className="text-xs text-gray-400">Easily export a backup file or restore your saved data anytime.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="export-db-button"
                          onClick={handleExportDb}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Export Backup
                        </button>
                        <button
                          id="import-db-modal-trigger"
                          onClick={() => setShowImportDbModal(true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 border border-teal-100 text-[#00A896] dark:bg-teal-950/20 dark:hover:bg-teal-950/40 dark:border-teal-900 dark:text-[#00A896] transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Restore Backup
                        </button>
                      </div>
                    </div>

                    <textarea
                      id="admin-raw-json-textarea"
                      value={rawDbJson}
                      onChange={(e) => setRawDbJson(e.target.value)}
                      placeholder='Click "Export DB" to inspect raw JSON schemas or paste a validated backup here...'
                      className="w-full h-80 px-3 py-2 text-[11px] font-mono rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* FULL ADMIN COMMAND CENTER */
              <div id="view-admin-dashboard" className="flex flex-col lg:flex-row gap-6 min-h-[70vh] bg-gray-50/50 dark:bg-zinc-950/40 rounded-3xl border border-gray-200/80 dark:border-zinc-800 p-2 sm:p-4 transition-all">
                {/* Admin Left Sidebar Navigation */}
                <div className="w-full lg:w-64 bg-[#0E2A47] text-zinc-100 rounded-2xl p-4 flex flex-col gap-4 shadow-lg shrink-0">
                  <div className="flex items-center gap-2.5 px-2 py-1.5 border-b border-white/10 pb-4">
                    <ShieldAlert className="w-6 h-6 text-[#00A896]" />
                    <div>
                      <h4 className="font-extrabold text-sm text-white tracking-wider">BeforeSpend</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Command Center</p>
                    </div>
                  </div>
                  
                  <nav className="flex-1 space-y-1.5">
                    {[
                      { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
                      { id: 'users', label: 'User Directory', icon: Users },
                      { id: 'categories', label: 'Categories & Buckets', icon: Layers },
                      { id: 'ledger', label: 'Transactions Ledger', icon: Scale },
                      { id: 'payments', label: 'Payment Splits', icon: History },
                      { id: 'broadcast', label: 'System Broadcast', icon: Bell },
                      { id: 'backups', label: 'Backups & System', icon: Database },
                    ].map(subTab => {
                      const SubIcon = subTab.icon;
                      const isSubActive = adminActiveSubTab === subTab.id;
                      return (
                        <button
                          key={subTab.id}
                          onClick={() => {
                            setAdminActiveSubTab(subTab.id);
                            setAdminSearchQuery('');
                          }}
                          className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer text-left ${
                            isSubActive
                              ? 'bg-[#00A896] text-white shadow-md'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span>{subTab.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Profile Indicator at Sidebar Bottom */}
                  <div className="border-t border-white/10 pt-4 flex items-center gap-2.5 px-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20">
                      <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
                      <p className="text-[9px] text-[#00A896] font-extrabold truncate">{userProfile.role}</p>
                    </div>
                  </div>
                </div>

                {/* Admin Right Panel Content Area */}
                <div className="flex-1 bg-white dark:bg-zinc-950 rounded-2xl p-4 sm:p-6 border border-gray-200/60 dark:border-zinc-900 shadow-xs flex flex-col gap-6 overflow-hidden">
                  
                  {/* Top Header of command center */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-150 dark:border-zinc-900">
                    <div>
                      <h2 className="text-xl font-black text-[#0E2A47] dark:text-zinc-50 flex items-center gap-2">
                        {adminActiveSubTab === 'overview' && 'System KPIs & Performance'}
                        {adminActiveSubTab === 'users' && 'User Account Directory'}
                        {adminActiveSubTab === 'categories' && 'Budget Categories & Buckets'}
                        {adminActiveSubTab === 'ledger' && 'Transactions Ledger Auditor'}
                        {adminActiveSubTab === 'payments' && 'Inflow Payments & Splits'}
                        {adminActiveSubTab === 'broadcast' && 'Global Notification System'}
                        {adminActiveSubTab === 'backups' && 'System Maintenance & Backups'}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {adminActiveSubTab === 'overview' && 'Global metrics, active users distribution, and total platform financial volume.'}
                        {adminActiveSubTab === 'users' && 'Manage all user accounts, update profile roles, currencies, or delete accounts.'}
                        {adminActiveSubTab === 'categories' && 'Inspect and manage budget categories, allocation percentages, bank connections across the platform.'}
                        {adminActiveSubTab === 'ledger' && 'Audit all system double-entry ledger transactions. Edit or delete ledger logs.'}
                        {adminActiveSubTab === 'payments' && 'View all split payment inflows, notes, and uploaded invoice/receipt assets.'}
                        {adminActiveSubTab === 'broadcast' && 'Send instant notifications to all active users across the platform.'}
                        {adminActiveSubTab === 'backups' && 'Configure exchange rates, check local storage quota, and import/export raw JSON database dumps.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      {['users', 'categories', 'ledger', 'payments'].includes(adminActiveSubTab) && (
                        <input
                          type="text"
                          placeholder="Search database..."
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          className="w-full sm:w-60 px-3 py-1.5 text-xs rounded-xl border border-gray-250 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#00A896] focus:bg-white"
                        />
                      )}
                      <button
                        onClick={loadAdminData}
                        disabled={adminIsLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0E2A47] hover:bg-[#00A896] text-white disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${adminIsLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Loader Overlay */}
                  {adminIsLoading && (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-[#00A896] animate-spin" />
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading Platform Data...</p>
                    </div>
                  )}

                  {/* Admin Tab: 1. OVERVIEW */}
                  {!adminIsLoading && adminActiveSubTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Metric KPI cards mimic Image 1 */}
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Members</p>
                          <h3 className="text-2xl font-black text-[#0E2A47] dark:text-zinc-50">{adminProfiles.length}</h3>
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 fill-current" /> Active Profiles
                          </span>
                        </div>
                        
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Buckets</p>
                          <h3 className="text-2xl font-black text-[#0E2A47] dark:text-zinc-50">{adminBuckets.length}</h3>
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 fill-current" /> Allocated
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Transactions</p>
                          <h3 className="text-2xl font-black text-[#0E2A47] dark:text-zinc-50">{adminTransactions.length}</h3>
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 fill-current" /> Logged Entries
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Savings %</p>
                          <h3 className="text-2xl font-black text-[#0E2A47] dark:text-zinc-50">
                            {(adminBuckets.length ? (adminBuckets.reduce((sum, b) => sum + Number(b.allocation_percentage || 0), 0) / adminBuckets.length) : 0).toFixed(1)}%
                          </h3>
                          <span className="text-[10px] text-teal-500 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Average Allocation
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-900 shadow-xs space-y-1 col-span-2 md:col-span-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Split Payments Volume</p>
                          <h3 className="text-2xl font-black text-[#0E2A47] dark:text-zinc-50">{adminPayments.length}</h3>
                          <span className="text-[10px] text-[#00A896] font-bold flex items-center gap-1">
                            <Wallet className="w-3 h-3" /> Inflow Records
                          </span>
                        </div>
                      </div>

                      {/* Charts and Tables */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Section: Latest Transactions auditor snapshot */}
                        <div className="lg:col-span-8 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-sm text-[#0E2A47] dark:text-zinc-100 uppercase tracking-wide">Recent Platform Ledger Activity</h3>
                            <button onClick={() => setAdminActiveSubTab('ledger')} className="text-xs text-[#00A896] hover:underline font-bold">View Ledger</button>
                          </div>
                          
                          <div className="overflow-x-auto rounded-xl border border-gray-250 dark:border-zinc-800">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 uppercase tracking-wider font-semibold text-[10px] border-b border-gray-200 dark:border-zinc-800">
                                <tr>
                                  <th className="py-2.5 px-3">Description</th>
                                  <th className="py-2.5 px-3">Amount</th>
                                  <th className="py-2.5 px-3">Type</th>
                                  <th className="py-2.5 px-3">Direction</th>
                                  <th className="py-2.5 px-3">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-150 dark:divide-zinc-900 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-300">
                                {adminTransactions.slice(0, 6).map((txn) => (
                                  <tr key={txn.id} className="hover:bg-gray-55 dark:hover:bg-zinc-900/30">
                                    <td className="py-2.5 px-3 font-semibold truncate max-w-[200px]">{txn.description}</td>
                                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-zinc-100">{formatCurrency(txn.amount, userProfile.defaultCurrency)}</td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-zinc-800">{txn.type}</span>
                                    </td>
                                    <td className="py-2.5 px-3 font-black">
                                      <span className={txn.direction === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}>{txn.direction}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-[10px] text-gray-400">{new Date(txn.created_at).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Right Section: Users signup summary card */}
                        <div className="lg:col-span-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 space-y-4 shadow-sm">
                          <h3 className="font-extrabold text-sm text-[#0E2A47] dark:text-zinc-100 uppercase tracking-wide">User Role Distributions</h3>
                          <div className="space-y-3 pt-2">
                            {['Salaried Employee / Professional', 'Freelancer & Contractor', 'Business Owner / Entrepreneur', 'Student & Personal Budgeter', 'Platform Administrator'].map(roleName => {
                              const count = adminProfiles.filter(p => p.role === roleName).length;
                              const percentage = adminProfiles.length ? (count / adminProfiles.length) * 100 : 0;
                              return (
                                <div key={roleName} className="space-y-1 text-xs">
                                  <div className="flex justify-between font-medium">
                                    <span className="text-gray-600 dark:text-zinc-400 truncate max-w-[150px]">{roleName}</span>
                                    <span className="font-black text-gray-800 dark:text-zinc-200">{count} ({percentage.toFixed(0)}%)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-150 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${percentage}%` }}
                                      className="h-full bg-[#00A896] rounded-full"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Tab: 2. USERS */}
                  {!adminIsLoading && adminActiveSubTab === 'users' && (
                    <div className="space-y-4 overflow-x-auto">
                      <div className="rounded-xl border border-gray-200 dark:border-zinc-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 uppercase tracking-wider font-semibold text-[10px] border-b border-gray-200 dark:border-zinc-800">
                            <tr>
                              <th className="py-3 px-4">Avatar</th>
                              <th className="py-3 px-4">Name</th>
                              <th className="py-3 px-4">Email</th>
                              <th className="py-3 px-4">Role</th>
                              <th className="py-3 px-4">Default Currency</th>
                              <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 dark:divide-zinc-900 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-300">
                            {adminProfiles
                              .filter(p => !adminSearchQuery || p.name?.toLowerCase().includes(adminSearchQuery.toLowerCase()) || p.email?.toLowerCase().includes(adminSearchQuery.toLowerCase()))
                              .map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                                  <td className="py-3 px-4">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                                      <Avatar avatar={profile.avatar} name={profile.name} className="w-full h-full" />
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-zinc-100">{profile.name}</td>
                                  <td className="py-3 px-4">{profile.email}</td>
                                  <td className="py-3 px-4 font-semibold text-teal-600 dark:text-teal-400">{profile.role}</td>
                                  <td className="py-3 px-4 font-black">{profile.default_currency}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          setAdminEditingUser(profile);
                                          setAdminEditUserName(profile.name);
                                          setAdminEditUserEmail(profile.email);
                                          setAdminEditUserRole(profile.role || 'Salaried Employee / Professional');
                                          setAdminEditUserCurrency(profile.default_currency || 'NGN');
                                        }}
                                        className="p-1 px-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-100 text-[#00A896] font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" /> Edit
                                      </button>
                                      {profile.email !== userProfile.email && (
                                        <button
                                          onClick={() => handleAdminDeleteProfile(profile.id)}
                                          className="p-1 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                        >
                                          <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Admin Tab: 3. CATEGORIES/BUCKETS */}
                  {!adminIsLoading && adminActiveSubTab === 'categories' && (
                    <div className="space-y-4 overflow-x-auto">
                      <div className="rounded-xl border border-gray-200 dark:border-zinc-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 uppercase tracking-wider font-semibold text-[10px] border-b border-gray-200 dark:border-zinc-800">
                            <tr>
                              <th className="py-3 px-4">Owner ID</th>
                              <th className="py-3 px-4">Bucket Name</th>
                              <th className="py-3 px-4">Percentage</th>
                              <th className="py-3 px-4">Account</th>
                              <th className="py-3 px-4">Bank</th>
                              <th className="py-3 px-4">Color</th>
                              <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 dark:divide-zinc-900 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-300">
                            {adminBuckets
                              .filter(b => !adminSearchQuery || b.name?.toLowerCase().includes(adminSearchQuery.toLowerCase()) || b.user_id?.toLowerCase().includes(adminSearchQuery.toLowerCase()))
                              .map((bucket) => (
                                <tr key={bucket.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                                  <td className="py-3 px-4 font-mono text-[9px] text-gray-405 truncate max-w-[100px]">{bucket.user_id}</td>
                                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-zinc-100">{bucket.name}</td>
                                  <td className="py-3 px-4 font-black">{bucket.allocation_percentage}%</td>
                                  <td className="py-3 px-4">{bucket.destination_account}</td>
                                  <td className="py-3 px-4 font-semibold text-gray-500">{bucket.target_bank}</td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase" style={{ backgroundColor: bucket.color === 'emerald' ? '#10B981' : bucket.color === 'indigo' ? '#6366F1' : bucket.color === 'rose' ? '#EF4444' : '#64748B' }}>
                                      {bucket.color}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          setAdminEditingBucket(bucket);
                                          setAdminEditBucketName(bucket.name);
                                          setAdminEditBucketPercentage(Number(bucket.allocation_percentage));
                                          setAdminEditBucketAccount(bucket.destination_account);
                                          setAdminEditBucketBank(bucket.target_bank || 'Default Bank');
                                          setAdminEditBucketColor(bucket.color || 'emerald');
                                          setAdminEditBucketNote(bucket.note || '');
                                        }}
                                        className="p-1 px-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-100 text-[#00A896] font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" /> Edit
                                      </button>
                                      <button
                                        onClick={() => handleAdminDeleteBucket(bucket.id)}
                                        className="p-1 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" /> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Admin Tab: 4. TRANSACTIONS */}
                  {!adminIsLoading && adminActiveSubTab === 'ledger' && (
                    <div className="space-y-4 overflow-x-auto">
                      <div className="rounded-xl border border-gray-200 dark:border-zinc-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 uppercase tracking-wider font-semibold text-[10px] border-b border-gray-200 dark:border-zinc-800">
                            <tr>
                              <th className="py-3 px-4">User ID</th>
                              <th className="py-3 px-4">Description</th>
                              <th className="py-3 px-4">Amount</th>
                              <th className="py-3 px-4">Type</th>
                              <th className="py-3 px-4">Direction</th>
                              <th className="py-3 px-4">Created Date</th>
                              <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 dark:divide-zinc-900 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-300">
                            {adminTransactions
                              .filter(t => !adminSearchQuery || t.description?.toLowerCase().includes(adminSearchQuery.toLowerCase()) || t.type?.toLowerCase().includes(adminSearchQuery.toLowerCase()))
                              .map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                                  <td className="py-3 px-4 font-mono text-[9px] text-gray-405 truncate max-w-[100px]">{txn.user_id}</td>
                                  <td className="py-3 px-4 font-semibold text-gray-950 dark:text-zinc-50">{txn.description}</td>
                                  <td className="py-3 px-4 font-black">{formatCurrency(txn.amount, userProfile.defaultCurrency)}</td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                                      {txn.type}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-black">
                                    <span className={txn.direction === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}>
                                      {txn.direction}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-[10px] text-gray-400">{new Date(txn.created_at).toLocaleString()}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          setAdminEditingTransaction(txn);
                                          setAdminEditTransactionDesc(txn.description);
                                          setAdminEditTransactionAmount(Number(txn.amount));
                                          setAdminEditTransactionType(txn.type || 'EXPENSE');
                                          setAdminEditTransactionDirection(txn.direction || 'DEBIT');
                                        }}
                                        className="p-1 px-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-100 text-[#00A896] font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" /> Edit
                                      </button>
                                      <button
                                        onClick={() => handleAdminDeleteTransaction(txn.id)}
                                        className="p-1 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" /> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Admin Tab: 5. PAYMENTS */}
                  {!adminIsLoading && adminActiveSubTab === 'payments' && (
                    <div className="space-y-4 overflow-x-auto">
                      <div className="rounded-xl border border-gray-200 dark:border-zinc-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 uppercase tracking-wider font-semibold text-[10px] border-b border-gray-200 dark:border-zinc-800">
                            <tr>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">User ID</th>
                              <th className="py-3 px-4">Original Amount</th>
                              <th className="py-3 px-4">Converted NGN</th>
                              <th className="py-3 px-4">Splits Distribution</th>
                              <th className="py-3 px-4">Note</th>
                              <th className="py-3 px-4 text-center">Receipt File</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 dark:divide-zinc-900 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-300">
                            {adminPayments
                              .filter(p => !adminSearchQuery || p.note?.toLowerCase().includes(adminSearchQuery.toLowerCase()) || p.user_id?.toLowerCase().includes(adminSearchQuery.toLowerCase()))
                              .map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                                  <td className="py-3 px-4 text-[10px] text-gray-400">{new Date(payment.date).toLocaleDateString()}</td>
                                  <td className="py-3 px-4 font-mono text-[9px] text-gray-405 truncate max-w-[100px]">{payment.user_id}</td>
                                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-zinc-100">{payment.amount} {payment.currency}</td>
                                  <td className="py-3 px-4 font-extrabold text-[#00A896]">₦{Number(payment.converted_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="py-3 px-4 max-w-[200px]">
                                    <div className="flex flex-wrap gap-1">
                                      {payment.splits?.map((s: any, idx: number) => (
                                        <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] bg-teal-50 border border-teal-100 text-[#00A896] font-bold">
                                          {s.bucketName}: {s.percentage}%
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 truncate max-w-[150px]">{payment.note || '-'}</td>
                                  <td className="py-3 px-4 text-center">
                                    {payment.receipt_image ? (
                                      <a href={payment.receipt_image} target="_blank" rel="noreferrer" className="text-xs text-[#00A896] hover:underline font-extrabold">View File</a>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Admin Tab: 6. BROADCAST */}
                  {!adminIsLoading && adminActiveSubTab === 'broadcast' && (
                    <form onSubmit={handleAdminBroadcast} className="max-w-xl space-y-4 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-zinc-900 shadow-sm">
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-sm text-[#0E2A47] dark:text-zinc-100 uppercase tracking-wide">Broadcast System Message</h3>
                        <p className="text-xs text-gray-400 font-medium">Publish a notification message that immediately broadcasts to all active user profile bells.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Notification Title</label>
                        <input
                          type="text"
                          required
                          value={adminBroadcastTitle}
                          onChange={(e) => setAdminBroadcastTitle(e.target.value)}
                          placeholder="e.g. Platform Scheduled Maintenance"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-250 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#00A896] focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Notification Type / Color Theme</label>
                        <select
                          value={adminBroadcastType}
                          onChange={(e) => setAdminBroadcastType(e.target.value as any)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-250 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#00A896] cursor-pointer"
                        >
                          <option value="info">Info (Blue)</option>
                          <option value="success">Success (Green)</option>
                          <option value="warning">Warning (Yellow)</option>
                          <option value="alert">Alert (Red)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Broadcast Message Body</label>
                        <textarea
                          required
                          value={adminBroadcastMessage}
                          onChange={(e) => setAdminBroadcastMessage(e.target.value)}
                          placeholder="Write message content here..."
                          className="w-full h-32 px-3.5 py-2 text-xs rounded-xl border border-gray-250 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#00A896] focus:bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={adminIsLoading}
                        className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Global Broadcast</span>
                      </button>
                    </form>
                  )}

                  {/* Admin Tab: 7. BACKUPS */}
                  {!adminIsLoading && adminActiveSubTab === 'backups' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column: Stats & Exchange Rates */}
                      <div className="lg:col-span-5 space-y-5">
                        {/* Storage details */}
                        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-905 dark:border-zinc-800 shadow-sm space-y-3">
                          <h3 className="font-bold text-[#0E2A47] dark:text-zinc-50 text-sm flex items-center gap-2">
                            <Database className="w-5 h-5 text-[#00A896]" /> Storage Space Used
                          </h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400 font-medium">Storage Space Used:</span>
                              <span className="font-bold text-gray-700 dark:text-zinc-200">{calculateLocalStorageQuota()} KB / 5120 KB</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${Math.min(100, (parseFloat(calculateLocalStorageQuota()) / 5120) * 100)}%` }}
                                className="h-full bg-[#00A896] rounded-full"
                              />
                            </div>
                            <p className="text-[10px] text-gray-400">All app states are synced back to Supabase tables automatically.</p>
                          </div>
                        </div>

                        {/* Exchange Rates Manager */}
                        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-905 dark:border-zinc-800 shadow-sm space-y-3">
                          <h3 className="font-bold text-[#0E2A47] dark:text-zinc-50 text-sm flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#00A896]" /> Exchange Rates Manager
                          </h3>
                          <p className="text-xs text-gray-400 font-medium">Configure global Naira (₦) equivalents for freelance payments.</p>
                          
                          <div className="space-y-2.5 pt-1">
                            {Object.keys(exchangeRates).filter(k => k !== 'NGN').map((currencyCode) => (
                              <div key={currencyCode} className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-700 dark:text-zinc-300">1 {currencyCode} Equivalent (₦)</span>
                                <input
                                  id={`exchange-rate-input-admin-${currencyCode}`}
                                  type="number"
                                  value={exchangeRates[currencyCode]}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 1;
                                    setExchangeRates({ ...exchangeRates, [currencyCode]: val });
                                  }}
                                  className="w-24 px-2 py-1 text-xs text-right rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#00A896]"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Database Backup Snapshot */}
                      <div className="lg:col-span-7">
                        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-905 dark:border-zinc-805 shadow-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
                                Data Backup & Restore
                              </h3>
                              <p className="text-xs text-gray-400">Easily export a backup file or restore your saved data anytime.</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                id="export-db-button-admin"
                                onClick={handleExportDb}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <Upload className="w-3.5 h-3.5" /> Export Backup
                              </button>
                              <button
                                id="import-db-modal-trigger-admin"
                                onClick={() => setShowImportDbModal(true)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 border border-teal-100 text-[#00A896] dark:bg-teal-950/20 dark:hover:bg-teal-950/40 dark:border-teal-900 dark:text-[#00A896] transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Restore Backup
                              </button>
                            </div>
                          </div>

                          <textarea
                            id="admin-raw-json-textarea-admin"
                            value={rawDbJson}
                            onChange={(e) => setRawDbJson(e.target.value)}
                            placeholder='Click "Export DB" to inspect raw JSON database dumps or paste a validated backup here...'
                            className="w-full h-80 px-3 py-2 text-[11px] font-mono rounded-xl border border-gray-250 bg-gray-50/50 dark:bg-zinc-805 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )
          )}

          {/* EDIT MODALS FOR ADMIN */}
          {adminEditingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <form
                onSubmit={handleAdminSaveProfile}
                className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-250 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-zinc-900">
                  <h3 className="text-base font-black text-[#0E2A47] dark:text-zinc-50">Edit User Profile</h3>
                  <button type="button" onClick={() => setAdminEditingUser(null)} className="text-gray-400 hover:text-gray-650 dark:hover:text-zinc-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Full Name</label>
                    <input type="text" required value={adminEditUserName} onChange={(e) => setAdminEditUserName(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Email Address</label>
                    <input type="email" required value={adminEditUserEmail} onChange={(e) => setAdminEditUserEmail(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Profile Role</label>
                    <select value={adminEditUserRole} onChange={(e) => setAdminEditUserRole(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]">
                      <option value="Salaried Employee / Professional">Salaried Employee / Professional</option>
                      <option value="Freelancer & Contractor">Freelancer & Contractor</option>
                      <option value="Business Owner / Entrepreneur">Business Owner / Entrepreneur</option>
                      <option value="Student & Personal Budgeter">Student & Personal Budgeter</option>
                      <option value="Platform Administrator">Platform Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Default Currency</label>
                    <select value={adminEditUserCurrency} onChange={(e) => setAdminEditUserCurrency(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]">
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setAdminEditingUser(null)} className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white cursor-pointer shadow-md">Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {adminEditingBucket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <form
                onSubmit={handleAdminSaveBucket}
                className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-250 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-zinc-900">
                  <h3 className="text-base font-black text-[#0E2A47] dark:text-zinc-50">Edit Budget Bucket</h3>
                  <button type="button" onClick={() => setAdminEditingBucket(null)} className="text-gray-400 hover:text-gray-650 dark:hover:text-zinc-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Bucket Name</label>
                    <input type="text" required value={adminEditBucketName} onChange={(e) => setAdminEditBucketName(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Allocation Percentage (%)</label>
                    <input type="number" required min="0" max="100" value={adminEditBucketPercentage} onChange={(e) => setAdminEditBucketPercentage(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Destination Account</label>
                    <input type="text" required value={adminEditBucketAccount} onChange={(e) => setAdminEditBucketAccount(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Target Bank</label>
                    <input type="text" value={adminEditBucketBank} onChange={(e) => setAdminEditBucketBank(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Color Theme</label>
                    <select value={adminEditBucketColor} onChange={(e) => setAdminEditBucketColor(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]">
                      <option value="emerald">Emerald (Green)</option>
                      <option value="indigo">Indigo (Blue)</option>
                      <option value="rose">Rose (Red)</option>
                      <option value="amber">Amber (Yellow)</option>
                      <option value="slate">Slate (Gray)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Note</label>
                    <input type="text" value={adminEditBucketNote} onChange={(e) => setAdminEditBucketNote(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setAdminEditingBucket(null)} className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white cursor-pointer shadow-md">Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {adminEditingTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <form
                onSubmit={handleAdminSaveTransaction}
                className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-250 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-zinc-900">
                  <h3 className="text-base font-black text-[#0E2A47] dark:text-zinc-50">Audit Transaction</h3>
                  <button type="button" onClick={() => setAdminEditingTransaction(null)} className="text-gray-400 hover:text-gray-650 dark:hover:text-zinc-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Description</label>
                    <input type="text" required value={adminEditTransactionDesc} onChange={(e) => setAdminEditTransactionDesc(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Amount</label>
                    <input type="number" required min="0" step="any" value={adminEditTransactionAmount} onChange={(e) => setAdminEditTransactionAmount(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Transaction Type</label>
                    <select value={adminEditTransactionType} onChange={(e) => setAdminEditTransactionType(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]">
                      <option value="INCOME_SPLIT">INCOME_SPLIT</option>
                      <option value="EXPENSE">EXPENSE</option>
                      <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT</option>
                      <option value="TRANSFER">TRANSFER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Direction</label>
                    <select value={adminEditTransactionDirection} onChange={(e) => setAdminEditTransactionDirection(e.target.value)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-[#00A896]">
                      <option value="CREDIT">CREDIT (Inflow)</option>
                      <option value="DEBIT">DEBIT (Outflow)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setAdminEditingTransaction(null)} className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white cursor-pointer shadow-md">Save Changes</button>
                </div>
              </form>
            </div>
          )}

        </main>

        {/* FOOTER - Pinned to bottom right as outlined in Image 2 */}
        <footer className="mt-auto py-5 px-6 sm:px-10 border-t border-gray-150/70 dark:border-zinc-850 text-right text-xs font-semibold text-gray-400 dark:text-zinc-500 bg-white/40 dark:bg-zinc-950/40">
          <p>© 2026 BeforeSpend is a Product of DirectPadi Ltd.</p>
        </footer>

      </div>

      {/* MODAL 1: ADD CUSTOM BUCKET */}
      {showAddCustomBucketModal && (
        <div id="add-bucket-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleAddCustomBucket}
            className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-250 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-zinc-900">
              <h3 className="text-base font-black text-gray-900 dark:text-zinc-50">Create Custom Budget Bucket</h3>
              <button
                type="button"
                id="close-add-bucket-modal"
                onClick={() => setShowAddCustomBucketModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Bucket Name</label>
                <input
                  id="new-bucket-name-input"
                  type="text"
                  required
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="e.g. Workstation Gear, Child Care"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Percentage Split (%)</label>
                  <input
                    id="new-bucket-percentage-input"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={newBucketPercentage}
                    onChange={(e) => setNewBucketPercentage(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Destination Account</label>
                  <input
                    id="new-bucket-account-input"
                    type="text"
                    required
                    value={newBucketAccount}
                    onChange={(e) => setNewBucketAccount(e.target.value)}
                    placeholder="e.g. OPay, Kuda locked"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Color Palette Theme</label>
                <select
                  id="new-bucket-color-select"
                  value={newBucketColor}
                  onChange={(e) => setNewBucketColor(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none cursor-pointer"
                >
                  <option value="emerald">Emerald Green</option>
                  <option value="blue">Blue Sky</option>
                  <option value="amber">Amber Orange</option>
                  <option value="red">Rose Red</option>
                  <option value="purple">Purple Amethyst</option>
                  <option value="teal">Teal Cyan</option>
                  <option value="indigo">Indigo Slate</option>
                  <option value="pink">Pink Punch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Description / Notes</label>
                <input
                  id="new-bucket-note-input"
                  type="text"
                  value={newBucketNote}
                  onChange={(e) => setNewBucketNote(e.target.value)}
                  placeholder="Optional brief notes..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  Low Balance Alert Threshold ({userProfile.defaultCurrency})
                </label>
                <input
                  id="new-bucket-threshold-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 50000 (Optional)"
                  value={newBucketThreshold}
                  onChange={(e) => setNewBucketThreshold(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Triggers warning notification when bucket balance drops below this amount.</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                id="cancel-add-bucket"
                onClick={() => setShowAddCustomBucketModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-700 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-add-bucket"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white cursor-pointer transition-colors"
              >
                Create Bucket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: EDIT BUCKET CONFIGURATION */}
      {showEditBucketModal && editingBucket && (
        <div id="edit-bucket-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEditedBucket}
            className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-250 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-zinc-900">
              <h3 className="text-base font-black text-gray-900 dark:text-zinc-50">Configure {editingBucket.name}</h3>
              <button
                type="button"
                id="close-edit-bucket-modal"
                onClick={() => {
                  setShowEditBucketModal(false);
                  setEditingBucket(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Bucket Name</label>
                <input
                  id="edit-bucket-name-input"
                  type="text"
                  required
                  value={tempBucketName}
                  onChange={(e) => setTempBucketName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Percentage Split (%)</label>
                  <input
                    id="edit-bucket-percentage-input"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={tempBucketPercentage}
                    onChange={(e) => setTempBucketPercentage(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Destination Account</label>
                  <input
                    id="edit-bucket-account-input"
                    type="text"
                    required
                    value={tempBucketAccount}
                    onChange={(e) => setTempBucketAccount(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Color Palette Theme</label>
                <select
                  id="edit-bucket-color-select"
                  value={tempBucketColor}
                  onChange={(e) => setTempBucketColor(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none cursor-pointer"
                >
                  <option value="emerald">Emerald Green</option>
                  <option value="blue">Blue Sky</option>
                  <option value="amber">Amber Orange</option>
                  <option value="red">Rose Red</option>
                  <option value="purple">Purple Amethyst</option>
                  <option value="teal">Teal Cyan</option>
                  <option value="indigo">Indigo Slate</option>
                  <option value="pink">Pink Punch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Description / Notes</label>
                <input
                  id="edit-bucket-note-input"
                  type="text"
                  value={tempBucketNote}
                  onChange={(e) => setTempBucketNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  Low Balance Alert Threshold ({userProfile.defaultCurrency})
                </label>
                <input
                  id="edit-bucket-threshold-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 50000 (Optional)"
                  value={tempBucketThreshold}
                  onChange={(e) => setTempBucketThreshold(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-250 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Triggers warning notification when bucket balance drops below this amount.</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                id="cancel-edit-bucket"
                onClick={() => {
                  setShowEditBucketModal(false);
                  setEditingBucket(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-700 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-edit-bucket"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white cursor-pointer transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: IMPORT DB SNAPSHOT */}
      {showImportDbModal && (
        <div id="import-db-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-250 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-zinc-900">
              <h3 className="text-base font-black text-gray-900 dark:text-zinc-50">Import Database Snapshot</h3>
              <button
                type="button"
                id="close-import-db-modal"
                onClick={() => setShowImportDbModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Paste validated backup JSON data in the Admin Center text box first, then click below to fully restore it.
              </p>
              <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">
                ⚠️ Warning: This completely overwrites all current local data!
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                id="cancel-import-db"
                onClick={() => setShowImportDbModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-700 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-import-db"
                onClick={handleImportDb}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white cursor-pointer transition-colors"
              >
                Confirm Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECONCILIATION */}
      {showReconciliationModal && (
        <ReconciliationModal
          buckets={buckets}
          currency={userProfile.defaultCurrency}
          transactions={transactions}
          initialBucketId={reconciliationBucketId}
          onReconcile={handleReconcileTransaction}
          onClose={() => {
            setShowReconciliationModal(false);
            setReconciliationBucketId(undefined);
          }}
        />
      )}

      {/* MODAL: STATEMENT PARSER */}
      {showStatementParserModal && (
        <StatementParserModal
          buckets={buckets}
          currency={userProfile.defaultCurrency}
          existingTransactions={transactions}
          onBatchImport={handleBatchImport}
          onClose={() => setShowStatementParserModal(false)}
        />
      )}

    </div>
  );
}

export default function App() {
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>('beforespend_logged_in_user_id', null);
  const [authView, setAuthView] = useLocalStorage<'app' | 'landing' | 'login' | 'register'>('beforespend_auth_view', 'landing');

  // Clean HTML5 History Navigation Synchronizer
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);
      if (path.startsWith('/admin') || path.startsWith('/dashboard')) {
        if (currentUserId) setAuthView('app');
      } else if (path === '/login') {
        setAuthView('login');
      } else if (path === '/register') {
        setAuthView('register');
      } else if (path === '/') {
        setAuthView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUserId]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    if (path.startsWith('/admin') || path.startsWith('/dashboard')) {
      if (currentUserId) setAuthView('app');
    } else if (path === '/login') {
      setAuthView('login');
    } else if (path === '/register') {
      setAuthView('register');
    } else if (path === '/') {
      setAuthView('landing');
    }
  };

  // Sync initial route on mount
  useEffect(() => {
    if (currentUserId) {
      if (window.location.pathname.startsWith('/admin')) {
        setAuthView('app');
      } else if (authView === 'landing' && (window.location.pathname === '/' || !window.location.pathname)) {
        window.history.replaceState({}, '', '/dashboard');
        setCurrentPath('/dashboard');
        setAuthView('app');
      }
    }
  }, [currentUserId]);

  // Theme synchronization
  const [isDark, setIsDark] = useState(() => {
    return window.localStorage.getItem('before spend_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.localStorage.setItem('before spend_dark_mode', String(isDark));
  }, [isDark]);

  const handleLogout = () => {
    setCurrentUserId(null);
    setAuthView('landing');
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 font-sans transition-colors duration-200">
      {currentUserId && (authView === 'app' || currentPath.startsWith('/admin') || currentPath.startsWith('/dashboard')) ? (
        <AuthenticatedApp 
          currentUserId={currentUserId} 
          onLogout={handleLogout} 
          onGoToLanding={() => { navigateTo('/'); setAuthView('landing'); }} 
        />
      ) : authView === 'landing' || (!currentUserId && (currentPath === '/' || !currentPath)) ? (
        <LandingPage
          onGoToLogin={() => { navigateTo('/login'); setAuthView('login'); }}
          onGoToRegister={() => { navigateTo('/register'); setAuthView('register'); }}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          isLoggedIn={Boolean(currentUserId)}
          currentUserId={currentUserId}
          onGoToDashboard={() => { navigateTo('/dashboard'); setAuthView('app'); }}
          onLogout={handleLogout}
        />
      ) : (
        <LoginRegisterScreen
          onLogin={(userId) => {
            setCurrentUserId(userId);
            setAuthView('app');
            const profileStr = window.localStorage.getItem(`user_${userId}_beforespend_profile`);
            const isUserAdmin = profileStr?.includes('Platform Administrator') || profileStr?.includes('admin@beforespend.app') || profileStr?.includes('admin@beforespend.xyz');
            const targetPath = isUserAdmin ? '/admin' : '/dashboard';
            window.history.pushState({}, '', targetPath);
            setCurrentPath(targetPath);
          }}
          onBackToLanding={() => { navigateTo('/'); setAuthView('landing'); }}
          initialIsRegister={authView === 'register'}
        />
      )}
    </div>
  );
}
