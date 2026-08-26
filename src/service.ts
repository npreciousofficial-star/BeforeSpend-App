/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bucket, Transaction, Expense, Milestone, SplitInfo } from './types';
import { calculateSplits } from './utils/calculateSplits';
import { generateAuditHash } from './utils/generateAuditHash';

export * from './lib/pushNotifications';
export * from './lib/bankSync';

/**
 * Compute exact dynamic balance for every bucket from transactions (Credits - Debits)
 */
export function computeBucketBalances(buckets: Bucket[], transactions: Transaction[]): Bucket[] {
  return buckets.map((bucket) => {
    const balance = transactions
      .filter((t) => t.bucketId === bucket.id)
      .reduce((sum, t) => sum + (t.direction === 'CREDIT' ? t.amount : -t.amount), 0);
    return { ...bucket, balance: Number(balance.toFixed(2)) };
  });
}

/**
 * Validate that total allocated bucket percentages equal 100%
 */
export function validateBucketAllocations(buckets: Bucket[]): {
  isValid: boolean;
  totalPercentage: number;
  error?: string;
} {
  const totalPercentage = buckets.reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);
  const isValid = totalPercentage === 100;
  return {
    isValid,
    totalPercentage,
    error: isValid ? undefined : `Total split allocation must equal 100% (currently ${totalPercentage}%).`,
  };
}

/**
 * Consolidate source bucket data into target bucket upon bucket deletion
 */
export function consolidateBucketData(
  sourceBucket: Bucket,
  targetBucket: Bucket,
  buckets: Bucket[],
  transactions: Transaction[],
  expenses: Expense[],
  milestones: Milestone[],
  consolidatePercentage: boolean
): {
  updatedBuckets: Bucket[];
  updatedTransactions: Transaction[];
  updatedExpenses: Expense[];
  updatedMilestones: Milestone[];
} {
  const updatedTransactions = transactions.map((t) => {
    if (t.bucketId === sourceBucket.id) {
      return {
        ...t,
        bucketId: targetBucket.id,
        bucketName: targetBucket.name,
      };
    }
    return t;
  });

  const updatedExpenses = expenses.map((e) => {
    if (e.bucketId === sourceBucket.id) {
      return {
        ...e,
        bucketId: targetBucket.id,
        bucketName: targetBucket.name,
      };
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
      return {
        ...m,
        bucketId: targetBucket.id,
      };
    }
    return m;
  });

  return {
    updatedBuckets,
    updatedTransactions,
    updatedExpenses,
    updatedMilestones,
  };
}

/**
 * Enrich transactions by re-linking every transaction to a valid bucketId & bucketName in bucketPool
 */
export function enrichTransactionsWithBuckets(
  transactions: Transaction[],
  bucketPool: Bucket[]
): Transaction[] {
  return transactions.map((txn) => {
    let bucketId = txn.bucketId;
    let bucketName = txn.bucketName;

    // Search by ID first
    let match = bucketId ? bucketPool.find((b) => b.id === bucketId) : undefined;

    // Search by name if ID didn't match
    if (!match && (bucketName || txn.description)) {
      const searchName = (bucketName || txn.description || '').toLowerCase().trim();
      match = bucketPool.find(
        (b) =>
          b.name.toLowerCase().trim() === searchName ||
          searchName.includes(b.name.toLowerCase().trim())
      );
    }

    // Search description against all bucket names if still no match
    if (!match && txn.description) {
      const descLower = txn.description.toLowerCase();
      match = bucketPool.find((b) => descLower.includes(b.name.toLowerCase().trim()));
    }

    if (match) {
      bucketId = match.id;
      bucketName = match.name;
    } else if (bucketPool.length > 0) {
      const fallback =
        bucketPool.find((b) => b.name.toLowerCase().includes('salary')) || bucketPool[0];
      bucketId = fallback.id;
      bucketName = fallback.name;
    }

    const hash =
      txn.deduplicationHash ||
      generateAuditHash({
        amount: txn.amount,
        description: txn.description,
        bucketId: bucketId,
        direction: txn.direction,
        createdAt: txn.createdAt,
      });

    return { ...txn, bucketId, bucketName, deduplicationHash: hash };
  });
}

/**
 * Filter transactions that represent true ledger expenses
 */
export function filterExpensesFromTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.type === 'EXPENSE');
}

/**
 * Distribute an income split across active buckets
 */
export function calculatePaymentDistribution(amount: number, buckets: Bucket[]): SplitInfo[] {
  return calculateSplits(amount, buckets);
}

/**
 * Automatically reconcile negative bucket deficits, consolidate inactive 0% categories
 * into the primary active bucket, and normalize percentages to 100% with zero data loss.
 */
