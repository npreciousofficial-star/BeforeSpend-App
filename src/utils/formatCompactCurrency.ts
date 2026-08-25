/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
