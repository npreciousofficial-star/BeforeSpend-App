/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bucket, SplitInfo } from '../types';
import { calculateSplits, formatCurrency, convertCurrency } from '../lib/utils';
import { QuickAmounts } from './QuickAmounts';
import { AnimatedNumber } from './AnimatedNumber';
import { 
  Copy, 
  Check, 
  ArrowRight, 
  Wallet, 
  Image as ImageIcon, 
  X, 
  FileCheck, 
  Sparkles,
  Zap,
  Building2,
  TrendingUp,
  CreditCard
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

  // Sync input currency if default currency changes
  useEffect(() => {
    if (defaultCurrency && !amount) {
      setCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);

  const numericAmount = parseFloat(amount) || 0;
  const convertedAmount = convertCurrency(numericAmount, currency, defaultCurrency, exchangeRates);
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
      textSummary += `- ${split.bucketName} (${split.percentage}%): ${formatCurrency(split.amount, defaultCurrency)} -> ${split.destinationAccount}\n`;
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

    addToast('Payment split saved! Bucket balances updated.', 'success');
    
    // Reset calculator inputs
    setAmount('');
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
      case 'emerald': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40';
      case 'blue': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40';
      case 'amber': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40';
      case 'red': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40';
      case 'purple': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40';
      case 'teal': return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/40';
      case 'indigo': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40';
      case 'pink': return 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-400 border border-pink-200/60 dark:border-pink-900/40';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400 border border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT: Input & Controls Area */}
      <div className="lg:col-span-5 space-y-5">
        <div id="calculator-input-card" className="p-6 rounded-3xl border border-gray-200/80 bg-white dark:bg-zinc-950 dark:border-zinc-800/80 shadow-xl shadow-gray-200/40 dark:shadow-none space-y-5 transition-all">
          
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-[#00A896] border border-teal-100/50 dark:border-teal-900/30">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-zinc-50">
                  Payment Received
                </h2>
                <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500">
                  Enter incoming funds to allocate
                </p>
              </div>
            </div>

            {/* Currency Selector Pills */}
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-900/90 p-1 rounded-xl border border-gray-200/60 dark:border-zinc-800">
              {['NGN', 'USD', 'GBP', 'EUR', 'CAD'].map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg cursor-pointer transition-all ${
                    currency === curr
                      ? 'bg-white text-gray-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
                  }`}
                >
                  {curr === 'NGN' ? '₦' : curr}
                </button>
              ))}
            </div>
          </div>

          {/* Large Hero Amount Input Box */}
          <div className="relative rounded-2xl border-2 border-gray-200 dark:border-zinc-800/90 focus-within:border-[#00A896] focus-within:ring-4 focus-within:ring-[#00A896]/10 transition-all overflow-hidden bg-gray-50/50 dark:bg-zinc-900/30 flex items-center pr-4">
            <span className="pl-4 text-gray-400 font-extrabold text-3xl select-none">
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
              className="w-full pl-2 pr-3 py-4 text-3xl font-black bg-transparent border-none text-gray-900 dark:text-zinc-50 placeholder-gray-300 dark:placeholder-zinc-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Quick Amount Buttons */}
          <QuickAmounts 
            onSelect={(amt) => setAmount(amt.toString())}
            inputCurrency={currency}
            defaultCurrency={defaultCurrency}
            exchangeRates={exchangeRates}
          />

          {/* Real-time Conversion badge */}
          {currency !== defaultCurrency && numericAmount > 0 && (
            <div id="real-time-conversion-helper" className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 dark:bg-teal-950/20 dark:border-teal-900/40 text-xs">
              <Sparkles className="w-4 h-4 text-[#00A896] flex-shrink-0 animate-pulse" />
              <div className="text-gray-700 dark:text-zinc-300 font-medium">
                Converts to <strong className="text-[#00A896] dark:text-teal-400 font-black">{formatCurrency(convertedAmount, defaultCurrency)}</strong>
                <span className="text-gray-400 dark:text-zinc-500 font-mono ml-1.5">(1 {currency} = {formatCurrency(exchangeRates[currency] || 1, 'NGN')})</span>
              </div>
            </div>
          )}

          {/* Receipt Screenshot Upload */}
          <div className="pt-1">
            <label className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
              Receipt / Proof of Payment (Optional)
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
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  isDragging 
                    ? 'border-[#00A896] bg-teal-50/40 dark:bg-teal-950/20' 
                    : 'border-gray-200 hover:border-gray-400 dark:border-zinc-800 dark:hover:border-zinc-700 bg-gray-50/40 dark:bg-zinc-900/20'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                  Drag & drop receipt screenshot or <span className="text-[#00A896] hover:underline font-bold">browse</span>
                </span>
                <span className="text-[10px] text-gray-400">PNG, JPG up to 2MB</span>
              </div>
            ) : (
              <div id="receipt-preview-container" className="flex items-center justify-between p-3.5 rounded-2xl border border-teal-200/80 bg-teal-50/30 dark:bg-teal-950/20 dark:border-teal-900/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 flex-shrink-0 shadow-xs">
                    <img referrerPolicy="no-referrer" src={receiptBase64} alt="Receipt preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate max-w-[160px]">
                      {receiptName || 'receipt_uploaded.png'}
                    </p>
                    <span className="text-[10px] text-[#00A896] font-bold flex items-center gap-0.5">
                      <FileCheck className="w-3 h-3" /> Attached
                    </span>
                  </div>
                </div>
                <button
                  id="remove-receipt-button"
                  type="button"
                  onClick={clearReceipt}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="calculator-copy-all-button"
              type="button"
              disabled={numericAmount <= 0}
              onClick={handleCopyAll}
              className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                numericAmount > 0
                  ? 'border-gray-200 hover:bg-gray-100 text-gray-800 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'border-gray-200 text-gray-300 dark:border-zinc-900 dark:text-zinc-700 cursor-not-allowed'
              }`}
            >
              {copiedAll ? <Check className="w-4 h-4 text-[#00A896]" /> : <Copy className="w-4 h-4" />}
              Copy Summary
            </button>
            <button
              id="calculator-save-button"
              type="button"
              disabled={numericAmount <= 0}
              onClick={handleSave}
              className={`py-3 px-3 rounded-2xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer ${
                numericAmount > 0
                  ? 'bg-gradient-to-r from-[#00A896] to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/20'
                  : 'bg-gray-200 dark:bg-zinc-900 text-gray-400 dark:text-zinc-700 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4" />
              Save to Buckets
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Real-time Split Distribution Cards */}
      <div className="lg:col-span-7 space-y-4">
        <div id="calculator-results-card" className="p-6 rounded-3xl border border-gray-200/80 bg-white dark:bg-zinc-950 dark:border-zinc-800/80 shadow-xl shadow-gray-200/40 dark:shadow-none space-y-5">
          
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-900">
            <div>
              <h3 className="font-black text-gray-900 dark:text-zinc-50 text-base flex items-center gap-2">
                <span>Real-time Split Distribution</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 dark:bg-teal-950/40 text-[#00A896] border border-teal-100 dark:border-teal-900/40">
                  Automated
                </span>
              </h3>
              <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">
                Instant percentage breakdowns per your financial targets
              </p>
            </div>

            {numericAmount > 0 && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Total Allocated
                </span>
                <span className="text-sm font-black text-[#00A896] dark:text-teal-400">
                  <AnimatedNumber value={convertedAmount} currency={defaultCurrency} />
                </span>
              </div>
            )}
          </div>

          {/* Distribution List / Cards */}
          <div className="space-y-3">
            {splits.length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-zinc-500 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-zinc-900 flex items-center justify-center text-gray-300 dark:text-zinc-700">
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Ready to split received income</p>
                  <p className="text-xs max-w-xs mx-auto text-gray-400 dark:text-zinc-500 mt-1">
                    Enter a payment amount on the left to watch your income automatically split into designated savings, tax, and operating vaults.
                  </p>
                </div>
              </div>
            ) : (
              splits.map((split, idx) => {
                const originalBucket = buckets.find((b) => b.id === split.bucketId);
                const currentBalance = originalBucket ? originalBucket.balance : 0;
                const projectedBalance = currentBalance + split.amount;
                
                return (
                  <div 
                    key={split.bucketId} 
                    className="p-4 rounded-2xl border border-gray-150 dark:border-zinc-900 bg-gray-50/40 dark:bg-zinc-900/20 hover:border-gray-300 dark:hover:border-zinc-800 transition-all space-y-3 group"
                  >
                    {/* Top Row: Name, Pill, Allocated Amount */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-3 h-3 rounded-full ${getThemeColorClass(split.color)} shadow-xs flex-shrink-0`} />
                        <span className="text-sm font-black text-gray-800 dark:text-zinc-100 truncate">
                          {split.bucketName}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getThemePillClass(split.color)} flex-shrink-0`}>
                          {split.percentage}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-base font-black text-gray-900 dark:text-zinc-50">
                          <AnimatedNumber value={split.amount} currency={defaultCurrency} />
                        </span>
                        
                        <button
                          id={`copy-amount-btn-${split.bucketId}`}
                          onClick={() => handleCopyAmount(split.amount, idx)}
                          className="p-1.5 rounded-xl text-gray-400 hover:text-[#00A896] hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
                          title="Copy amount"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-4 h-4 text-[#00A896]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress Ratio Bar */}
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getThemeColorClass(split.color)} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.min(split.percentage, 100)}%` }}
                      />
                    </div>

                    {/* Bottom Row: Account Destination & Projected Balance */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-0.5">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>To: <strong className="text-gray-700 dark:text-zinc-200">{split.destinationAccount}</strong></span>
                      </div>

                      <div className="flex items-center gap-3 font-semibold text-gray-500 dark:text-zinc-400">
                        <span>Current: <strong className="text-gray-700 dark:text-zinc-300">{formatCurrency(currentBalance, defaultCurrency)}</strong></span>
                        {numericAmount > 0 && (
                          <span className="text-[#00A896] dark:text-teal-400 font-bold flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" />
                            <span>After: {formatCurrency(projectedBalance, defaultCurrency)}</span>
                          </span>
                        )}
                      </div>
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
