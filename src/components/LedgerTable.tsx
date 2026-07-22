import React, { useState } from 'react';
import { Transaction, Bucket } from '../types';
import { formatCurrency } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, Scale, FileText, Search, ShieldCheck, Receipt } from 'lucide-react';

interface LedgerTableProps {
  transactions: Transaction[];
  buckets: Bucket[];
  currency: string;
  onOpenReconciliation: (bucketId?: string) => void;
  onOpenStatementParser: () => void;
}

export function LedgerTable({
  transactions,
  buckets,
  currency,
  onOpenReconciliation,
  onOpenStatementParser,
}: LedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'MANUAL_ADJUSTMENT' | 'CSV_IMPORT'>('ALL');
  const [selectedBucketFilter, setSelectedBucketFilter] = useState<string>('ALL');

  const filteredTransactions = transactions.filter(txn => {
    // Search
    const matchesSearch =
      txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.bucketName && txn.bucketName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (txn.deduplicationHash && txn.deduplicationHash.toLowerCase().includes(searchTerm.toLowerCase()));

    // Type filter
    let matchesType = true;
    if (typeFilter === 'CREDIT') matchesType = txn.direction === 'CREDIT';
    if (typeFilter === 'DEBIT') matchesType = txn.direction === 'DEBIT';
    if (typeFilter === 'MANUAL_ADJUSTMENT') matchesType = txn.type === 'MANUAL_ADJUSTMENT';
    if (typeFilter === 'CSV_IMPORT') matchesType = txn.sourceType === 'CSV_IMPORT';

    // Bucket filter
    let matchesBucket = true;
    if (selectedBucketFilter !== 'ALL') {
      matchesBucket = txn.bucketId === selectedBucketFilter;
    }

    return matchesSearch && matchesType && matchesBucket;
  });

  const totalCredits = transactions
    .filter(t => t.direction === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter(t => t.direction === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const netLedgerBalance = totalCredits - totalDebits;

  return (
    <div className="space-y-5">
      {/* Top Banner: Income & Expenses Overview */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-blue-900/10 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-blue-950/30 border border-emerald-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
              Transaction Records Active
            </span>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono">
              Total Inflows - Total Outflows
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
            Net Account Balance: <span className={netLedgerBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{formatCurrency(netLedgerBalance, currency)}</span>
          </h2>
          <p className="text-xs text-gray-600 dark:text-zinc-400 pt-0.5">
            Total Inflows: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCredits, currency)}</span> • Total Outflows: <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalDebits, currency)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => onOpenReconciliation()}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap min-h-[42px]"
          >
            <Scale className="w-4 h-4" /> Match Bank Balance
          </button>
          <button
            onClick={onOpenStatementParser}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap min-h-[42px]"
          >
            <FileText className="w-4 h-4" /> Import Bank Statement
          </button>
        </div>
      </div>

      {/* Control Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-950 p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions, categories, or keywords..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
          <select
            value={selectedBucketFilter}
            onChange={(e) => setSelectedBucketFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 min-h-[38px] cursor-pointer"
          >
            <option value="ALL">All Buckets</option>
            {buckets.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-xs ${
                typeFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('CREDIT')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-xs ${
                typeFilter === 'CREDIT'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Credits
            </button>
            <button
              onClick={() => setTypeFilter('DEBIT')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-xs ${
                typeFilter === 'DEBIT'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Debits
            </button>
            <button
              onClick={() => setTypeFilter('MANUAL_ADJUSTMENT')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-xs ${
                typeFilter === 'MANUAL_ADJUSTMENT'
                  ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Adjustments
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Records View */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-gray-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center text-gray-400 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700" />
            <p className="text-xs font-medium">No transactions found matching your search.</p>
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (block on sm:hidden) */}
            <div className="block sm:hidden divide-y divide-gray-100 dark:divide-zinc-850">
              {filteredTransactions.map(txn => {
                const isCredit = txn.direction === 'CREDIT';
                const formattedDate = new Date(txn.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={txn.id} className="p-4 space-y-2.5 hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    {/* Top Row: Description & Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${
                          isCredit ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        }`}>
                          {isCredit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-900 dark:text-zinc-100 leading-snug break-words">
                            {txn.description}
                          </p>
                          <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                            {formattedDate}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`font-mono font-black text-sm block ${
                          isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isCredit ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Metadata Badges */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-zinc-900 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md text-[10px]">
                          {txn.bucketName || 'Unallocated'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          txn.type === 'INCOME_SPLIT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : txn.type === 'EXPENSE'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}>
                          {txn.type}
                        </span>
                        {txn.receiptUrl && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold inline-flex items-center gap-0.5">
                            <Receipt className="w-3 h-3" /> Receipt
                          </span>
                        )}
                      </div>

                      {txn.deduplicationHash && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 font-medium">
                          #{txn.deduplicationHash.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (hidden on sm:table) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-zinc-900/80 border-b border-gray-200/80 dark:border-zinc-850 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Target Bucket</th>
                    <th className="py-3.5 px-4">Type / Source</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Audit Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-850 text-xs">
                  {filteredTransactions.map(txn => {
                    const isCredit = txn.direction === 'CREDIT';
                    const formattedDate = new Date(txn.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr
                        key={txn.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px] whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-zinc-100">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isCredit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{txn.description}</span>
                            {txn.receiptUrl && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold flex items-center gap-0.5 flex-shrink-0">
                                <Receipt className="w-3 h-3" /> Receipt
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                          {txn.bucketName || 'Unallocated'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              txn.type === 'INCOME_SPLIT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : txn.type === 'EXPENSE'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                            }`}>
                              {txn.type}
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">
                              ({txn.sourceType})
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                          <span className={isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {isCredit ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {txn.deduplicationHash ? (
                            <span className="font-mono text-[9px] px-2 py-1 rounded bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-semibold" title={txn.deduplicationHash}>
                              {txn.deduplicationHash.slice(0, 12)}...
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-zinc-700 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
