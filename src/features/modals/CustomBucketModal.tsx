/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { CustomSelect } from '../../components/CustomSelect';
import { generateId } from '../../utils';
import { Bucket } from '../../types';
import { X } from 'lucide-react';

interface CustomBucketModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBucket?: Bucket | null;
  onDeleteBucket?: (id: string) => void;
}

export const CustomBucketModal: React.FC<CustomBucketModalProps> = ({
  isOpen,
  onClose,
  editingBucket,
  onDeleteBucket,
}) => {
  const { buckets, setBuckets, userProfile, addToast } = useAppContext();

  const [bucketName, setBucketName] = useState('');
  const [bucketPercentage, setBucketPercentage] = useState<number | string>(10);
  const [bucketAccount, setBucketAccount] = useState('Default Account');
  const [bucketColor, setBucketColor] = useState('emerald');
  const [bucketNote, setBucketNote] = useState('');
  const [bucketThreshold, setBucketThreshold] = useState<number | string>('');

  useEffect(() => {
    if (editingBucket) {
      setBucketName(editingBucket.name);
      setBucketPercentage(editingBucket.percentage);
      setBucketAccount(editingBucket.destinationAccount);
      setBucketColor(editingBucket.color);
      setBucketNote(editingBucket.note || '');
      setBucketThreshold(
        editingBucket.lowBalanceThreshold !== undefined ? editingBucket.lowBalanceThreshold : ''
      );
    } else {
      setBucketName('');
      setBucketPercentage(10);
      setBucketAccount('Default Account');
      setBucketColor('emerald');
      setBucketNote('');
      setBucketThreshold('');
    }
  }, [editingBucket, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bucketName.trim()) {
      addToast('Please enter a bucket name.', 'error');
      return;
    }

    const parsedPercent = parseFloat(bucketPercentage.toString());
    if (isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
      addToast('Percentage must be between 0 and 100.', 'error');
      return;
    }

    if (editingBucket) {
      setBuckets((prev) =>
        prev.map((b) => {
          if (b.id === editingBucket.id) {
            return {
              ...b,
              name: bucketName.trim(),
              percentage: parsedPercent,
              destinationAccount: bucketAccount.trim(),
              color: bucketColor,
              note: bucketNote.trim() || undefined,
              lowBalanceThreshold:
                bucketThreshold !== '' ? parseFloat(bucketThreshold.toString()) : undefined,
            };
          }
          return b;
        })
      );
      addToast(`Updated ${bucketName}!`, 'success');
    } else {
      const newBucket: Bucket = {
        id: generateId('bucket'),
        name: bucketName.trim(),
        percentage: parsedPercent,
        destinationAccount: bucketAccount.trim(),
        color: bucketColor,
        note: bucketNote.trim() || undefined,
        lowBalanceThreshold:
          bucketThreshold !== '' ? parseFloat(bucketThreshold.toString()) : undefined,
        balance: 0,
      };
      setBuckets((prev) => [...prev, newBucket]);
      addToast(`Added custom bucket "${bucketName}"!`, 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-base font-black text-gray-900 dark:text-zinc-50">
            {editingBucket ? `Configure ${editingBucket.name}` : 'Add Custom Budget Bucket'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Bucket Name *
            </label>
            <input
              type="text"
              required
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200/80 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 hover:border-[#00A896]/50 focus:border-[#00A896] focus:outline-none shadow-2xs transition-all"
              placeholder="e.g. Health & Dental Fund"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                Percentage Split (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={bucketPercentage}
                onChange={(e) => setBucketPercentage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200/80 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 hover:border-[#00A896]/50 focus:border-[#00A896] focus:outline-none shadow-2xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                Destination Account *
              </label>
              <input
                type="text"
                required
                value={bucketAccount}
                onChange={(e) => setBucketAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200/80 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 hover:border-[#00A896]/50 focus:border-[#00A896] focus:outline-none shadow-2xs transition-all"
                placeholder="e.g. Kuda Stash"
              />
            </div>
          </div>

          <CustomSelect
            label="Color Palette Theme"
            value={bucketColor}
            onChange={(val) => setBucketColor(val)}
            options={[
              { value: 'emerald', label: 'Emerald Green' },
              { value: 'blue', label: 'Blue Sky' },
              { value: 'amber', label: 'Amber Orange' },
              { value: 'red', label: 'Rose Red' },
              { value: 'purple', label: 'Purple Amethyst' },
              { value: 'teal', label: 'Teal Cyan' },
              { value: 'indigo', label: 'Indigo Slate' },
              { value: 'pink', label: 'Pink Punch' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              value={bucketNote}
              onChange={(e) => setBucketNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200/80 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 hover:border-[#00A896]/50 focus:border-[#00A896] focus:outline-none shadow-2xs transition-all"
              placeholder="What this bucket is for..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Low Balance Alert Threshold ({userProfile.defaultCurrency})
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 50000 (Optional)"
              value={bucketThreshold}
              onChange={(e) => setBucketThreshold(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200/80 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 hover:border-[#00A896]/50 focus:border-[#00A896] focus:outline-none shadow-2xs transition-all"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          {editingBucket && onDeleteBucket && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteBucket(editingBucket.id);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-950/30 cursor-pointer transition-all border border-rose-250 dark:border-rose-900/50"
            >
              Delete Category
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white cursor-pointer transition-colors"
            >
              {editingBucket ? 'Save Changes' : 'Create Bucket'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
