/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Expense, Bucket } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  X, 
  AlertCircle, 
  FolderMinus, 
  FileImage,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseListProps {
  expenses: Expense[];
  buckets: Bucket[];
  currency: string;
  onDeleteExpense: (id: string) => void;
  onClearAll: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function ExpenseList({ 
  expenses, 
  buckets, 
  currency, 
  onDeleteExpense, 
  onClearAll, 
  addToast 
}: ExpenseListProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, month, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Dialog state for clear all confirmation
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  
  // Lightbox for receipt screenshot
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);

  // Filter Expenses
  const filteredExpenses = expenses.filter((exp) => {
    // 1. Search Query
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Bucket filter
    const matchesBucket = selectedBucket === 'all' || exp.bucketId === selectedBucket;
    
    // 3. Date filter
    const expDate = new Date(exp.date);
    const now = new Date();
    
    let matchesDate = true;
    if (dateFilter === 'this-month') {
      matchesDate = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'last-month') {
      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);
      matchesDate = expDate.getMonth() === lastMonth.getMonth() && expDate.getFullYear() === lastMonth.getFullYear();
    } else if (dateFilter === 'this-year') {
      matchesDate = expDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'custom') {
      const expTime = expDate.setHours(0, 0, 0, 0);
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      matchesDate = expTime >= start && expTime <= end;
    }

    return matchesSearch && matchesBucket && matchesDate;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleClearConfirm = () => {
    onClearAll();
    setShowConfirmClear(false);
    addToast('All expenses cleared. Balances restored!', 'success');
  };

  return (
    <div id="expense-list-container" className="space-y-4">
      
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="expense-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by description..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Bucket Filter */}
          <div className="relative w-full sm:w-48">
            <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              id="expense-bucket-filter"
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
            >
              <option value="all">All Buckets</option>
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-zinc-900">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5" /> Date Range:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'this-month', label: 'This Month' },
                { id: 'last-month', label: 'Last Month' },
                { id: 'this-year', label: 'This Year' },
                { id: 'custom', label: 'Custom' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  id={`date-filter-${d.id}`}
                  onClick={() => setDateFilter(d.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex-shrink-0 ${
                    dateFilter === d.id
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {expenses.length > 0 && (
            <button
              id="clear-all-expenses-button"
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="text-[11px] font-extrabold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0 self-end sm:self-auto"
            >
              Clear All Expenses
            </button>
          )}
        </div>

        {/* Custom Dates Inputs */}
        {dateFilter === 'custom' && (
          <div id="custom-date-inputs" className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50/50 dark:bg-zinc-900/50 rounded-xl border border-gray-150 dark:border-zinc-900">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-250 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 cursor-pointer dark:[color-scheme:dark] scheme-light dark:scheme-dark focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-0.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-250 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 cursor-pointer dark:[color-scheme:dark] scheme-light dark:scheme-dark focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Expense list status indicator */}
      {filteredExpenses.length > 0 && (
        <div className="flex justify-between items-center text-xs text-gray-400 px-1">
          <span>Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            Total Logged: <strong className="font-black">{formatCurrency(totalFilteredAmount, currency)}</strong>
          </span>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-2">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-2">
            <FolderMinus className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700 stroke-[1.5]" />
            <h4 className="font-bold text-gray-700 dark:text-zinc-300 text-sm">No expenses logged yet</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Any business expenses you deduct will be visible here with filtering and deletion capabilities.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredExpenses.map((exp) => (
              <motion.div
                key={exp.id}
                id={`expense-row-${exp.id}`}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-between gap-4 group hover:shadow-xs transition-all relative"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Receipt thumbnail */}
                  {exp.receiptImage ? (
                    <button
                      id={`view-receipt-btn-${exp.id}`}
                      onClick={() => setActiveReceiptUrl(exp.receiptImage || null)}
                  className="w-10 h-10 rounded-lg overflow-hidden border border-gray-250 hover:border-emerald-400 dark:border-zinc-800 flex-shrink-0 relative group/thumb cursor-pointer"
                      title="View receipt"
                    >
                      <img referrerPolicy="no-referrer" src={exp.receiptImage} alt="Receipt Thumbnail" className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <FileImage className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 flex items-center justify-center flex-shrink-0 text-gray-400">
                      <FolderMinus className="w-4 h-4 opacity-40" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 truncate">
                      {exp.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded text-[10px]">
                        {exp.bucketName}
                      </span>
                      <span>•</span>
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    -{formatCurrency(exp.amount, currency)}
                  </span>
                  
                  <button
                    id={`delete-expense-${exp.id}`}
                    onClick={() => onDeleteExpense(exp.id)}
                    className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Confirmation Dialog for Clear All */}
      {showConfirmClear && (
        <div id="clear-expenses-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-250 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-zinc-50">Clear all expenses?</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                  This action is irreversible. All logged expenses will be deleted, and their original amounts will be <strong>fully restored</strong> to their respective bucket balances.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                id="cancel-clear-expenses"
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-700 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
              >
                No, Keep Them
              </button>
              <button
                id="confirm-clear-expenses"
                type="button"
                onClick={handleClearConfirm}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Yes, Restore Balances
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Receipts */}
      {activeReceiptUrl && (
        <div id="receipt-lightbox-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center">
            <button
              id="close-lightbox"
              onClick={() => setActiveReceiptUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer flex items-center gap-1 text-xs"
            >
              <X className="w-4 h-4" /> Close
            </button>
            <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 p-2">
              <img referrerPolicy="no-referrer" src={activeReceiptUrl} alt="Full Receipt" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
            <div className="mt-4 text-xs text-white/60 text-center flex items-center gap-1">
              <Info className="w-4 h-4" />
              Receipt screenshot loaded securely from BeforeSpend vault.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
