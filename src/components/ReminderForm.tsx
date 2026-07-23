/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { generateId } from '../lib/utils';
import { CustomSelect } from './CustomSelect';
import { Bell, RefreshCw, Sparkles, Plus } from 'lucide-react';

interface ReminderFormProps {
  currency: string;
  onAdd: (reminder: {
    id: string;
    text: string;
    dueDate: string;
    done: boolean;
    type: 'manual' | 'auto';
    period?: 'monthly' | 'yearly';
    note?: string;
    cost?: number;
  }) => void;
}

export function ReminderForm({ currency, onAdd }: ReminderFormProps) {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [cost, setCost] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Quick template generator
  const handleQuickTemplate = (name: string, defaultCost: number, notes: string) => {
    setText(name);
    setCost(defaultCost.toString());
    setIsRecurring(true);
    setPeriod('monthly');
    setNote(notes);
    
    // Set due date to same day next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setDueDate(nextMonth.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Please enter what you want to remember.');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    const costNum = parseFloat(cost);
    if (isRecurring && cost && (isNaN(costNum) || costNum < 0)) {
      setError('Please enter a valid subscription cost.');
      return;
    }

    onAdd({
      id: generateId(),
      text: text.trim(),
      dueDate,
      done: false,
      type: isRecurring ? 'auto' : 'manual',
      period: isRecurring ? period : undefined,
      note: note.trim() || undefined,
      cost: isRecurring && cost ? costNum : undefined,
    });

    // Reset Form
    setText('');
    setDueDate('');
    setIsRecurring(false);
    setCost('');
    setPeriod('monthly');
    setNote('');
  };

  return (
    <form
      id="reminder-creation-form"
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#00A896]" />
          <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
            Set Reminder / Subscription
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {/* Type selector tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
          <button
            id="reminder-type-oneoff"
            type="button"
            onClick={() => setIsRecurring(false)}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isRecurring
                ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-850 dark:text-zinc-50'
                : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            One-off Reminder
          </button>
          <button
            id="reminder-type-recurring"
            type="button"
            onClick={() => setIsRecurring(true)}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isRecurring
                ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-850 dark:text-zinc-50'
                : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            Active Subscription
          </button>
        </div>

        {/* Quick templates for subscriptions */}
        {isRecurring && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Quick Templates
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                id="template-google-drive"
                onClick={() => handleQuickTemplate('Google Drive Storage', 1500, 'Basic 100GB plan')}
                className="text-[11px] font-medium px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 cursor-pointer"
              >
                Google Drive
              </button>
              <button
                type="button"
                id="template-adobe-creative"
                onClick={() => handleQuickTemplate('Adobe Creative Cloud', 48000, 'Designer Suite subscription')}
                className="text-[11px] font-medium px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 cursor-pointer"
              >
                Adobe Suite
              </button>
              <button
                type="button"
                id="template-figma-professional"
                onClick={() => handleQuickTemplate('Figma Professional', 24000, 'UI design core team seat')}
                className="text-[11px] font-medium px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 cursor-pointer"
              >
                Figma Pro
              </button>
              <button
                type="button"
                id="template-netflix"
                onClick={() => handleQuickTemplate('Netflix Standard', 5500, 'Streaming entertainment')}
                className="text-[11px] font-medium px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 cursor-pointer"
              >
                Netflix
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
            {isRecurring ? 'Subscription Name' : 'What to remember'}
          </label>
          <input
            id="reminder-text-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecurring ? 'e.g. Adobe Creative Cloud, Google One' : 'e.g. Pay Internet Bill, Renew Domain'}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Due Date / Next Renewal Date
            </label>
            <input
              id="reminder-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:[color-scheme:dark] scheme-light dark:scheme-dark focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all cursor-pointer"
            />
          </div>

          {isRecurring && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                Cost ({currency === 'NGN' ? '₦' : currency})
              </label>
              <input
                id="reminder-cost-input"
                type="number"
                min="0"
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
              />
            </div>
          )}
        </div>

        {isRecurring && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CustomSelect
                id="reminder-period-select"
                label="Billing Cycle"
                value={period}
                onChange={(val) => setPeriod(val as 'monthly' | 'yearly')}
                options={[
                  { value: 'monthly', label: 'Monthly', sublabel: 'Recurs every month' },
                  { value: 'yearly', label: 'Yearly', sublabel: 'Recurs every year' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                Cancel Instructions / Trial Alerts
              </label>
              <input
                id="reminder-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Cancel before 24th, shared with team"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
              />
            </div>
          </div>
        )}

        {!isRecurring && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Add Notes
            </label>
            <input
              id="reminder-note-input-manual"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional notes or details..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
            />
          </div>
        )}

        {error && (
          <p id="reminder-form-error" className="text-xs font-medium text-rose-500">
            {error}
          </p>
        )}

        <button
          id="submit-reminder-button"
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white text-sm font-semibold shadow-sm transition-all hover:shadow-[#00A896]/10 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Reminder
        </button>
      </div>
    </form>
  );
}
