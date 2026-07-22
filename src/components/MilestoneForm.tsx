/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bucket } from '../types';
import { generateId } from '../lib/utils';
import { Target, Plus } from 'lucide-react';

interface MilestoneFormProps {
  buckets: Bucket[];
  currency: string;
  onAdd: (milestone: { id: string; name: string; targetAmount: number; bucketId: string; createdDate: string }) => void;
}

export function MilestoneForm({ buckets, currency, onAdd }: MilestoneFormProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [bucketId, setBucketId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a goal name.');
      return;
    }

    const parsedAmount = parseFloat(targetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid target amount greater than 0.');
      return;
    }

    if (!bucketId) {
      setError('Please select a bucket to fund this goal.');
      return;
    }

    onAdd({
      id: generateId(),
      name: name.trim(),
      targetAmount: parsedAmount,
      bucketId,
      createdDate: new Date().toISOString(),
    });

    // Reset Form
    setName('');
    setTargetAmount('');
    setBucketId('');
  };

  return (
    <form
      id="milestone-creation-form"
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
          Set Savings Milestone
        </h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
            Goal Name
          </label>
          <input
            id="milestone-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. New MacBook Pro, Office Desk, Tech Vault"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Target Amount ({currency === 'NGN' ? '₦' : currency})
            </label>
            <input
              id="milestone-target-input"
              type="number"
              min="0"
              step="any"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Fund From Bucket
            </label>
            <select
              id="milestone-bucket-select"
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Select bucket...</option>
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.percentage}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p id="milestone-form-error" className="text-xs font-medium text-rose-500">
            {error}
          </p>
        )}

        <button
          id="submit-milestone-button"
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all hover:shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Savings Milestone
        </button>
      </div>
    </form>
  );
}
