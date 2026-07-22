/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bucket, SplitInfo } from '../types';
import { calculateSplits, formatCurrency, convertCurrency } from '../lib/utils';
import { QuickAmounts } from './QuickAmounts';
import { 
  Copy, 
  Check, 
  ArrowRight, 
  Wallet, 
  Image as ImageIcon, 
  X, 
  FileCheck, 
  HelpCircle,
  TrendingDown,
  Sparkles
} from 'lucide-react';

interface SplitCalculatorProps {
  buckets: Bucket[];
  defaultCurrency: string;
  exchangeRates: { [key: string]: number };
  onSavePayment: (payment: {
    amount: number;
    currency: string;
    convertedAmount: number;
    splits: SplitInfo[];
    receiptImage?: string;
  }) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function SplitCalculator({ 
  buckets, 
  defaultCurrency, 
  exchangeRates, 
  onSavePayment, 
  addToast 
}: SplitCalculatorProps) {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('NGN');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // Receipt upload states
  const [receiptBase64, setReceiptBase64] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync input currency if default currency changes, or keep it NGN
  useEffect(() => {
    if (defaultCurrency && !amount) {
      setCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);

  const numericAmount = parseFloat(amount) || 0;

  // Convert the entered amount from input currency to user's default currency
  const convertedAmount = convertCurrency(numericAmount, currency, defaultCurrency, exchangeRates);

  // Calculate splits based on convertedAmount (which is in defaultCurrency)
  const splits = calculateSplits(convertedAmount, buckets);

  const handleCopyAmount = (amt: number, index: number) => {
    const formatted = formatCurrency(amt, defaultCurrency);
    navigator.clipboard.writeText(formatted);
    setCopiedIndex(index);
    addToast(`Copied ${formatted} to clipboard!`, 'success');
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleCopyAll = () => {
    if (numericAmount <= 0) return;
    
    let textSummary = `*BeforeSpend Split Summary*\n`;
    textSummary += `Total Received: ${formatCurrency(numericAmount, currency)}\n`;
    if (currency !== defaultCurrency) {
      textSummary += `Equivalent: ${formatCurrency(convertedAmount, defaultCurrency)}\n`;
    }
    textSummary += `Date: ${new Date().toLocaleDateString()}\n\n`;
    textSummary += `*Bucket Distributions:*\n`;
    
    splits.forEach((split) => {
      textSummary += `- ${split.bucketName} (${split.percentage}%): ${formatCurrency(split.amount, defaultCurrency)} To: ${split.destinationAccount}\n`;
    });
    
    navigator.clipboard.writeText(textSummary);
    setCopiedAll(true);
    addToast('Copied all splits to clipboard!', 'success');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSave = () => {
    if (numericAmount <= 0) {
      addToast('Please enter a payment amount greater than zero.', 'error');
      return;
    }

    onSavePayment({
      amount: numericAmount,
      currency,
      convertedAmount,
      splits,
      receiptImage: receiptBase64,
    });

    addToast('Payment split saved! Balances updated.', 'success');
    
    // Reset calculator inputs
    setAmount('');
    setReceiptBase64(undefined);
    setReceiptName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Receipt image file reader
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG/JPG).', 'error');
      return;
    }
    
    // Limit file size to 2MB to keep localStorage clean
    if (file.size > 2 * 1024 * 1024) {
      addToast('Receipt image must be smaller than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setReceiptBase64(e.target.result);
        setReceiptName(file.name);
        addToast('Receipt screenshot attached!', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  const clearReceipt = () => {
    setReceiptBase64(undefined);
    setReceiptName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const getThemePillClass = (colorName: string) => {
    switch (colorName) {
      case 'emerald': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'blue': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
      case 'amber': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
      case 'red': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400';
      case 'purple': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400';
      case 'teal': return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400';
      case 'indigo': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400';
      case 'pink': return 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Input Control Area */}
      <div className="lg:col-span-5 space-y-5">
        <div id="calculator-input-card" className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-sm space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Payment received
              </label>
              {/* Currency Selector */}
              <div className="flex gap-1 bg-gray-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-800">
                {['NGN', 'USD', 'GBP', 'EUR', 'CAD'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`px-2 py-0.5 text-[10px] font-black rounded cursor-pointer transition-all ${
                      currency === curr
                        ? 'bg-white text-gray-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
                    }`}
                  >
                    {curr === 'NGN' ? '₦' : curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Major Input Box */}
            <div className="relative rounded-xl border border-gray-250 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 overflow-hidden bg-gray-50/20 dark:bg-zinc-900/10 flex items-center pr-3">
              <span className="pl-4 text-gray-400 font-extrabold text-2xl">
                {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'C$'}
              </span>
              <input
                id="calculator-main-input"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-2 pr-3 py-3.5 text-2xl font-black bg-transparent border-none text-gray-900 dark:text-zinc-50 placeholder-gray-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Quick Amounts */}
            <QuickAmounts 
              onSelect={(amt) => setAmount(amt.toString())}
              inputCurrency={currency}
              defaultCurrency={defaultCurrency}
              exchangeRates={exchangeRates}
            />
          </div>

          {/* Real-time Conversion helper block */}
          {currency !== defaultCurrency && numericAmount > 0 && (
            <div id="real-time-conversion-helper" className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 animate-pulse" />
              <div className="text-gray-600 dark:text-zinc-300">
                Converts to <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(convertedAmount, defaultCurrency)}</strong> at 
                <span className="font-mono"> 1 {currency} = {formatCurrency(exchangeRates[currency] || 1, 'NGN')}</span>
              </div>
            </div>
          )}

          {/* Screenshot Upload Block */}
          <div className="pt-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Receipt Screenshot (Optional)
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!receiptBase64 ? (
              <div
                id="receipt-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerSelectFile}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' 
                    : 'border-gray-250 hover:border-gray-400 dark:border-zinc-800 dark:hover:border-zinc-700 bg-gray-50/30 dark:bg-zinc-950/10'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                  Drag & drop receipt or <span className="text-emerald-600 hover:underline">browse</span>
                </span>
                <span className="text-[10px] text-gray-400">PNG, JPG up to 2MB</span>
              </div>
            ) : (
              <div id="receipt-preview-container" className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/20 dark:bg-emerald-950/10 dark:border-emerald-900/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 flex-shrink-0">
                    <img referrerPolicy="no-referrer" src={receiptBase64} alt="Receipt preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 truncate max-w-[150px]">
                      {receiptName || 'receipt_uploaded.png'}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <FileCheck className="w-3 h-3" /> Attached
                    </span>
                  </div>
                </div>
                <button
                  id="remove-receipt-button"
                  type="button"
                  onClick={clearReceipt}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              id="calculator-copy-all-button"
              type="button"
              disabled={numericAmount <= 0}
              onClick={handleCopyAll}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                numericAmount > 0
                  ? 'border-gray-250 hover:bg-gray-50 text-gray-700 dark:border-zinc-800 dark:hover:bg-zinc-950 dark:text-zinc-200'
                  : 'border-gray-200 text-gray-300 dark:border-zinc-900 dark:text-zinc-700 cursor-not-allowed'
              }`}
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              Copy Summary
            </button>
            <button
              id="calculator-save-button"
              type="button"
              disabled={numericAmount <= 0}
              onClick={handleSave}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                numericAmount > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/10'
                  : 'bg-gray-200 dark:bg-zinc-900 text-gray-400 dark:text-zinc-700 cursor-not-allowed'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Save to Buckets
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Calculation Display Area */}
      <div className="lg:col-span-7 space-y-4">
        <div id="calculator-results-card" className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
              Real-time Split Distribution
            </h3>
            {numericAmount > 0 && (
              <span className="text-xs font-medium text-gray-400">
                Split totals sum: {formatCurrency(convertedAmount, defaultCurrency)}
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-150 dark:divide-zinc-900">
            {splits.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-zinc-500 space-y-1.5">
                <Wallet className="w-10 h-10 mx-auto opacity-30 stroke-[1.5]" />
                <p className="text-sm font-semibold">Ready to split received payment</p>
                <p className="text-xs">Enter an amount on the left to see the instant distribution.</p>
              </div>
            ) : (
              splits.map((split, idx) => {
                const originalBucket = buckets.find((b) => b.id === split.bucketId);
                const currentBalance = originalBucket ? originalBucket.balance : 0;
                
                return (
                  <div key={split.bucketId} className="py-3.5 flex flex-col gap-2 group/split">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getThemeColorClass(split.color)}`} />
                        <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">
                          {split.bucketName}
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${getThemePillClass(split.color)}`}>
                          {split.percentage}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900 dark:text-zinc-50">
                          {formatCurrency(split.amount, defaultCurrency)}
                        </span>
                        
                        <button
                          id={`copy-amount-btn-${split.bucketId}`}
                          onClick={() => handleCopyAmount(split.amount, idx)}
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                          title="Copy amount"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress indicators */}
                    <div className="w-full flex items-center justify-between text-[11px] text-gray-400 dark:text-zinc-500">
                      <span>To: {split.destinationAccount}</span>
                      <span className="font-semibold text-gray-500">
                        Current Bal: <span className={currentBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{formatCurrency(currentBalance, defaultCurrency)}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
