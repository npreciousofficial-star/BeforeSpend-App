/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bucket } from '../types';
import { formatCurrency } from '../lib/utils';
import { AnimatedNumber } from './AnimatedNumber';
import { Landmark, TrendingUp, HelpCircle, AlertTriangle } from 'lucide-react';

interface BucketCardProps {
  bucket: Bucket;
  currency: string;
  onEdit?: (bucket: Bucket) => void;
  hideBalance?: boolean;
}

export function BucketCard({ bucket, currency, onEdit, hideBalance = false }: BucketCardProps) {
  const getThemeColor = (colorName: string) => {
    switch (colorName) {
      case 'emerald':
        return {
          dot: 'bg-emerald-500 dark:bg-emerald-400',
          bg: 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/40',
          text: 'text-emerald-700 dark:text-emerald-400',
          pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
          progress: 'bg-emerald-500',
        };
      case 'blue':
        return {
          dot: 'bg-blue-500 dark:bg-blue-400',
          bg: 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/40',
          text: 'text-blue-700 dark:text-blue-400',
          pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          progress: 'bg-blue-500',
        };
      case 'amber':
        return {
          dot: 'bg-amber-500 dark:bg-amber-400',
          bg: 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/40',
          text: 'text-amber-700 dark:text-amber-400',
          pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
          progress: 'bg-amber-500',
        };
      case 'red':
        return {
          dot: 'bg-rose-500 dark:bg-rose-400',
          bg: 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/40',
          text: 'text-rose-700 dark:text-rose-400',
          pill: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
          progress: 'bg-rose-500',
        };
      case 'purple':
        return {
          dot: 'bg-purple-500 dark:bg-purple-400',
          bg: 'bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/40',
          text: 'text-purple-700 dark:text-purple-400',
          pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
          progress: 'bg-purple-500',
        };
      case 'teal':
        return {
          dot: 'bg-teal-500 dark:bg-teal-400',
          bg: 'bg-teal-50/50 dark:bg-teal-950/10 border-teal-100 dark:border-teal-900/40',
          text: 'text-teal-700 dark:text-teal-400',
          pill: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
          progress: 'bg-teal-500',
        };
      case 'indigo':
        return {
          dot: 'bg-indigo-500 dark:bg-indigo-400',
          bg: 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/40',
          text: 'text-indigo-700 dark:text-indigo-400',
          pill: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
          progress: 'bg-indigo-500',
        };
      case 'pink':
        return {
          dot: 'bg-pink-500 dark:bg-pink-400',
          bg: 'bg-pink-50/50 dark:bg-pink-950/10 border-pink-100 dark:border-pink-900/40',
          text: 'text-pink-700 dark:text-pink-400',
          pill: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
          progress: 'bg-pink-500',
        };
      default:
        return {
          dot: 'bg-gray-500 dark:bg-gray-400',
          bg: 'bg-gray-50/50 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900/40',
          text: 'text-gray-700 dark:text-gray-400',
          pill: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
          progress: 'bg-gray-500',
        };
    }
  };

  const theme = getThemeColor(bucket.color);
  const isPositive = bucket.balance >= 0;

  return (
    <div
      id={`bucket-card-${bucket.id}`}
      className="group relative p-4 sm:p-4.5 rounded-2xl border border-[#0E2A47]/30 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs hover:shadow-md hover:border-[#0E2A47] transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${theme.dot}`} />
          <h3 className="font-extrabold text-[#0E2A47] dark:text-zinc-50 text-sm sm:text-base leading-snug">
            {bucket.name}
          </h3>
        </div>
        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${theme.pill}`}>
          {bucket.percentage}%
        </span>
      </div>

      <div className="space-y-2.5">
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              CURRENT BALANCE
            </span>
            {bucket.lowBalanceThreshold !== undefined && bucket.lowBalanceThreshold > 0 && bucket.balance < bucket.lowBalanceThreshold && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex-shrink-0">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Low Balance
              </span>
            )}
          </div>
          <span
            id={`bucket-balance-${bucket.id}`}
            className={`text-xl sm:text-2xl font-black tracking-tight transition-all duration-300 ${
              isPositive ? 'text-[#006654] dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            } ${hideBalance ? 'blur-md select-none' : ''}`}
          >
            <AnimatedNumber value={bucket.balance} currency={currency} />
          </span>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-zinc-900 flex flex-wrap items-center justify-between text-xs gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-zinc-300">
            <Landmark className="w-3.5 h-3.5 text-[#00A896] flex-shrink-0" />
            <span>{bucket.destinationAccount}</span>
          </div>
          {bucket.note && (
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium leading-snug">
              {bucket.note}
            </p>
          )}
        </div>
      </div>

      {onEdit && (
        <button
          id={`edit-bucket-${bucket.id}`}
          onClick={() => onEdit(bucket)}
          className="absolute top-3 right-3 text-[11px] font-bold text-gray-400 hover:text-[#00A896] dark:hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-gray-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md"
        >
          Edit
        </button>
      )}
    </div>
  );
}
