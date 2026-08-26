/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getLocalizedDefaultBuckets, detectUserRegionAndCurrency } from '../data/defaultBuckets';
import { DEFAULT_EXCHANGE_RATES, formatCurrency, generateId, generateAuditHash } from '../utils';
import { 
  Bucket, PaymentEntry, Expense, Milestone, Reminder, UserProfile, ToastMessage, AppNotification, Transaction, BucketTemplate, AuthView 
} from '../types';
import { 
  syncProfileToSupabase, syncBucketsToSupabase, syncTransactionsToSupabase, syncPaymentsToSupabase, syncMilestonesToSupabase, syncRemindersToSupabase, syncExpensesToSupabase,
  loadProfileFromSupabase, loadBucketsFromSupabase, loadTransactionsFromSupabase, loadPaymentsFromSupabase, loadMilestonesFromSupabase, loadRemindersFromSupabase, loadExpensesFromSupabase,
  loadNotificationsFromSupabase, syncNotificationsToSupabase, deleteNotificationFromSupabase, clearAllNotificationsFromSupabase,
  deletePaymentFromSupabase, clearAllPaymentsFromSupabase, deleteTransactionsByTypeFromSupabase,
  adminDeleteBucketFromSupabase, sendEmailNotification
} from '../repository';
import { triggerSystemPushNotification, autoReconcileWorkspaceBuckets } from '../service';

export interface AppContextType {
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isOnline: boolean;
  dataLoaded: boolean;
  isCloudDataLoaded: boolean;
  setIsCloudDataLoaded: (val: boolean) => void;
  activeTab: 'home' | 'split' | 'expense' | 'history' | 'more';
  setActiveTab: (tab: 'home' | 'split' | 'expense' | 'history' | 'more') => void;
  
