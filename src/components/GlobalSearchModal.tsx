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
  Sparkles,
  Compass
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
  onNavigate: (tabId: string, searchVal?: string) => void;
}

interface NavPage {
  id: string;
  name: string;
  desc: string;
  keywords: string[];
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  transactions = [],
  history = [],
  buckets = [],
  expenses = [],
  milestones = [],
  reminders = [],
  currency = 'NGN',
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
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Pages Navigation search database
  const ALL_PAGES: NavPage[] = [
    { id: 'buckets', name: 'Dashboard & Buckets', desc: 'Allocation cards, balances, and direct funding options', keywords: ['dashboard', 'buckets', 'overview', 'home', 'main'] },
    { id: 'split', name: 'Income Splitter', desc: 'Process and split incoming bank payments into category folders', keywords: ['split', 'splitter', 'income', 'deposit', 'allocation'] },
    { id: 'expenses', name: 'Expense Tracker', desc: 'Track itemized expenses and snap receipt invoices', keywords: ['expenses', 'tracker', 'spend', 'receipt', 'log'] },
    { id: 'ledger', name: 'Transactions & Statements', desc: 'Ledger log audit history and bank statement CSV parsing', keywords: ['ledger', 'transactions', 'statements', 'bank', 'csv', 'audit'] },
    { id: 'history', name: 'Payment History', desc: 'Inflow allocation splits and historical transaction reports', keywords: ['history', 'payments', 'allocations', 'records'] },
    { id: 'milestones', name: 'Savings Goals & Runway', desc: 'Set fund milestones and auto-allocate savings reserves', keywords: ['savings', 'goals', 'milestones', 'target', 'funds'] },
    { id: 'reminders', name: 'Bills & Subscriptions', desc: 'Schedule recurring calendar notifications for upcoming dues', keywords: ['bills', 'reminders', 'subscriptions', 'netflix', 'utilities'] },
    { id: 'analytics', name: 'Spending Insights & Analytics', desc: 'Data visualization, categories, and relative distributions', keywords: ['insights', 'analytics', 'charts', 'distribution', 'graphs'] },
    { id: 'settings', name: 'Account Settings', desc: 'Configure default currencies, user profile, and custom rates', keywords: ['settings', 'config', 'currency', 'rates', 'profile'] },
    { id: 'calculators', name: 'Money Calculators', desc: 'Amortization estimates and compound interest calculations', keywords: ['calculators', 'interest', 'compound', 'loan', 'estimation'] },
    { id: 'admin', name: 'Database Snapshot & Backups', desc: 'System backups, local schema configurations, and center logs', keywords: ['database', 'backups', 'snapshots', 'admin', 'import', 'export'] },
  ];

  // 1. Filtered Pages
  const matchingPages = cleanQuery ? ALL_PAGES.filter((p) => 
    p.name.toLowerCase().includes(cleanQuery) || 
    p.desc.toLowerCase().includes(cleanQuery) ||
    p.keywords.some(k => k.toLowerCase().includes(cleanQuery))
  ).slice(0, 3) : [];

  // 2. Filtered Transactions
  const matchingTransactions = cleanQuery ? transactions.filter((t) => 
    (t.description || '').toLowerCase().includes(cleanQuery) ||
    (t.bucketName || '').toLowerCase().includes(cleanQuery) ||
    (t.amount || '').toString().includes(cleanQuery) ||
    ((t.deduplicationHash || '').toLowerCase().includes(cleanQuery))
  ).slice(0, 5) : [];

  // 3. Filtered Payment History
  const matchingPayments = cleanQuery ? history.filter((p) =>
    ((p.note || '').toLowerCase().includes(cleanQuery)) ||
    (p.amount || '').toString().includes(cleanQuery) ||
    (p.currency || '').toLowerCase().includes(cleanQuery)
  ).slice(0, 5) : [];

  // 4. Filtered Buckets
  const matchingBuckets = cleanQuery ? buckets.filter((b) =>
    (b.name || '').toLowerCase().includes(cleanQuery) ||
    (b.destinationAccount || '').toLowerCase().includes(cleanQuery) ||
    ((b.note || '').toLowerCase().includes(cleanQuery))
  ).slice(0, 5) : [];

  // 5. Filtered Expenses
  const matchingExpenses = cleanQuery ? expenses.filter((e) =>
    (e.category || '').toLowerCase().includes(cleanQuery) ||
    ((e.note || '').toLowerCase().includes(cleanQuery)) ||
    (e.amount || '').toString().includes(cleanQuery)
  ).slice(0, 5) : [];

  // 6. Filtered Milestones
  const matchingMilestones = cleanQuery ? milestones.filter((m) =>
    (m.name || '').toLowerCase().includes(cleanQuery) ||
    (m.targetAmount || '').toString().includes(cleanQuery)
  ).slice(0, 5) : [];

