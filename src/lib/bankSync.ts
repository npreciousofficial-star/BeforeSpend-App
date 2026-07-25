/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Bucket } from '../types';
import { generateId } from './utils';

export interface BankSyncConnection {
  id: string;
  userId: string;
  provider: 'plaid' | 'mono' | 'manual'; // Plaid for US, Mono for Nigeria
  bankName: string;
  status: 'linked' | 'expired' | 'error';
  lastSyncedAt: string;
}

export interface BankSyncAccount {
  id: string;
  connectionId: string;
  accountName: string;
  mask: string;
  type: 'checking' | 'savings' | 'credit';
  currency: string;
  balance: number;
}

/**
 * 1. Initialize Bank Connection Flow (Under-the-hood setup)
 */
export async function initializeBankConnection(
  userId: string,
  provider: 'plaid' | 'mono'
): Promise<{ linkToken: string; success: boolean }> {
  console.log(`[BankSync Engine] Initializing connection token for provider: ${provider} (User: ${userId})`);
  
  // This simulates fetch token from backend server
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  return {
    linkToken: `token_sandbox_${generateId()}`,
    success: true,
  };
}

/**
 * 2. Exchange Public Token for Access Token and Save to Database
 */
export async function saveBankAccessCredentials(
  userId: string,
  publicToken: string,
  provider: 'plaid' | 'mono',
  bankName: string
): Promise<BankSyncConnection | null> {
  console.log(`[BankSync Engine] Exchanging credentials token for secure access identifier...`);
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    id: generateId('conn'),
    userId,
    provider,
    bankName,
    status: 'linked',
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * 3. Fetch Live Bank Transactions (Background sync engine stub)
 * Downloads live bank transactions, maps them to Category/Bucket naming rules,
 * and outputs enriched Transactions ready to merge into ledger.
 */
export async function syncLiveBankTransactions(
  connection: BankSyncConnection,
  buckets: Bucket[]
): Promise<Transaction[]> {
  console.log(`[BankSync Engine] Querying live database ledger feed from provider API...`);
  
  // Simulated fetch
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Returns empty array for now so it doesn't pollute user database, but ready to load live objects
  return [];
}

/**
 * 4. Helper: Auto-Route Statement Description to best-matching bucket
 */
export function autoRouteDescriptionToBucket(
  description: string,
  buckets: Bucket[]
): { bucketId: string; bucketName: string } | null {
  const normalizedDesc = description.toLowerCase();
  
  // 1. Match typical US / Nigerian utilities
  if (normalizedDesc.includes('netflix') || normalizedDesc.includes('spotify') || normalizedDesc.includes('apple') || normalizedDesc.includes('aws') || normalizedDesc.includes('hosting')) {
    const opex = buckets.find(b => b.name.toLowerCase().includes('operating') || b.name.toLowerCase().includes('wants') || b.id === 'opex');
    if (opex) return { bucketId: opex.id, bucketName: opex.name };
  }
  
  // 2. Rent / Mortgage / Uber / Groceries -> Essentials
  if (normalizedDesc.includes('uber') || normalizedDesc.includes('grocery') || normalizedDesc.includes('walmart') || normalizedDesc.includes('target') || normalizedDesc.includes('tax') || normalizedDesc.includes('konga')) {
    const essentials = buckets.find(b => b.name.toLowerCase().includes('essential') || b.name.toLowerCase().includes('salary') || b.id === 'salary');
    if (essentials) return { bucketId: essentials.id, bucketName: essentials.name };
  }
  
  // 3. Investments / Stocks
  if (normalizedDesc.includes('etf') || normalizedDesc.includes('broker') || normalizedDesc.includes('fidelity') || normalizedDesc.includes('savings')) {
    const savings = buckets.find(b => b.name.toLowerCase().includes('saving') || b.name.toLowerCase().includes('invest') || b.id === 'growth' || b.id === 'growth-investment');
    if (savings) return { bucketId: savings.id, bucketName: savings.name };
  }
  
  return null;
}
