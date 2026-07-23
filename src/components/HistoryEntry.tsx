/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PaymentEntry } from '../types';
import { formatCurrency } from '../lib/utils';
import { CustomSelect } from './CustomSelect';
import { 
  Trash2, 
  Search, 
  Calendar, 
  X, 
  AlertCircle, 
  History, 
  FileImage,
  DollarSign,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryEntryListProps {
  history: PaymentEntry[];
  currency: string;
  onDeleteHistory: (id: string) => void;
  onClearAll: (revertBalances?: boolean) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function HistoryEntryList({ 
  history, 
  currency, 
  onDeleteHistory, 
  onClearAll, 
  addToast 
}: HistoryEntryListProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, this-month, this-year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialog State
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  
  // Lightbox for receipt screenshot
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);

  // Filter history
  const filteredHistory = history.filter((entry) => {
    // 1. Search Query
    const matchesSearch = entry.note 
      ? entry.note.toLowerCase().includes(searchQuery.toLowerCase()) 
      : true; // if no search, all match
    
    // 2. Currency Filter
    const matchesCurrency = currencyFilter === 'all' || entry.currency === currencyFilter;

    // 3. Date Filters
    const expDate = new Date(entry.date);
    const now = new Date();
    
    let matchesDate = true;
    if (dateFilter === 'this-month') {
      matchesDate = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'this-year') {
      matchesDate = expDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'custom') {
      const expTime = expDate.setHours(0, 0, 0, 0);
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      matchesDate = expTime >= start && expTime <= end;
    }

    return matchesSearch && matchesCurrency && matchesDate;
  });

  const totalFilteredSplits = filteredHistory.reduce((sum, entry) => sum + entry.convertedAmount, 0);

  const handleClearConfirm = () => {
    onClearAll();
    setShowConfirmClear(false);
    addToast('All payment history cleared. Balances reversed!', 'success');
  };

  const getThemeColorClass = (colorName: string) => {
    switch (colorName) {
      case 'emerald': return 'bg-emerald-500';
      case 'blue': return 'bg-blue-500';
      case 'amber': return 'bg-amber-500';
      case 'red': return 'bg-rose-500';
      case 'purple': return 'bg-purple-500';
      case 'teal': return 'bg-teal-500';
      case 'indigo': return 'bg-indigo-500';
      case 'pink': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div id="history-section-container" className="space-y-4">
      
      {/* Search & Filters */}
      <div className="p-4 rounded-xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search by note */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history note..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Currency Filter with CustomSelect */}
          <div className="w-full sm:w-56">
            <CustomSelect
              id="history-currency-filter"
              value={currencyFilter}
              onChange={setCurrencyFilter}
              placeholder="All Currencies"
              options={[
                { value: 'all', label: 'All Currencies' },
                { value: 'NGN', label: 'NGN (₦)', sublabel: 'Nigerian Naira' },
                { value: 'USD', label: 'USD ($)', sublabel: 'US Dollar' },
                { value: 'GBP', label: 'GBP (£)', sublabel: 'British Pound' },
                { value: 'EUR', label: 'EUR (€)', sublabel: 'Euro' },
                { value: 'CAD', label: 'CAD (C$)', sublabel: 'Canadian Dollar' },
              ]}
            />
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
                { id: 'this-year', label: 'This Year' },
                { id: 'custom', label: 'Custom' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  id={`history-date-filter-${d.id}`}
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

          {history.length > 0 && (
            <button
              id="clear-all-history-button"
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="text-[11px] font-extrabold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0 self-end sm:self-auto"
            >
              Clear All Splits History
            </button>
          )}
        </div>

        {/* Custom Dates Inputs */}
        {dateFilter === 'custom' && (
          <div id="history-custom-date-inputs" className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50/50 dark:bg-zinc-900/50 rounded-xl border border-gray-150 dark:border-zinc-900">
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

      {/* History item status */}
      {filteredHistory.length > 0 && (
        <div className="flex justify-between items-center text-xs text-gray-400 px-1">
          <span>Showing {filteredHistory.length} saved transaction{filteredHistory.length !== 1 ? 's' : ''}</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            Total Equivalent Splits: <strong className="font-black">{formatCurrency(totalFilteredSplits, currency)}</strong>
          </span>
        </div>
      )}

      {/* Payment Entry Items */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-2">
            <History className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700 stroke-[1.5]" />
            <h4 className="font-bold text-gray-700 dark:text-zinc-300 text-sm">No payment history found</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Once you enter payments in the Home Tab and save them, they will appear here with fully automated reverse capabilities.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredHistory.map((entry) => (
              <motion.div
                key={entry.id}
                id={`history-row-${entry.id}`}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 flex flex-col gap-3 group hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Optional receipt thumbnail */}
                    {entry.receiptImage ? (
                      <button
                        id={`view-history-receipt-${entry.id}`}
                        onClick={() => setActiveReceiptUrl(entry.receiptImage || null)}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-gray-250 hover:border-[#00A896] dark:border-zinc-800 flex-shrink-0 relative group/thumb cursor-pointer"
                        title="View receipt"
                      >
                        <img referrerPolicy="no-referrer" src={entry.receiptImage} alt="Receipt Thumbnail" className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <FileImage className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 flex items-center justify-center flex-shrink-0 text-[#00A896]">
                        <History className="w-4 h-4 opacity-45" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-zinc-50 flex items-center gap-1.5">
                        {formatCurrency(entry.amount, entry.currency)}
                        {entry.currency !== currency && (
                          <span className="text-xs font-semibold text-gray-400">
                            ({formatCurrency(entry.convertedAmount, currency)})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                        Saved on {new Date(entry.date).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    id={`delete-history-${entry.id}`}
                    onClick={() => onDeleteHistory(entry.id)}
                    className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    title="Delete split history item (reverse balances)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Tags for splits snapshot */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {entry.splits.map((split) => (
                    <span
                      key={split.bucketId}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-150 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800/60 flex items-center gap-1.5"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${getThemeColorClass(split.color)}`} />
                      {split.bucketName}: <strong className="font-extrabold text-gray-800 dark:text-zinc-300">{formatCurrency(split.amount, currency)}</strong>
                    </span>
                  ))}
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Clear History Modal */}
      {showConfirmClear && (
        <div id="clear-history-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-250 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/30 dark:text-amber-400 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-zinc-50">Clear Splits History</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Choose how you want to clear your split history log:
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                id="confirm-clear-history-log-only"
                type="button"
                onClick={() => {
                  onClearAll(false);
                  setShowConfirmClear(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-100/60 dark:hover:bg-teal-950/40 transition-all cursor-pointer group"
              >
                <div className="font-bold text-xs text-[#00A896] dark:text-teal-300">
                  Clear Log Only (Recommended)
                </div>
                <div className="text-[11px] text-[#00A896]/80 dark:text-teal-400/80">
                  Wipes historical split records without changing your current bucket balances.
                </div>
              </button>

              <button
                id="confirm-clear-history-revert-balances"
                type="button"
                onClick={() => {
                  onClearAll(true);
                  setShowConfirmClear(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition-all cursor-pointer group"
              >
                <div className="font-bold text-xs text-rose-800 dark:text-rose-300">
                  Clear Log & Subtract Bucket Balances
                </div>
                <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                  Wipes history AND deducts previously split amounts from your bucket balances.
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="cancel-clear-history"
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-700 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Receipts */}
      {activeReceiptUrl && (
        <div id="history-receipt-lightbox-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
