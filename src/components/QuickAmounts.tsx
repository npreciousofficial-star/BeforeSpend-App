/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { formatCompactCurrency, convertCurrency } from '../lib/utils';

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
    if (inputCurrency === 'NGN') {
      onSelect(amountInNaira);
    } else {
      const converted = convertCurrency(amountInNaira, 'NGN', inputCurrency, exchangeRates);
      const rounded = converted > 100 ? Math.round(converted) : Math.round(converted * 10) / 10;
      onSelect(rounded);
    }
  };

  return (
    <div id="quick-amounts-container" className="flex flex-wrap gap-2 mt-2">
      {amountsNGN.map((amt) => {
        const displayLabel = formatCompactCurrency(amt, 'NGN');
        return (
          <button
            key={amt}
            id={`quick-amount-${amt}`}
            type="button"
            onClick={() => handleAmountClick(amt)}
            className="px-3 py-1.5 text-xs font-black rounded-xl bg-teal-50/80 hover:bg-[#00A896] text-[#0E2A47] hover:text-white border border-[#00A896]/30 dark:bg-zinc-900 dark:hover:bg-[#00A896] dark:border-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs"
          >
            {displayLabel}
          </button>
        );
      })}
    </div>
  );
}
