/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_EXCHANGE_RATES = {
  NGN: 1,
  USD: 1600,
  EUR: 1720,
  GBP: 2050,
  CAD: 1150,
};

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
