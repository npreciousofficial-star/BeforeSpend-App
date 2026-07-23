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
 * Format large amounts compactly: e.g. 50k, 100k, 250k, 500k, 1M
 */
export function formatCompactCurrency(amount: number, currencyCode: string = 'NGN'): string {
  let symbol = '₦';
  switch (currencyCode) {
    case 'USD': symbol = '$'; break;
    case 'EUR': symbol = '€'; break;
    case 'GBP': symbol = '£'; break;
    case 'CAD': symbol = 'C$'; break;
    default: symbol = '₦'; break;
  }

  const absAmt = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmt >= 1000000) {
    const val = absAmt / 1000000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `${sign}${symbol}${formatted}M`;
  }
  if (absAmt >= 1000) {
    const val = absAmt / 1000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `${sign}${symbol}${formatted}k`;
  }
  return `${sign}${symbol}${absAmt.toLocaleString()}`;
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

/**
 * Generate a deterministic audit hash from transaction data.
 * Uses a fast FNV-1a-inspired hash for fingerprinting transaction integrity.
 */
export function generateAuditHash(data: {
  amount: number;
  description: string;
  bucketId?: string | null;
  direction: string;
  createdAt: string;
}): string {
  const raw = `${data.amount}|${data.description}|${data.bucketId || ''}|${data.direction}|${data.createdAt}`;
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Convert to unsigned 32-bit hex and pad
  return ((hash >>> 0).toString(16)).padStart(8, '0') + ((hash >>> 0 ^ 0xdeadbeef).toString(16)).padStart(8, '0');
}

/**
 * Compress an image file to a small thumbnail for localStorage-safe storage.
 * Resizes to maxDim x maxDim and encodes as JPEG at given quality.
 */
export function compressImageFile(file: File, maxDim = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        } else {
          if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(e.target?.result as string); return; }

        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
