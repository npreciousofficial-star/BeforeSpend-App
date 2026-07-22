/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Reminder } from '../types';
import { Calendar, Trash2, ShieldAlert, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface ReminderItemProps {
  key?: string;
  reminder: Reminder;
  currency: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReminderItem({ reminder, currency, onToggle, onDelete }: ReminderItemProps) {
  // Check if overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(reminder.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const isOverdue = dueDate < today && !reminder.done;
  const isDueToday = dueDate.getTime() === today.getTime() && !reminder.done;

  const formattedDueDate = new Date(reminder.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      id={`reminder-item-${reminder.id}`}
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={`p-4 rounded-xl border flex items-start gap-3.5 group bg-white dark:bg-zinc-950 dark:border-zinc-800 transition-all ${
        reminder.done 
          ? 'bg-gray-50/50 dark:bg-zinc-900/10 border-gray-100 dark:border-zinc-900/60' 
          : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-center h-5 mt-0.5">
        <input
          id={`reminder-checkbox-${reminder.id}`}
          type="checkbox"
          checked={reminder.done}
          onChange={() => onToggle(reminder.id)}
          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <p
            id={`reminder-text-${reminder.id}`}
            className={`text-sm font-semibold break-words ${
              reminder.done 
                ? 'line-through text-gray-400 dark:text-zinc-500' 
                : 'text-gray-800 dark:text-zinc-200'
            }`}
          >
            {reminder.text}
          </p>

          {/* Type tag */}
          {reminder.type === 'auto' && (
            <span 
              id={`reminder-auto-tag-${reminder.id}`}
              className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
              Sub
            </span>
          )}

          {/* Overdue Badge */}
          {isOverdue && (
            <span
              id={`reminder-overdue-tag-${reminder.id}`}
              className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-0.5"
            >
              <ShieldAlert className="w-2.5 h-2.5" />
              Overdue
            </span>
          )}

          {/* Due Today Badge */}
          {isDueToday && (
            <span
              id={`reminder-today-tag-${reminder.id}`}
              className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center gap-0.5"
            >
              <AlertCircle className="w-2.5 h-2.5" />
              Due Today
            </span>
          )}
        </div>

        {/* Note if available */}
        {reminder.note && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-2 truncate max-w-full">
            {reminder.note}
          </p>
        )}

        {/* Cost & Period Details for automated reminders */}
        {reminder.type === 'auto' && reminder.cost !== undefined && reminder.cost > 0 && (
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">
            Cost: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(reminder.cost, currency)}</span> / {reminder.period || 'monthly'}
          </p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{reminder.type === 'auto' ? 'Next Due' : 'Due'}: {formattedDueDate}</span>
        </div>
      </div>

      <button
        id={`delete-reminder-${reminder.id}`}
        onClick={() => onDelete(reminder.id)}
        className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
        title="Delete reminder"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