export function autoReconcileWorkspaceBuckets(
  buckets: Bucket[],
  transactions: Transaction[],
  expenses: Expense[],
  milestones: Milestone[]
): {
  reconciledBuckets: Bucket[];
  reconciledTransactions: Transaction[];
  reconciledExpenses: Expense[];
  reconciledMilestones: Milestone[];
  summaryMessage: string;
} {
  // 1. Identify primary active bucket (the one with highest percentage or first active)
  let activeBuckets = buckets.filter((b) => b.percentage > 0);
  if (activeBuckets.length === 0 && buckets.length > 0) {
    activeBuckets = [buckets[0]];
  }
  const primaryBucket = activeBuckets[0] || buckets[0];

  let currentTxns = [...transactions];
  let currentExpenses = [...expenses];
  let currentMilestones = [...milestones];
  let currentBuckets = [...buckets];

  const now = new Date().toISOString();

  // 2. Fix Negative Balances by offsetting against surplus buckets
  const computedBuckets = computeBucketBalances(currentBuckets, currentTxns);
  const negativeBuckets = computedBuckets.filter((b) => b.balance < 0);
  const surplusBuckets = computedBuckets.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);

  const transferTxns: Transaction[] = [];

  negativeBuckets.forEach((negBucket) => {
    let deficit = Math.abs(negBucket.balance);
    for (const surplusBucket of surplusBuckets) {
      if (deficit <= 0) break;
      if (surplusBucket.balance <= 0) continue;

      const offsetAmt = Math.min(deficit, surplusBucket.balance);
      surplusBucket.balance -= offsetAmt;
      deficit -= offsetAmt;

      // Create debit from surplus
      transferTxns.push({
        id: `txn_recon_deb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        bucketId: surplusBucket.id,
        bucketName: surplusBucket.name,
        type: 'TRANSFER',
        amount: offsetAmt,
        direction: 'DEBIT',
        description: `Auto-Reconciliation Offset to balance ${negBucket.name}`,
        sourceType: 'SYSTEM_ADJUSTMENT',
        createdAt: now,
      });

      // Create credit to negative bucket
      transferTxns.push({
        id: `txn_recon_crd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        bucketId: negBucket.id,
        bucketName: negBucket.name,
        type: 'TRANSFER',
        amount: offsetAmt,
        direction: 'CREDIT',
        description: `Auto-Reconciliation Offset from ${surplusBucket.name}`,
        sourceType: 'SYSTEM_ADJUSTMENT',
        createdAt: now,
      });
    }
  });

  currentTxns = [...transferTxns, ...currentTxns];

  // 3. Consolidate inactive 0% buckets into primary bucket if multiple buckets exist
  const inactive0PercentBuckets = currentBuckets.filter(
    (b) => b.percentage === 0 && b.id !== primaryBucket.id
  );

  inactive0PercentBuckets.forEach((inactiveB) => {
    // Re-link transactions
    currentTxns = currentTxns.map((t) =>
      t.bucketId === inactiveB.id
        ? { ...t, bucketId: primaryBucket.id, bucketName: primaryBucket.name }
        : t
    );

    // Re-link expenses
    currentExpenses = currentExpenses.map((e) =>
      e.bucketId === inactiveB.id
        ? { ...e, bucketId: primaryBucket.id, bucketName: primaryBucket.name }
        : e
    );

    // Re-link milestones
    currentMilestones = currentMilestones.map((m) =>
      m.bucketId === inactiveB.id ? { ...m, bucketId: primaryBucket.id } : m
    );
  });

  // 4. Retain only active buckets (plus primary bucket)
  let remainingBuckets = currentBuckets.filter(
    (b) => b.id === primaryBucket.id || b.percentage > 0
  );

  // Normalize percentages to total 100%
  const currentTotal = remainingBuckets.reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);
  if (currentTotal !== 100) {
    if (remainingBuckets.length === 1) {
      remainingBuckets[0].percentage = 100;
    } else if (currentTotal > 0) {
      remainingBuckets = remainingBuckets.map((b) => ({
        ...b,
        percentage: Math.round(((Number(b.percentage) || 0) / currentTotal) * 100),
      }));
      // Adjust rounding remainder to primary
      const newSum = remainingBuckets.reduce((sum, b) => sum + b.percentage, 0);
      if (newSum !== 100 && remainingBuckets.length > 0) {
        remainingBuckets[0].percentage += 100 - newSum;
      }
    } else {
      const evenSplit = Math.floor(100 / remainingBuckets.length);
      remainingBuckets = remainingBuckets.map((b) => ({ ...b, percentage: evenSplit }));
      remainingBuckets[0].percentage += 100 - evenSplit * remainingBuckets.length;
    }
  }

  // 5. Recompute dynamic balances
  const reconciledBuckets = computeBucketBalances(remainingBuckets, currentTxns);

  return {
    reconciledBuckets,
    reconciledTransactions: currentTxns,
    reconciledExpenses: currentExpenses,
    reconciledMilestones: currentMilestones,
    summaryMessage: `Auto-reconciled! Negative deficits resolved, ${inactive0PercentBuckets.length} inactive categories consolidated into ${primaryBucket.name}, and allocations normalized to 100%.`,
  };
}