  // Core Entities
  buckets: Bucket[];
  setBuckets: React.Dispatch<React.SetStateAction<Bucket[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  history: PaymentEntry[];
  setHistory: React.Dispatch<React.SetStateAction<PaymentEntry[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  exchangeRates: { [key: string]: number };
  setExchangeRates: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  // Actions
  handleSavePayment: (payment: {
    amount: number;
    currency: string;
    convertedAmount: number;
    splits: any[];
    receiptImage?: string;
    note?: string;
  }) => void;
  handleDeleteHistory: (id: string) => void;
  handleClearHistory: (revertBalances?: boolean) => void;
  handleAddExpense: (expense: {
    id: string;
    description: string;
    amount: number;
    bucketId: string;
    bucketName: string;
    date: string;
    receiptImage?: string;
  }) => void;
  handleDeleteExpense: (id: string) => void;
  handleClearExpenses: () => void;
  handleAddMilestone: (milestone: Milestone) => void;
  handleDeleteMilestone: (id: string) => void;
  handleAddReminder: (reminder: Reminder) => void;
  handleToggleReminder: (id: string) => void;
  handleDeleteReminder: (id: string) => void;
  handleReconcileTransaction: (txn: Transaction) => void;
  handleBatchImport: (importedTxns: Transaction[], creditSplitTotal?: number) => void;
  executeBucketConsolidation: (
    sourceBucket: Bucket,
    targetBucketId: string,
    consolidatePercentage: boolean
  ) => Promise<void>;
  handleAutoReconcileWorkspace: () => Promise<void>;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useLocalStorage<string>('before spend_current_user_id', '00000000-0000-0000-0000-000000000001');
  const [authView, setAuthView] = useState<AuthView>('app');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [isCloudDataLoaded, setIsCloudDataLoaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'split' | 'expense' | 'history' | 'more'>('home');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // User Profile
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>(
    `user_${currentUserId}_before spend_profile`,
    {
      name: 'Valued Budgeter',
      email: '',
      role: 'Freelancer & Contractor',
      defaultCurrency: detectUserRegionAndCurrency().currency,
    }
  );
  const [profile, setProfile] = useLocalStorage<UserProfile>(
    `user_${currentUserId}_before spend_user_profile`,
    userProfile
  );

  // Entities
  const [buckets, setBuckets] = useLocalStorage<Bucket[]>(
    `user_${currentUserId}_before spend_buckets`,
    getLocalizedDefaultBuckets(detectUserRegionAndCurrency().currency)
  );
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    `user_${currentUserId}_before spend_transactions`,
    []
  );
  const [history, setHistory] = useLocalStorage<PaymentEntry[]>(
    `user_${currentUserId}_before spend_history`,
    []
  );
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(
    `user_${currentUserId}_before spend_expenses`,
    []
  );
  const [milestones, setMilestones] = useLocalStorage<Milestone[]>(
    `user_${currentUserId}_before spend_milestones`,
    []
  );
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(
    `user_${currentUserId}_before spend_reminders`,
    []
  );
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(
    `user_${currentUserId}_before spend_notifications`,
    []
  );
  const [exchangeRates, setExchangeRates] = useLocalStorage<{ [key: string]: number }>(
    'before spend_exchange_rates',
    DEFAULT_EXCHANGE_RATES
  );

  // Dark mode handler
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

  // Online / Offline tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Toast dispatch
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Load from Supabase with robust fail-safety
  useEffect(() => {
    async function loadData() {
      if (!currentUserId || currentUserId.startsWith('00000000-')) {
        setDataLoaded(true);
        setIsCloudDataLoaded(true);
        return;
      }

      try {
        const results = await Promise.allSettled([
          loadBucketsFromSupabase(currentUserId),
          loadTransactionsFromSupabase(currentUserId),
          loadPaymentsFromSupabase(currentUserId),
          loadMilestonesFromSupabase(currentUserId),
          loadRemindersFromSupabase(currentUserId),
          loadNotificationsFromSupabase(currentUserId),
          loadExpensesFromSupabase(currentUserId),
        ]);

        const dbBuckets = results[0].status === 'fulfilled' ? results[0].value : null;
        const dbTxns = results[1].status === 'fulfilled' ? results[1].value : null;
        const dbPayments = results[2].status === 'fulfilled' ? results[2].value : null;
        const dbMilestones = results[3].status === 'fulfilled' ? results[3].value : null;
        const dbReminders = results[4].status === 'fulfilled' ? results[4].value : null;
        const dbNotifications = results[5].status === 'fulfilled' ? results[5].value : null;
        const dbExpenses = results[6].status === 'fulfilled' ? results[6].value : null;

        const userCurrency = profile?.defaultCurrency || userProfile.defaultCurrency || detectUserRegionAndCurrency().currency;
        const defaultPresetBuckets = getLocalizedDefaultBuckets(userCurrency);

        const cloudBucketsOk = dbBuckets !== null;
        const localBucketsExist = buckets && buckets.length > 0;

        let bucketPool: Bucket[] = [];

        if (cloudBucketsOk && dbBuckets!.length > 0) {
          bucketPool = [...dbBuckets!];
        } else if (cloudBucketsOk && dbBuckets!.length === 0 && localBucketsExist) {
          bucketPool = [...buckets];
        } else if (!cloudBucketsOk) {
          console.warn('BeforeSpend: Bucket cloud fetch failed — preserving local data untouched.');
          setIsCloudDataLoaded(true);
          setDataLoaded(true);
          return;
        } else {
          bucketPool = [...defaultPresetBuckets];
        }

        const txnCloudOk = dbTxns !== null;
        const allLoadedTxns = txnCloudOk
          ? (dbTxns!.length > 0 ? dbTxns! : transactions)
          : transactions;

        // Balance computation
        const bucketsWithBalances = bucketPool.map((bucket) => {
          const balance = allLoadedTxns
            .filter((t) => t.bucketId === bucket.id)
            .reduce((sum, t) => sum + (t.direction === 'CREDIT' ? t.amount : -t.amount), 0);
          return { ...bucket, balance };
        });

        setBuckets(bucketsWithBalances);

        if (txnCloudOk || allLoadedTxns.length > 0) {
          setTransactions(allLoadedTxns);
        }
        if (dbPayments) setHistory(dbPayments);
        if (dbMilestones) setMilestones(dbMilestones);
        if (dbReminders) setReminders(dbReminders);
        if (dbNotifications) setNotifications(dbNotifications);
        if (dbExpenses) setExpenses(dbExpenses);

        const cloudProfile = await loadProfileFromSupabase(currentUserId);
        if (cloudProfile) {
          setUserProfile(cloudProfile);
          setProfile(cloudProfile);
        }
      } catch (err) {
        console.warn('Initial cloud data load error:', err);
      } finally {
        setDataLoaded(true);
        setIsCloudDataLoaded(true);
      }
    }

    loadData();
  }, [currentUserId]);

  // Background Cloud Sync
  useEffect(() => {
    if (!currentUserId || currentUserId.startsWith('00000000-') || !dataLoaded || !isCloudDataLoaded) {
      return;
    }

    async function runSequentialSync() {
      await syncBucketsToSupabase(buckets, currentUserId);
      await syncTransactionsToSupabase(transactions, currentUserId);
      await syncPaymentsToSupabase(history, currentUserId);
      await syncMilestonesToSupabase(milestones, currentUserId);
      await syncRemindersToSupabase(reminders, currentUserId);
      await syncExpensesToSupabase(expenses, currentUserId);
      await syncNotificationsToSupabase(notifications, currentUserId);
    }

    runSequentialSync();
  }, [buckets, transactions, history, milestones, reminders, expenses, notifications, currentUserId, dataLoaded, isCloudDataLoaded]);

  // Action: Save Payment Split
  const handleSavePayment = (payment: {
    amount: number;
    currency: string;
    convertedAmount: number;
    splits: any[];
    receiptImage?: string;
    note?: string;
  }) => {
    const newEntry: PaymentEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      amount: payment.amount,
      currency: payment.currency,
      convertedAmount: payment.convertedAmount,
      splits: payment.splits,
      receiptImage: payment.receiptImage,
      note: payment.note,
    };

    setHistory((prev) => [newEntry, ...prev]);

    const now = new Date().toISOString();
    const newLedgerTxns: Transaction[] = payment.splits.map((s) => {
      const txnData = {
        id: generateId('txn'),
        bucketId: s.bucketId,
        bucketName: s.bucketName,
        type: 'INCOME_SPLIT' as const,
        amount: s.amount,
        direction: 'CREDIT' as const,
        description: payment.note 
          ? `${payment.note} — Income Split (${payment.currency} ${payment.amount})`
          : `Income Allocation Split (${payment.currency} ${payment.amount})`,
        receiptUrl: payment.receiptImage,
        sourceType: 'MANUAL_ENTRY' as const,
        createdAt: now
      };
      return {
        ...txnData,
        deduplicationHash: generateAuditHash(txnData)
      };
    });

    setTransactions((prev) => [...newLedgerTxns, ...prev]);

    if (userProfile.email) {
      sendEmailNotification({
        to: userProfile.email,
        type: 'income_alert',
        userName: userProfile.name || 'Valued Budgeter',
        data: {
          amount: formatCurrency(payment.amount, payment.currency),
          splitCount: payment.splits.length,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          splits: payment.splits.map((s) => ({
            bucketName: s.bucketName,
            amount: formatCurrency(s.amount, userProfile.defaultCurrency)
          }))
        }
      }).catch(() => {});
    }
  };

  // Action: Delete Payment Split
  const handleDeleteHistory = (id: string) => {
    const entry = history.find((h) => h.id === id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (entry && entry.splits?.length > 0) {
      const entryDate = new Date(entry.date);
      const entryDateMin = new Date(entryDate.getTime() - 5000).toISOString();
      const entryDateMax = new Date(entryDate.getTime() + 5000).toISOString();
      const splitFingerprints = new Set(
        entry.splits.map((s: any) => `${s.bucketId}|${Number(s.amount).toFixed(2)}`)
      );
      setTransactions((prev) =>
        prev.filter((t) => {
          if (t.direction !== 'CREDIT' || t.type !== 'INCOME_SPLIT') return true;
          const fingerprint = `${t.bucketId}|${Number(t.amount).toFixed(2)}`;
          const inTimeWindow = t.createdAt >= entryDateMin && t.createdAt <= entryDateMax;
          return !(splitFingerprints.has(fingerprint) && inTimeWindow);
        })
      );
    }
    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      deletePaymentFromSupabase(id, currentUserId);
    }
    addToast('Payment reversed and ledger entries removed.', 'info');
  };

  const handleClearHistory = (revertBalances?: boolean) => {
    if (revertBalances) {
      setTransactions((prev) => prev.filter((t) => t.type !== 'INCOME_SPLIT'));
      if (currentUserId && !currentUserId.startsWith('00000000-')) {
        deleteTransactionsByTypeFromSupabase('INCOME_SPLIT', currentUserId);
      }
      addToast('Split history cleared & bucket balances reversed!', 'info');
    } else {
      addToast('Split history log cleared! Bucket balances remain intact.', 'success');
    }
    setHistory([]);
    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      clearAllPaymentsFromSupabase(currentUserId);
    }
  };

