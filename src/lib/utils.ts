/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bucket, SplitInfo } from '../types';

export const DEFAULT_EXCHANGE_RATES = {
  NGN: 1,
  USD: 1600,
  EUR: 1720,
  GBP: 2050,
  CAD: 1150,
};

/**
 * Format a number into currency presentation
 */
export function formatCurrency(amount: number, currencyCode: string = 'NGN'): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  
  let formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);

  switch (currencyCode) {
    case 'NGN':
      return `₦${formatted}`;
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    case 'GBP':
      return `£${formatted}`;
    case 'CAD':
      return `C$${formatted}`;
    default:
      return `${currencyCode} ${formatted}`;
  }
}

/**
 * Calculate the distribution of a payment into current buckets
 */
export function calculateSplits(amount: number, buckets: Bucket[]): SplitInfo[] {
  const activeBuckets = buckets.filter((b) => b.percentage > 0);
  const totalPercentage = activeBuckets.reduce((sum, b) => sum + b.percentage, 0);
  
  if (totalPercentage === 0) return [];
  
  return activeBuckets.map((bucket) => {
    // Normalise percentage if total isn't exactly 100 (though we validate in settings)
    const normalizedPercentage = (bucket.percentage / totalPercentage) * 100;
    const splitAmount = (amount * normalizedPercentage) / 100;
    
    return {
      bucketId: bucket.id,
      bucketName: bucket.name,
      percentage: bucket.percentage,
      amount: splitAmount,
      color: bucket.color,
      destinationAccount: bucket.destinationAccount,
    };
  });
}

/**
 * Tailwind-merge alike class concatenator
 */
export function cn(...classes: (string | undefined | null | boolean | { [key: string]: boolean })[]): string {
  const result: string[] = [];
  
  classes.forEach((c) => {
    if (!c) return;
    if (typeof c === 'string') {
      result.push(c);
    } else if (typeof c === 'object') {
      Object.keys(c).forEach((key) => {
        if (c[key]) result.push(key);
      });
    }
  });
  
  return result.join(' ');
}

/**
 * Generate a unique valid PostgreSQL UUID
 */
export function generateId(_prefix?: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Convert values between currencies using exchange rates relative to NGN
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: { [key: string]: number } = DEFAULT_EXCHANGE_RATES
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert fromSource to NGN first
  const rateToNaira = exchangeRates[fromCurrency] || 1;
  const amountInNaira = amount * rateToNaira;
  
  // Convert from NGN toTarget
  const rateFromNaira = exchangeRates[toCurrency] || 1;
  return amountInNaira / rateFromNaira;
}
