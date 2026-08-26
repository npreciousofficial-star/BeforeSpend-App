/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bucket } from '../../types';
import { RotateCcw, Sparkles } from 'lucide-react';
import { getLocalizedDefaultBuckets } from '../../data/defaultBuckets';

interface BucketSetupTableProps {
  onEditBucket: (bucket: Bucket) => void;
  onDeleteBucket: (id: string) => void;
}

export const BucketSetupTable: React.FC<BucketSetupTableProps> = ({
  onEditBucket,
  onDeleteBucket,
}) => {
  const { buckets, setBuckets, userProfile, addToast, handleAutoReconcileWorkspace } = useAppContext();

  const currentTotalAllocPercentage = buckets.reduce(
    (sum, b) => sum + (Number(b.percentage) || 0),
    0
  );

  const handleResetToDefaultBuckets = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset all budget buckets to the localized default preset? This will overwrite your custom bucket structure.'
    );
    if (!confirmReset) return;

    const defaults = getLocalizedDefaultBuckets(userProfile.defaultCurrency);
    setBuckets(defaults);
    addToast('Budget buckets reset to regional default preset!', 'info');
  };

  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
            Budget Buckets Setup
          </h3>
          <p className="text-xs text-gray-400">Specify running splits, accounts, and color tags.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="auto-reconcile-buckets-btn"
            type="button"
            onClick={handleAutoReconcileWorkspace}
            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-[#00A896] text-[#00A896] hover:text-white dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-[#00A896] dark:hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-[#00A896]/20 cursor-pointer shadow-2xs"
            title="Auto-reconcile negative balances and clean inactive 0% categories"
          >
            <Sparkles className="w-3.5 h-3.5" /> Auto-Reconcile & Clean
          </button>
          <button
            id="reset-to-defaults-btn"
            onClick={handleResetToDefaultBuckets}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-500">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-900 pb-2 text-gray-400 font-bold">
              <th className="py-2 font-bold">Bucket Name</th>
              <th className="py-2 font-bold">Account</th>
              <th className="py-2 font-bold text-center">Percentage</th>
              <th className="py-2 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-900">
            {buckets.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/10">
                <td className="py-2.5 font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full`}
                    style={{ backgroundColor: b.color }}
                  />
                  {b.name}
                </td>
                <td className="py-2.5 font-semibold text-gray-600 dark:text-zinc-400">
                  {b.destinationAccount}
                </td>
                <td className="py-2.5 font-bold text-center text-gray-900 dark:text-zinc-50">
                  {b.percentage}%
                </td>
                <td className="py-2.5 text-right whitespace-nowrap space-x-2">
                  <button
                    id={`edit-bucket-btn-${b.id}`}
                    onClick={() => onEditBucket(b)}
                    className="text-[#00A896] hover:text-[#0E2A47] font-bold hover:underline cursor-pointer"
                  >
                    Configure
                  </button>
                  {!b.isSystem && (
                    <button
                      onClick={() => onDeleteBucket(b.id)}
                      className="text-rose-500 hover:text-rose-750 font-bold hover:underline cursor-pointer ml-3.5"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-2 text-xs font-bold">
        <span className="text-gray-400">Total Split Allocations:</span>
        <span className={currentTotalAllocPercentage === 100 ? 'text-[#00A896]' : 'text-rose-500'}>
          {currentTotalAllocPercentage}% / 100%
        </span>
      </div>
    </div>
  );
};