  // 7. Filtered Reminders
  const matchingReminders = cleanQuery ? reminders.filter((r) =>
    (r.text || '').toLowerCase().includes(cleanQuery) ||
    ((r.note || '').toLowerCase().includes(cleanQuery))
  ).slice(0, 5) : [];

  const totalResults = matchingPages.length + matchingTransactions.length + matchingPayments.length + matchingBuckets.length + matchingExpenses.length + matchingMilestones.length + matchingReminders.length;

  const handleSelectResult = (tabId: string, searchVal?: string) => {
    onNavigate(tabId, searchVal);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[999999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-left cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar (No divider line, soft padding) */}
        <div className="p-5 flex items-center gap-3.5 bg-gray-50/20 dark:bg-zinc-900/10">
          <Search className="w-5.5 h-5.5 text-[#00A896] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Deep Search transactions, payments, buckets, expenses, bills, pages..."
            className="w-full text-sm font-semibold bg-transparent border-none text-gray-900 dark:text-zinc-50 placeholder-gray-400 focus:outline-none"
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
              title="Clear text"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Search"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-gray-400 bg-gray-200/60 dark:bg-zinc-800 rounded border border-gray-300/60 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-5 pt-2 space-y-5 flex-1 scrollbar-thin">
          {!cleanQuery ? (
            <div className="py-16 text-center space-y-4 text-gray-400 dark:text-zinc-500">
              <Sparkles className="w-9 h-9 mx-auto text-[#00A896] opacity-80" />
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-zinc-300">BeforeSpend Workspace Deep Search</p>
                <p className="text-[11px] text-gray-400 mt-1">Navigate pages, find transaction ledgers, or locate savings goals instantly.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] pt-2">
                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200/50 dark:border-zinc-800/50 text-gray-600 dark:text-zinc-400">💡 Try "Ledger"</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200/50 dark:border-zinc-800/50 text-gray-600 dark:text-zinc-400">💡 Try "Salary"</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200/50 dark:border-zinc-800/50 text-gray-600 dark:text-zinc-400">💡 Try "Fidelity"</span>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-16 text-center space-y-2 text-gray-400 dark:text-zinc-500">
              <Search className="w-8 h-8 mx-auto stroke-[1.5]" />
              <p className="text-xs font-bold">No results found matching "{query}"</p>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Navigation Pages Section */}
              {matchingPages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#00A896]" /> Navigation Pages ({matchingPages.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingPages.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => handleSelectResult(page.id)}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-900/20 border border-gray-200/80 dark:border-zinc-800/80 hover:border-[#00A896]/40 dark:hover:border-[#00A896]/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {page.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {page.desc}
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
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00A896]" /> Budget Buckets ({matchingBuckets.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingBuckets.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleSelectResult('buckets', b.id)}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-900/20 border border-gray-200/80 dark:border-zinc-800/80 hover:border-[#00A896]/40 dark:hover:border-[#00A896]/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {b.name} ({b.percentage}%)
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            Destination Account: {b.destinationAccount}
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
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#00A896]" /> Ledger Transactions ({matchingTransactions.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingTransactions.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectResult('ledger', t.description)}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-900/20 border border-gray-200/80 dark:border-zinc-800/80 hover:border-[#00A896]/40 dark:hover:border-[#00A896]/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {t.description}
                          </p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-2">
                            <span>Bucket: {t.bucketName}</span>
                            <span className={t.direction === 'CREDIT' ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
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

              {/* Payment History Results */}
              {matchingPayments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#00A896]" /> Payment History Splits ({matchingPayments.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingPayments.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectResult('history', p.note)}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-900/20 border border-gray-200/80 dark:border-zinc-800/80 hover:border-[#00A896]/40 dark:hover:border-[#00A896]/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all cursor-pointer flex items-center justify-between group"
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

              {/* Expense Tracker Results */}
              {matchingExpenses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-[#00A896]" /> Expenses ({matchingExpenses.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingExpenses.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => handleSelectResult('expenses', e.description || e.category)}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-900/20 border border-gray-200/80 dark:border-zinc-800/80 hover:border-[#00A896]/40 dark:hover:border-[#00A896]/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-zinc-100">
                            {e.category} — {formatCurrency(e.amount, currency)}
                          </p>
                          {(e.description || e.note) && <p className="text-[10px] text-gray-400">{e.description || e.note}</p>}
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#00A896] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones Results */}
              {matchingMilestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#00A896]" /> Savings Milestones ({matchingMilestones.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingMilestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectResult('milestones')}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-900/20 border border-gray-200/80 dark:border-zinc-800/80 hover:border-[#00A896]/40 dark:hover:border-[#00A896]/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all cursor-pointer flex items-center justify-between group"
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
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00A896]" /> Bills & Subscriptions ({matchingReminders.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingReminders.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleSelectResult('reminders')}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-900/20 border border-gray-200/80 dark:border-zinc-800/80 hover:border-[#00A896]/40 dark:hover:border-[#00A896]/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all cursor-pointer flex items-center justify-between group"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
