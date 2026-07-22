/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { formatCurrency, convertCurrency } from '../lib/utils';

interface QuickAmountsProps {
  onSelect: (amount: number) => void;
  inputCurrency: string;
  defaultCurrency: string;
  exchangeRates: { [key: string]: number };
}

export function QuickAmounts({ onSelect, inputCurrency, defaultCurrency, exchangeRates }: QuickAmountsProps) {
  // Base amounts in NGN as requested: 50k, 100k, 250k, 500k, 1M
  const amountsNGN = [50000, 100000, 250000, 500000, 1000000];

  const handleAmountClick = (amountInNaira: number) => {
    // If input currency is NGN, we use it directly.
    // If input currency is USD, we convert the Naira value to USD for the user!
    if (inputCurrency === 'NGN') {
      onSelect(amountInNaira);
    } else {
      const converted = convertCurrency(amountInNaira, 'NGN', inputCurrency, exchangeRates);
      // Round to nice clean numbers or decimals if small
      const rounded = converted > 100 ? Math.round(converted) : Math.round(converted * 10) / 10;
      onSelect(rounded);
    }
  };

  return (
    <div id="quick-amounts-container" className="flex flex-wrap gap-2 mt-2">
      {amountsNGN.map((amt) => {
        // Display label in Naira for reference
        const displayLabel = formatCurrency(amt, 'NGN');
        return (
          <button
            key={amt}
            id={`quick-amount-${amt}`}
            type="button"
            onClick={() => handleAmountClick(amt)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            {displayLabel}
          </button>
        );
      })}
    </div>
  );
}
