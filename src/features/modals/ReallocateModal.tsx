/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { CustomSelect } from '../../components/CustomSelect';
import { formatCurrency, generateId, generateAuditHash } from '../../utils';
import { Transaction } from '../../types';
import { X } from 'lucide-react';

interface ReallocateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReallocateModal: React.FC<ReallocateModalProps> = ({ isOpen, onClose }) => {
  const { buckets, userProfile, setTransactions, addToast } = useAppContext();
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  if (!isOpen) return null;

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSourceId || !transferTargetId) {
      addToast('Please select both a source and target bucket.', 'error');
      return;
    }
    if (transferSourceId === transferTargetId) {
      addToast('Source and Target buckets cannot be the same.', 'error');
      return;
    }

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast('Please enter a valid transfer amount.', 'error');
      return;
    }

    const sourceBucket = buckets.find((b) => b.id === transferSourceId);
    const targetBucket = buckets.find((b) => b.id === transferTargetId);

    if (!sourceBucket || !targetBucket) {
      addToast('Selected bucket not found.', 'error');
      return;
    }

    if (sourceBucket.balance < amt) {
      addToast(
        `Insufficient balance in ${sourceBucket.name}. Available: ${formatCurrency(
          sourceBucket.balance,
          userProfile.defaultCurrency
        )}`,
        'error'
      );
      return;
    }

    const now = new Date().toISOString();
    const debitTxn: Transaction = {
      id: generateId('txn'),
      bucketId: sourceBucket.id,
      bucketName: sourceBucket.name,
      type: 'TRANSFER',
      amount: amt,
      direction: 'DEBIT',
      description: transferNote
        ? `Reallocation Outflow to ${targetBucket.name}: ${transferNote}`
        : `Reallocation Outflow to ${targetBucket.name}`,
      sourceType: 'MANUAL_ENTRY',
      createdAt: now,
      deduplicationHash: generateAuditHash({
        amount: amt,
        description: `Reallocation Outflow to ${targetBucket.name}`,
        bucketId: sourceBucket.id,
        direction: 'DEBIT',
        createdAt: now,
      }),
    };

    const creditTxn: Transaction = {
      id: generateId('txn'),
      bucketId: targetBucket.id,
      bucketName: targetBucket.name,
      type: 'TRANSFER',
      amount: amt,
      direction: 'CREDIT',
      description: transferNote
        ? `Reallocation Inflow from ${sourceBucket.name}: ${transferNote}`
        : `Reallocation Inflow from ${sourceBucket.name}`,
      sourceType: 'MANUAL_ENTRY',
      createdAt: now,
      deduplicationHash: generateAuditHash({
        amount: amt,
        description: `Reallocation Inflow from ${sourceBucket.name}`,
        bucketId: targetBucket.id,
        direction: 'CREDIT',
        createdAt: now,
      }),
    };

    setTransactions((prev) => [debitTxn, creditTxn, ...prev]);
    addToast(
      `Reallocated ${formatCurrency(amt, userProfile.defaultCurrency)} from ${
        sourceBucket.name
      } to ${targetBucket.name}`,
      'success'
    );

    setTransferAmount('');
    setTransferNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <form
        onSubmit={handleExecuteTransfer}
        className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-base font-black text-gray-900 dark:text-zinc-50">
            Reallocate / Transfer Funds
          </h3>
          <button
            type="button"
            id="close-transfer-funds-modal"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <CustomSelect
              label="Source Bucket (From) *"
              value={transferSourceId}
              onChange={(val) => setTransferSourceId(val)}
              placeholder="Select source category..."
              options={buckets.map((b) => ({
                value: b.id,
                label: `${b.name} (Available: ${formatCurrency(
                  b.balance,
                  userProfile.defaultCurrency
                )})`,
              }))}
            />
          </div>

          <div>
            <CustomSelect
              label="Target Bucket (To) *"
              value={transferTargetId}
              onChange={(val) => setTransferTargetId(val)}
              placeholder="Select target category..."
              options={buckets
                .filter((b) => b.id !== transferSourceId)
                .map((b) => ({
                  value: b.id,
                  label: `${b.name} (Current: ${formatCurrency(
                    b.balance,
                    userProfile.defaultCurrency
                  )})`,
                }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Amount to Transfer ({userProfile.defaultCurrency}) *
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="any"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 dark:text-zinc-150 focus:outline-none focus:border-[#00A896]"
              placeholder="e.g. 5000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 dark:text-zinc-150 focus:outline-none focus:border-[#00A896]"
              placeholder="Reason for transfer..."
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3">
          <button
            type="button"
            id="cancel-transfer-funds"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="submit-transfer-funds"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white cursor-pointer transition-colors shadow-md"
          >
            Execute Reallocation
          </button>
        </div>
      </form>
    </div>
  );
};
