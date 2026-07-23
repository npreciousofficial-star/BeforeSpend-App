/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Wallet, 
  TrendingDown, 
  Layers, 
  History, 
  Target, 
  Clock, 
  ArrowUpRight, 
  Hash,
  Sparkles
} from 'lucide-react';
import { Transaction, PaymentEntry, Bucket, Expense, Milestone, Reminder } from '../types';
import { formatCurrency } from '../lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  history: PaymentEntry[];
  buckets: Bucket[];
  expenses: Expense[];
  milestones: Milestone[];
  reminders: Reminder[];
  currency: string;
  onNavigate: (tabId: string) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  transactions,
  history,
  buckets,
  expenses,
  milestones,
  reminders,
  currency,
  onNavigate,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // 1. Filtered Transactions
  const matchingTransactions = cleanQuery ? transactions.filter((t) => 
    t.description.toLowerCase().includes(cleanQuery) ||
    t.bucketName.toLowerCase().includes(cleanQuery) ||
    t.amount.toString().includes(cleanQuery) ||
    (t.deduplicationHash && t.deduplicationHash.toLowerCase().includes(cleanQuery))
  ).slice(0, 5) : [];

  // 2. Filtered Payment History
  const matchingPayments = cleanQuery ? history.filter((p) =>
    (p.note && p.note.toLowerCase().includes(cleanQuery)) ||
    p.amount.toString().includes(cleanQuery) ||
    p.currency.toLowerCase().includes(cleanQuery)
  ).slice(0, 5) : [];

  // 3. Filtered Buckets
  const matchingBuckets = cleanQuery ? buckets.filter((b) =>
    b.name.toLowerCase().includes(cleanQuery) ||
    b.destinationAccount.toLowerCase().includes(cleanQuery) ||
    (b.note && b.note.toLowerCase().includes(cleanQuery))
  ).slice(0, 5) : [];

  // 4. Filtered Expenses
  const matchingExpenses = cleanQuery ? expenses.filter((e) =>
    e.category.toLowerCase().includes(cleanQuery) ||
    (e.note && e.note.toLowerCase().includes(cleanQuery)) ||
    e.amount.toString().includes(cleanQuery)
  ).slice(0, 5) : [];

  // 5. Filtered Milestones
  const matchingMilestones = cleanQuery ? milestones.filter((m) =>
    m.name.toLowerCase().includes(cleanQuery) ||
    m.targetAmount.toString().includes(cleanQuery)
  ).slice(0, 5) : [];

  // 6. Filtered Reminders
  const matchingReminders = cleanQuery ? reminders.filter((r) =>
    r.text.toLowerCase().includes(cleanQuery) ||
    (r.note && r.note.toLowerCase().includes(cleanQuery))
  ).slice(0, 5) : [];

  const totalResults = matchingTransactions.length + matchingPayments.length + matchingBuckets.length + matchingExpenses.length + matchingMilestones.length + matchingReminders.length;

  const handleSelectResult = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-150 dark:border-zinc-850 flex items-center gap-3 bg-gray-50/50 dark:bg-zinc-900/50">
          <Search className="w-5 h-5 text-[#00A896] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Deep Search transactions, payments, buckets, expenses, bills..."
            className="w-full text-sm font-semibold bg-transparent border-none text-gray-900 dark:text-zinc-50 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-gray-400 bg-gray-200/60 dark:bg-zinc-800 rounded border border-gray-300/60 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-5 flex-1 divide-y divide-gray-100 dark:divide-zinc-900">
          {!cleanQuery ? (
            <div className="py-12 text-center space-y-3 text-gray-400 dark:text-zinc-500">
              <Sparkles className="w-8 h-8 mx-auto text-[#00A896] opacity-60" />
              <p className="text-xs font-bold">Type anything to search across your entire workspace</p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] pt-1">
                <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400">💡 Try "Salary"</span>
                <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400">💡 Try "Website design"</span>
                <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400">💡 Try "Kuda"</span>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center space-y-2 text-gray-400 dark:text-zinc-500">
              <Search className="w-8 h-8 mx-auto stroke-[1.5]" />
              <p className="text-xs font-bold">No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* Payment History Results */}
              {matchingPayments.length > 0 && (
                <div className="pt-2 first:pt-0 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#00A896]" /> Payment History Splits ({matchingPayments.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingPayments.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectResult('history')}
                        className="p-3 rounded-xl bg-gray-50/70 hover:bg-teal-50/50 dark:bg-zinc-900/60 dark:hover:bg-teal-950/20 border border-gray-150 dark:border-zinc-850 hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>{p.note || 'Income Split'}</span>
                            <span className="text-[10px] font-mono text-[#00A896] bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                              {formatCurrency(p.amount, p.currency)}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(p.date).toLocaleDateString()} • {p.splits.length} allocation target{p.splits.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#00A896] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions Ledger Results */}
              {matchingTransactions.length > 0 && (
                <div className="pt-3 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#00A896]" /> Ledger Transactions ({matchingTransactions.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingTransactions.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectResult('buckets')}
                        className="p-3 rounded-xl bg-gray-50/70 hover:bg-teal-50/50 dark:bg-zinc-900/60 dark:hover:bg-teal-950/20 border border-gray-150 dark:border-zinc-850 hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {t.description}
                          </p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-2">
                            <span>Bucket: {t.bucketName}</span>
                            <span className={t.direction === 'CREDIT' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                              {t.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                            </span>
                          </p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#00A896] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Buckets Results */}
              {matchingBuckets.length > 0 && (
                <div className="pt-3 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00A896]" /> Budget Buckets ({matchingBuckets.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingBuckets.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleSelectResult('buckets')}
                        className="p-3 rounded-xl bg-gray-50/70 hover:bg-teal-50/50 dark:bg-zinc-900/60 dark:hover:bg-teal-950/20 border border-gray-150 dark:border-zinc-850 hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {b.name} ({b.percentage}%)
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Destination Account: {b.destinationAccount}
                          </p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#00A896] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Tracker Results */}
              {matchingExpenses.length > 0 && (
                <div className="pt-3 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-[#00A896]" /> Expenses ({matchingExpenses.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingExpenses.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => handleSelectResult('expenses')}
                        className="p-3 rounded-xl bg-gray-50/70 hover:bg-teal-50/50 dark:bg-zinc-900/60 dark:hover:bg-teal-950/20 border border-gray-150 dark:border-zinc-850 hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {e.category} — {formatCurrency(e.amount, currency)}
                          </p>
                          {e.note && <p className="text-[10px] text-gray-400">{e.note}</p>}
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#00A896] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones Results */}
              {matchingMilestones.length > 0 && (
                <div className="pt-3 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#00A896]" /> Savings Milestones ({matchingMilestones.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingMilestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectResult('milestones')}
                        className="p-3 rounded-xl bg-gray-50/70 hover:bg-teal-50/50 dark:bg-zinc-900/60 dark:hover:bg-teal-950/20 border border-gray-150 dark:border-zinc-850 hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {m.name} — Target: {formatCurrency(m.targetAmount, currency)}
                          </p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#00A896] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminders Results */}
              {matchingReminders.length > 0 && (
                <div className="pt-3 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00A896]" /> Bills & Subscriptions ({matchingReminders.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingReminders.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleSelectResult('reminders')}
                        className="p-3 rounded-xl bg-gray-50/70 hover:bg-teal-50/50 dark:bg-zinc-900/60 dark:hover:bg-teal-950/20 border border-gray-150 dark:border-zinc-850 hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {r.text} {r.cost ? `(${formatCurrency(r.cost, currency)})` : ''}
                          </p>
                          <p className="text-[10px] text-gray-400">Due: {r.dueDate}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#00A896] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
