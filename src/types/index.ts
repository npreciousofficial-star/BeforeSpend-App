/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Bucket {
  id: string;
  name: string;
  percentage: number;
  color: string; // Tailwind color class or Hex
  destinationAccount: string;
  targetBank?: string;
  isSystem?: boolean;
  note?: string;
  balance: number; // Computed dynamically: Sum(CREDIT) - Sum(DEBIT)
  lowBalanceThreshold?: number; // Optional low balance threshold for notifications
}

export type TransactionType = 'INCOME_SPLIT' | 'EXPENSE' | 'MANUAL_ADJUSTMENT' | 'TRANSFER';
export type TransactionDirection = 'CREDIT' | 'DEBIT';
export type TransactionSourceType = 'MANUAL_ENTRY' | 'CSV_IMPORT' | 'SYSTEM_ADJUSTMENT';

export interface Transaction {
  id: string;
  userId?: string;
  bucketId?: string | null;
  bucketName?: string;
  type: TransactionType;
  amount: number; // Always positive numeric value
  direction: TransactionDirection;
  description: string;
  receiptUrl?: string;
  sourceType: TransactionSourceType;
  deduplicationHash?: string;
  createdAt: string; // ISO String
}

export interface StatementRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  direction: TransactionDirection;
  deduplicationHash: string;
  isDuplicate: boolean;
  selectedBucketId?: string;
  status: 'PENDING' | 'IMPORTED' | 'SKIPPED';
}

export interface SplitInfo {
  bucketId: string;
  bucketName: string;
  percentage: number;
  amount: number;
  color: string;
  destinationAccount: string;
}

export interface PaymentEntry {
  id: string;
  date: string;
  amount: number; // original currency amount
  currency: string; // USD, NGN, etc.
  convertedAmount: number; // in base currency
  splits: SplitInfo[];
  note?: string;
  receiptImage?: string; // base64 encoded image
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  bucketId: string;
  bucketName: string;
  date: string;
  receiptImage?: string; // base64 encoded image
}

export interface Milestone {
  id: string;
  name: string;
  targetAmount: number;
  bucketId: string;
  createdDate: string;
}

export interface Reminder {
  id: string;
  text: string;
  dueDate: string;
  done: boolean;
  type: 'manual' | 'auto'; // 'auto' is for subscriptions/recurring items
  period?: 'monthly' | 'yearly';
  note?: string;
  cost?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string; // base64 or preset identifier
  defaultCurrency: string; // 'NGN' | 'USD' | 'EUR' | 'GBP'
  phoneNumber?: string;
}

export interface ExchangeRate {
  [currencyCode: string]: number; // conversion factor to NGN (e.g. USD: 1500)
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface BucketTemplate {
  name: string;
  description: string;
  buckets: Omit<Bucket, 'id' | 'balance'>[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string; // ISO string format
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}

