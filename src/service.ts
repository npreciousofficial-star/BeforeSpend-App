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
