/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Milestone, Bucket } from '../types';
import { formatCurrency } from '../lib/utils';
import { Target, Trash2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface MilestoneCardProps {
  key?: string;
  milestone: Milestone;
  associatedBucket: Bucket | undefined;
  currency: string;
  onDelete: (id: string) => void;
  onToggleComplete?: (id: string) => void;
}

export function MilestoneCard({ milestone, associatedBucket, currency, onDelete, onToggleComplete }: MilestoneCardProps) {
  const currentBalance = associatedBucket ? associatedBucket.balance : 0;
  const isManuallyCompleted = Boolean(milestone.completed);
  const isAutoReached = currentBalance >= milestone.targetAmount;
  const isReached = isManuallyCompleted || isAutoReached;
  
  // Calculate percentage, maxing out at 100%
  const percentage = isManuallyCompleted
    ? 100
    : Math.min(
        100,
        milestone.targetAmount > 0 ? Math.max(0, (currentBalance / milestone.targetAmount) * 100) : 0
      );

  const remainingAmount = Math.max(0, milestone.targetAmount - currentBalance);

  return (
    <motion.div
      id={`milestone-card-${milestone.id}`}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`p-5 rounded border transition-all duration-300 relative group bg-white dark:bg-zinc-950 dark:border-zinc-800 ${
        isReached 
          ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/5' 
          : 'border-gray-200 dark:border-zinc-800'
      }`}
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2.5 rounded ${
            isReached 
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' 
              : 'bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400'
          }`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-zinc-50 text-base leading-tight">
              {milestone.name}
            </h4>
            <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium mt-0.5 block">
              Funded by: {associatedBucket ? associatedBucket.name : 'Unknown Bucket'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleComplete && (
            <button
              id={`toggle-milestone-${milestone.id}`}
              onClick={() => onToggleComplete(milestone.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                isManuallyCompleted
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                  : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-[#00A896] hover:text-white'
              }`}
              title={isManuallyCompleted ? 'Click to mark as active/in-progress' : 'Click to manually mark as completed'}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isManuallyCompleted ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span>{isManuallyCompleted ? 'Completed' : 'Mark Done'}</span>
            </button>
          )}

          <button
            id={`delete-milestone-${milestone.id}`}
            onClick={() => onDelete(milestone.id)}
            className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            title="Delete milestone"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="flex justify-between items-end text-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Progress</span>
            <span className="font-extrabold text-gray-700 dark:text-zinc-300">
              {formatCurrency(isManuallyCompleted ? milestone.targetAmount : currentBalance, currency)} <span className="text-gray-400 font-normal">/ {formatCurrency(milestone.targetAmount, currency)}</span>
            </span>
          </div>
          <span className={`text-xs font-black ${isReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>

        {/* Custom Progress Bar */}
        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-900 rounded overflow-hidden">
          <motion.div
            id={`milestone-progress-bar-${milestone.id}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded ${
              isReached 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
            }`}
          />
        </div>

        <div className="flex justify-between items-center pt-1">
          {isReached ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {isManuallyCompleted ? 'Marked as completed' : 'Goal reached'}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(remainingAmount, currency)}</strong> more to go
            </span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
            {isManuallyCompleted && milestone.completedDate
              ? `Completed ${new Date(milestone.completedDate).toLocaleDateString()}`
              : `Created ${new Date(milestone.createdDate).toLocaleDateString()}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
