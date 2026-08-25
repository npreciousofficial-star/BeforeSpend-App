/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bucket, SplitInfo } from '../types';

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
