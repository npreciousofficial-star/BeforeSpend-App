/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { SplitCalculator } from '../../components/SplitCalculator';
import { HistoryEntryList } from '../../components/HistoryEntry';
import { SkeletonContentBlock } from '../../components/Preloader';
import { ShieldAlert } from 'lucide-react';

interface SplitsViewProps {
  onOpenQuickSplit?: () => void;
}

export const SplitsView: React.FC<SplitsViewProps> = () => {
  const { 
    buckets, 
    history, 
    userProfile, 
    exchangeRates, 
    dataLoaded, 
    setActiveTab, 
    handleSavePayment, 
    handleDeleteHistory, 
    handleClearHistory 
  } = useAppContext();

  const currentTotalAllocPercentage = buckets.reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);

  return (
    <div id="view-split-tab" className="space-y-6">
      {!dataLoaded ? (
        <div className="space-y-4">
          <SkeletonContentBlock />
          <SkeletonContentBlock />
        </div>
      ) : (
        <>
          {currentTotalAllocPercentage !== 100 && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold">Allocation Mismatch ({currentTotalAllocPercentage}%)</span>: Budget percentages must sum to exactly 100% for precise automatic split calculations. Update this in the{' '}
                <span className="underline cursor-pointer font-bold" onClick={() => setActiveTab('more')}>
                  Settings Tab
                </span>
                .
              </div>
            </div>
          )}
          <SplitCalculator
            buckets={buckets}
            onSavePayment={handleSavePayment}
            defaultCurrency={userProfile.defaultCurrency}
            exchangeRates={exchangeRates}
          />

          <div className="mt-8 border-t border-gray-100 dark:border-zinc-800 pt-6">
            <HistoryEntryList
              entries={history}
              currency={userProfile.defaultCurrency}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearHistory}
            />
          </div>
        </>
      )}
    </div>
  );
};