  // Action: Add Expense
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
      createdAt: new Date(expense.date).toISOString(),
      deduplicationHash: generateAuditHash({
        amount: expense.amount,
        description: expense.description,
        bucketId: expense.bucketId,
        direction: 'DEBIT',
        createdAt: new Date(expense.date).toISOString()
      })
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setExpenses((prev) => [expense, ...prev]);
    addToast(`Expense logged: -${formatCurrency(expense.amount, userProfile.defaultCurrency)} from ${expense.bucketName}`, 'success');
  };

  // Action: Delete Expense
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
    setTransactions((prev) => prev.filter((t) => t.type !== 'EXPENSE'));
    setExpenses([]);
    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      deleteTransactionsByTypeFromSupabase('EXPENSE', currentUserId);
    }
    addToast('All expenses cleared and balances restored!', 'success');
  };

  // Action: Milestones
  const handleAddMilestone = (milestone: Milestone) => {
    setMilestones((prev) => [...prev, milestone]);
    addToast(`Milestone set: ${milestone.name}`, 'success');
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    addToast('Milestone deleted.', 'info');
  };

  // Action: Reminders
  const handleAddReminder = (reminder: Reminder) => {
    setReminders((prev) => [...prev, reminder]);
    addToast('Reminder set!', 'success');
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updatedDone = !r.done;
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

  // Action: Reconcile
  const handleReconcileTransaction = (txn: Transaction) => {
    setTransactions((prev) => [txn, ...prev]);
    addToast(`Reconciliation adjustment recorded: ${txn.direction} of ${formatCurrency(txn.amount, userProfile.defaultCurrency)}`, 'success');
  };

  // Action: Batch Import
  const handleBatchImport = (importedTxns: Transaction[], creditSplitTotal?: number) => {
    setTransactions((prev) => [...importedTxns, ...prev]);
    addToast(`Batch imported ${importedTxns.length} statement rows!`, 'success');
    if (creditSplitTotal && creditSplitTotal > 0) {
      setActiveTab('split');
    }
  };

  // Action: Consolidate Bucket
  const executeBucketConsolidation = async (
    sourceBucket: Bucket,
    targetBucketId: string,
    consolidatePercentage: boolean
  ) => {
    const targetBucket = buckets.find((b) => b.id === targetBucketId);
    if (!targetBucket) return;

    addToast(`Consolidating and deleting ${sourceBucket.name}...`, 'info');

    const updatedTransactions = transactions.map((t) => {
      if (t.bucketId === sourceBucket.id) {
        return { ...t, bucketId: targetBucket.id, bucketName: targetBucket.name };
      }
      return t;
    });

    const updatedExpenses = expenses.map((e) => {
      if (e.bucketId === sourceBucket.id) {
        return { ...e, bucketId: targetBucket.id, bucketName: targetBucket.name };
      }
      return e;
    });

    const updatedBuckets = buckets
      .map((b) => {
        if (b.id === targetBucket.id) {
          return {
            ...b,
            balance: Number((b.balance + sourceBucket.balance).toFixed(2)),
            percentage: consolidatePercentage
              ? Math.min(100, b.percentage + sourceBucket.percentage)
              : b.percentage,
          };
        }
        return b;
      })
      .filter((b) => b.id !== sourceBucket.id);

    const updatedMilestones = milestones.map((m) => {
      if (m.bucketId === sourceBucket.id) {
        return { ...m, bucketId: targetBucket.id };
      }
      return m;
    });

    setTransactions(updatedTransactions);
    setExpenses(updatedExpenses);
    setBuckets(updatedBuckets);
    setMilestones(updatedMilestones);

    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      await adminDeleteBucketFromSupabase(sourceBucket.id);
      await syncBucketsToSupabase(updatedBuckets, currentUserId);
    }

    addToast(`Successfully merged ${sourceBucket.name} data into ${targetBucket.name}!`, 'success');
  };

  // Action: 1-Click Auto Reconcile & Clean
  const handleAutoReconcileWorkspace = async () => {
    addToast('Analyzing and auto-reconciling workspace balances...', 'info');
    const {
      reconciledBuckets,
      reconciledTransactions,
      reconciledExpenses,
      reconciledMilestones,
      summaryMessage,
    } = autoReconcileWorkspaceBuckets(buckets, transactions, expenses, milestones);

    setBuckets(reconciledBuckets);
    setTransactions(reconciledTransactions);
    setExpenses(reconciledExpenses);
    setMilestones(reconciledMilestones);

    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      await syncBucketsToSupabase(reconciledBuckets, currentUserId);
      await syncTransactionsToSupabase(reconciledTransactions, currentUserId);
      await syncExpensesToSupabase(reconciledExpenses, currentUserId);
      await syncMilestonesToSupabase(reconciledMilestones, currentUserId);
    }

    addToast(summaryMessage, 'success');
  };

  // Notifications actions
  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      clearAllNotificationsFromSupabase(currentUserId);
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      deleteNotificationFromSupabase(id);
    }
  };

  const value = useMemo(
    () => ({
      currentUserId,
      setCurrentUserId,
      authView,
      setAuthView,
      isDarkMode,
      toggleDarkMode,
      isOnline,
      dataLoaded,
      isCloudDataLoaded,
      setIsCloudDataLoaded,
      activeTab,
      setActiveTab,
      buckets,
      setBuckets,
      transactions,
      setTransactions,
      history,
      setHistory,
      expenses,
      setExpenses,
      milestones,
      setMilestones,
      reminders,
      setReminders,
      userProfile,
      setUserProfile,
      profile,
      setProfile,
      notifications,
      setNotifications,
      exchangeRates,
      setExchangeRates,
      toasts,
      addToast,
      removeToast,
      handleSavePayment,
      handleDeleteHistory,
      handleClearHistory,
      handleAddExpense,
      handleDeleteExpense,
      handleClearExpenses,
      handleAddMilestone,
      handleDeleteMilestone,
      handleAddReminder,
      handleToggleReminder,
      handleDeleteReminder,
      handleReconcileTransaction,
      handleBatchImport,
      executeBucketConsolidation,
      handleAutoReconcileWorkspace,
      markAllNotificationsAsRead,
      clearAllNotifications,
      deleteNotification,
    }),
    [
      currentUserId,
      authView,
      isDarkMode,
      isOnline,
      dataLoaded,
      isCloudDataLoaded,
      activeTab,
      buckets,
      transactions,
      history,
      expenses,
      milestones,
      reminders,
      userProfile,
      profile,
      notifications,
      exchangeRates,
      toasts,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
