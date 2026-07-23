import React, { useState } from 'react';
import { Bucket, Transaction } from '../types';
import { formatCurrency, generateId } from '../lib/utils';
import { CustomSelect } from './CustomSelect';
import { ArrowUpRight, ArrowDownRight, Scale, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface ReconciliationModalProps {
  buckets: Bucket[];
  currency: string;
  transactions: Transaction[];
  onReconcile: (newTransaction: Transaction) => void;
  onClose: () => void;
  initialBucketId?: string;
}

export function ReconciliationModal({
  buckets,
  currency,
  transactions,
  onReconcile,
  onClose,
  initialBucketId
}: ReconciliationModalProps) {
  const [selectedBucketId, setSelectedBucketId] = useState<string>(
    initialBucketId || (buckets.length > 0 ? buckets[0].id : '')
  );
  const selectedBucket = buckets.find(b => b.id === selectedBucketId);

  // Calculate current computed balance from ledger transactions
  const computedBalance = selectedBucket
    ? transactions
        .filter(t => t.bucketId === selectedBucket.id)
        .reduce((sum, t) => sum + (t.direction === 'CREDIT' ? t.amount : -t.amount), 0)
    : 0;

  const [targetBalanceInput, setTargetBalanceInput] = useState<string>(
    computedBalance.toString()
  );
  const [note, setNote] = useState<string>('Bank Statement Balance Reconciliation');

  const targetBalance = parseFloat(targetBalanceInput) || 0;
  const delta = targetBalance - computedBalance;

  const handleApplyReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBucket) return;

    if (Math.abs(delta) < 0.01) {
      alert('The target balance matches current computed ledger balance exactly! No transaction adjustment is needed.');
      return;
    }

    const direction = delta > 0 ? 'CREDIT' : 'DEBIT';
    const amount = Math.abs(delta);

    const adjustmentTransaction: Transaction = {
      id: generateId('txn'),
      bucketId: selectedBucket.id,
      bucketName: selectedBucket.name,
      type: 'MANUAL_ADJUSTMENT',
      amount,
      direction,
      description: note || `Reconciliation: Adjusted ${selectedBucket.name} balance to ${formatCurrency(targetBalance, currency)}`,
      sourceType: 'MANUAL_ENTRY',
      createdAt: new Date().toISOString()
    };

    onReconcile(adjustmentTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1.5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <div className="p-2.5 sm:p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex-shrink-0">
            <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-zinc-50 tracking-tight">
              Adjust Category Balance
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400">
              Update your balance to match your real bank account statement.
            </p>
          </div>
        </div>

        <form onSubmit={handleApplyReconciliation} className="space-y-4">
          {/* Bucket Select */}
          <div>
            <CustomSelect
              id="reconciliation-bucket-select"
              label="Select Target Bucket"
              value={selectedBucketId}
              onChange={(bId) => {
                setSelectedBucketId(bId);
                const b = buckets.find(item => item.id === bId);
                if (b) {
                  const bCalculated = transactions
                    .filter(t => t.bucketId === b.id)
                    .reduce((sum, t) => sum + (t.direction === 'CREDIT' ? t.amount : -t.amount), 0);
                  setTargetBalanceInput(bCalculated.toString());
                }
              }}
              options={buckets.map(b => ({
                value: b.id,
                label: b.name,
                sublabel: b.destinationAccount,
              }))}
            />
          </div>

          {/* Current Ledger Balance Display */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 flex items-center justify-between gap-2">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Current Ledger Calculated
              </span>
              <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-zinc-100">
                {formatCurrency(computedBalance, currency)}
              </span>
            </div>
            <div className="text-right text-[10px] text-gray-400 font-mono">
              Inflows - Outflows
            </div>
          </div>

          {/* Real World Target Input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Actual Real-World Bank Balance ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={targetBalanceInput}
                onChange={(e) => setTargetBalanceInput(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 font-black text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Enter what your bank application currently displays.
            </p>
          </div>

          {/* Delta & Direction Preview */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
            Math.abs(delta) < 0.01
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
              : delta > 0
              ? 'bg-blue-50/50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-400'
              : 'bg-amber-50/50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {delta > 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                ) : delta < 0 ? (
                  <ArrowDownRight className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                )}
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider opacity-80">
                    Adjustment
                  </span>
                  <span className="font-bold text-xs sm:text-sm">
                    {Math.abs(delta) < 0.01
                      ? 'No Adjustment Required'
                      : `${delta > 0 ? '+ CREDIT' : '- DEBIT'} of ${formatCurrency(Math.abs(delta), currency)}`}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-[10px] uppercase font-bold opacity-70 block">Source</span>
                <span className="text-[11px] sm:text-xs font-semibold">MANUAL_ADJUSTMENT</span>
              </div>
            </div>
          </div>

          {/* Description / Audit Note */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Audit Note / Reason
            </label>
            <input
              type="text"
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. Reconciled against June bank statement"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Math.abs(delta) < 0.01}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Apply Ledger Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
