import React, { useState } from 'react';
import { Wallet, ArrowUpRight, DollarSign, X, Check, Globe } from 'lucide-react';
import { Bucket } from '../types';
import { formatCurrency, convertCurrency } from '../lib/utils';
import { CustomSelect } from './CustomSelect';

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

  const bucketOptions = buckets.map((b) => ({
    value: b.id,
    label: b.name,
    sublabel: `${formatCurrency(b.balance, userCurrency)} available`
  }));

  const currencyOptions = [
    { value: 'NGN', label: 'NGN (₦)', sublabel: 'Nigerian Naira' },
    { value: 'USD', label: 'USD ($)', sublabel: 'US Dollar' },
    { value: 'EUR', label: 'EUR (€)', sublabel: 'Euro' },
    { value: 'GBP', label: 'GBP (£)', sublabel: 'British Pound' },
    { value: 'CAD', label: 'CAD (C$)', sublabel: 'Canadian Dollar' }
  ];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/40 text-[#00A896] flex items-center justify-center shadow-xs shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0E2A47] dark:text-white">Direct Bucket Deposit</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Fund 100% directly into a single budget bucket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Custom Select for Target Bucket */}
          <CustomSelect
            label="Select Target Bucket *"
            options={bucketOptions}
            value={selectedBucketId}
            onChange={(val) => setSelectedBucketId(val)}
            placeholder="Select target bucket..."
          />

          {/* Amount & Custom Currency Dropdown (Spacious 2-column flex layout) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
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
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white text-base font-black focus:ring-2 focus:ring-[#00A896] outline-none"
              />
            </div>

            <div className="w-full sm:w-48 shrink-0">
              <CustomSelect
                label="Currency"
                options={currencyOptions}
                value={depositCurrency}
                onChange={(val) => setDepositCurrency(val)}
              />
            </div>
          </div>

          {/* FX Conversion Notice if foreign currency */}
          {depositCurrency !== userCurrency && rawAmount > 0 && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00A896]" />
                <span>FX Conversion:</span>
              </div>
              <strong className="font-black text-[#00A896] text-sm">
                {formatCurrency(convertedAmount, userCurrency)}
              </strong>
            </div>
          )}

          {/* Deposit Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Deposit Note / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Freelance Client Deposit / Salary"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 rounded-2xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-extrabold cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rawAmount <= 0}
              className="py-3 px-8 rounded-2xl bg-[#00A896] hover:bg-[#028072] disabled:opacity-50 text-white text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
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
