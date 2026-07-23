/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Bucket } from '../types';
import { generateId } from '../lib/utils';
import { CustomSelect } from './CustomSelect';
import { 
  TrendingDown, 
  Plus, 
  Image as ImageIcon, 
  X, 
  FileCheck 
} from 'lucide-react';

interface ExpenseFormProps {
  buckets: Bucket[];
  currency: string;
  onAdd: (expense: {
    id: string;
    description: string;
    amount: number;
    bucketId: string;
    bucketName: string;
    date: string;
    receiptImage?: string;
  }) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function ExpenseForm({ buckets, currency, onAdd, addToast }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [bucketId, setBucketId] = useState('');
  const [error, setError] = useState('');

  // Receipt attachment state
  const [receiptBase64, setReceiptBase64] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please enter an expense description.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!bucketId) {
      setError('Please select a bucket to deduct from.');
      return;
    }

    const selectedBucket = buckets.find((b) => b.id === bucketId);
    if (!selectedBucket) {
      setError('Bucket not found.');
      return;
    }

    // Validation: Cannot deduct more than available balance
    if (parsedAmount > selectedBucket.balance) {
      setError(`Insufficient balance in ${selectedBucket.name}. Available: ${selectedBucket.balance}`);
      addToast(`Insufficient balance in ${selectedBucket.name}`, 'error');
      return;
    }

    onAdd({
      id: generateId(),
      description: description.trim(),
      amount: parsedAmount,
      bucketId: selectedBucket.id,
      bucketName: selectedBucket.name,
      date: new Date().toISOString(),
      receiptImage: receiptBase64,
    });

    addToast(`Expense logged! Deducted from ${selectedBucket.name}`, 'success');

    // Reset Form
    setDescription('');
    setAmount('');
    setBucketId('');
    setReceiptBase64(undefined);
    setReceiptName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG/JPG).', 'error');
      return;
    }
    
    // Limit to 2MB for safe localStorage
    if (file.size > 2 * 1024 * 1024) {
      addToast('Receipt image must be smaller than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setReceiptBase64(e.target.result);
        setReceiptName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearReceipt = () => {
    setReceiptBase64(undefined);
    setReceiptName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form
      id="expense-logging-form"
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-1">
        <TrendingDown className="w-5 h-5 text-rose-500" />
        <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
          Log Business Expense
        </h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
            Expense Description
          </label>
          <input
            id="expense-description-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Adobe Suite Subscription, Co-working pass"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              Amount ({currency === 'NGN' ? '₦' : currency})
            </label>
            <input
              id="expense-amount-input"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
            />
          </div>

          <div>
            <CustomSelect
              id="expense-bucket-select"
              label="Deduct From Bucket"
              value={bucketId}
              onChange={setBucketId}
              placeholder="Select bucket..."
              options={buckets.map((b) => ({
                value: b.id,
                label: b.name,
                sublabel: `Bal: ${currency === 'NGN' ? '₦' : currency}${b.balance.toLocaleString()}`,
                disabled: b.balance <= 0,
              }))}
            />
          </div>
        </div>

        {/* Optional Receipt Upload */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {!receiptBase64 ? (
            <button
              id="attach-expense-receipt"
              type="button"
              onClick={triggerFileSelect}
              className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold mt-1 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              Attach Expense Receipt Screenshot
            </button>
          ) : (
            <div id="expense-receipt-preview" className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800 mt-2">
              <div className="flex items-center gap-2 min-w-0">
                <img referrerPolicy="no-referrer" src={receiptBase64} alt="Receipt" className="w-8 h-8 rounded object-cover border border-gray-200 dark:border-zinc-800" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 truncate max-w-[120px]">
                    {receiptName || 'receipt.png'}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <FileCheck className="w-3 h-3" /> Ready
                  </span>
                </div>
              </div>
              <button
                id="remove-expense-receipt"
                type="button"
                onClick={clearReceipt}
                className="text-gray-400 hover:text-rose-500 p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <p id="expense-form-error" className="text-xs font-semibold text-rose-500">
            {error}
          </p>
        )}

        <button
          id="submit-expense-button"
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm transition-all hover:shadow-rose-500/10 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Deduct Expense
        </button>
      </div>
    </form>
  );
}
