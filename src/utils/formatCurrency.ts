/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
