import React, { useState } from 'react';
import { Wallet, ArrowUpRight, DollarSign, X, Check, Globe } from 'lucide-react';
import { Bucket, Transaction } from '../types';
import { formatCurrency, convertCurrency } from '../lib/utils';

interface DirectDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  buckets: Bucket[];
  defaultBucketId?: string;
  userCurrency?: string;
  onDepositSuccess: (depositData: {
    bucketId: string;
    bucketName: string;
    amount: number;
    currency: string;
    convertedAmount: number;
    note?: string;
  }) => void;
}

export const DirectDepositModal: React.FC<DirectDepositModalProps> = ({
  isOpen,
  onClose,
  buckets,
  defaultBucketId,
  userCurrency = 'NGN',
  onDepositSuccess
}) => {
  const [selectedBucketId, setSelectedBucketId] = useState<string>(
    defaultBucketId || (buckets[0]?.id || '')
  );
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositCurrency, setDepositCurrency] = useState<string>(userCurrency);
  const [depositNote, setDepositNote] = useState<string>('');

  if (!isOpen) return null;

  const rawAmount = parseFloat(depositAmount) || 0;
  const convertedAmount = convertCurrency(rawAmount, depositCurrency, userCurrency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawAmount <= 0 || !selectedBucketId) return;

    const targetBucket = buckets.find(b => b.id === selectedBucketId);
    if (!targetBucket) return;

    onDepositSuccess({
      bucketId: targetBucket.id,
      bucketName: targetBucket.name,
      amount: rawAmount,
      currency: depositCurrency,
      convertedAmount,
      note: depositNote
    });

    setDepositAmount('');
    setDepositNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/30 text-[#00A896] flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Direct Bucket Deposit</h3>
              <p className="text-xs text-slate-500">Fund 100% directly to a single target bucket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Target Bucket Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Select Target Bucket *
            </label>
            <select
              value={selectedBucketId}
              onChange={(e) => setSelectedBucketId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
            >
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({formatCurrency(b.balance, userCurrency)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Currency Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Deposit Amount *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-[#00A896] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Currency
              </label>
              <select
                value={depositCurrency}
                onChange={(e) => setDepositCurrency(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
              >
                {['NGN', 'USD', 'EUR', 'GBP', 'CAD'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FX Conversion Notice if foreign currency */}
          {depositCurrency !== userCurrency && rawAmount > 0 && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/30 text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00A896]" />
                <span>FX Conversion:</span>
              </div>
              <strong className="font-black text-[#00A896]">
                {formatCurrency(convertedAmount, userCurrency)}
              </strong>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Deposit Note / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Freelance Client Payment / Direct Deposit"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rawAmount <= 0}
              className="py-2.5 px-6 rounded-xl bg-[#00A896] hover:bg-[#028072] disabled:opacity-50 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Deposit {rawAmount > 0 ? formatCurrency(rawAmount, depositCurrency) : ''}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default DirectDepositModal;
