/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bucket } from '../../types';
import { CustomSelect } from '../../components/CustomSelect';
import { formatCurrency } from '../../utils';
import { X, ShieldAlert } from 'lucide-react';

interface ConsolidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceBucket: Bucket | null;
}

export const ConsolidateModal: React.FC<ConsolidateModalProps> = ({
  isOpen,
  onClose,
  sourceBucket,
}) => {
  const { buckets, userProfile, executeBucketConsolidation } = useAppContext();
  const [targetId, setTargetId] = useState('');
  const [consolidatePercentage, setConsolidatePercentage] = useState(true);

  if (!isOpen || !sourceBucket) return null;

  const otherBuckets = buckets.filter((b) => b.id !== sourceBucket.id);
  const effectiveTargetId = targetId || (otherBuckets[0]?.id ?? '');

  const handleConfirm = async () => {
    if (!effectiveTargetId) return;
    await executeBucketConsolidation(sourceBucket, effectiveTargetId, consolidatePercentage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-2">
          <h3 className="text-base font-black text-gray-900 dark:text-zinc-50">
            Consolidate & Delete Category
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            You are deleting <span className="font-black">{sourceBucket.name}</span> with a balance of{' '}
            <span className="font-black">
              {formatCurrency(sourceBucket.balance, userProfile.defaultCurrency)}
            </span>
            . All historical ledger entries will be safely migrated to the target bucket selected below.
          </div>
        </div>

        <div className="space-y-3">
          <CustomSelect
            label="Merge Balance & Ledger Records Into *"
            value={effectiveTargetId}
            onChange={(val) => setTargetId(val)}
            options={otherBuckets.map((b) => ({
              value: b.id,
              label: `${b.name} (${formatCurrency(b.balance, userProfile.defaultCurrency)})`,
            }))}
          />

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={consolidatePercentage}
              onChange={(e) => setConsolidatePercentage(e.target.checked)}
              className="rounded text-[#00A896] focus:ring-[#00A896]"
            />
            <span>
              Add {sourceBucket.percentage}% split allocation to target bucket
            </span>
          </label>
        </div>

        <div className="flex gap-2 justify-end pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-md"
          >
            Confirm & Merge
          </button>
        </div>
      </div>
    </div>
  );
};
