import React, { useState, useEffect, useRef } from 'react';
import { Bucket, SplitInfo } from '../types';
import { calculateSplits, formatCurrency, convertCurrency } from '../lib/utils';
import { QuickAmounts } from './QuickAmounts';
import { AnimatedNumber } from './AnimatedNumber';
import { 
  Copy, 
  Check, 
  Wallet, 
  Image as ImageIcon, 
  X, 
  FileCheck, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  PieChart
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
  const [note, setNote] = useState<string>('');
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

  // Format input string with commas as typed e.g. 1,000,000.00
  const formatRawValue = (val: string): string => {
    if (!val) return '';
    // Strip all non-digit and non-decimal characters
    const cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts.length > 1) {
      return `${integerPart}.${parts[1].slice(0, 2)}`;
    }
    return integerPart;
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRawValue(e.target.value);
    setAmount(formatted);
  };

  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;

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
      note: note.trim() || undefined,
    });

    addToast('Payment split saved! Balances updated.', 'success');
    
    // Reset calculator inputs
    setAmount('');
    setNote('');
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
      default: return 'bg-[#00A896]';
    }
  };

  const getThemePillClass = (colorName: string) => {
    switch (colorName) {
      case 'emerald': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50';
      case 'blue': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50';
      case 'amber': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50';
      case 'red': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50';
      case 'purple': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50';
      case 'teal': return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/50';
      case 'indigo': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50';
      case 'pink': return 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Input Control Area */}
      <div className="lg:col-span-5 space-y-5">
        <div id="calculator-input-card" className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4 shadow-sm">
          <div>
            <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 mb-2">
              <label className="text-xs font-black text-[#0E2A47] dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap min-w-max">
                <Wallet className="w-4 h-4 text-[#00A896] flex-shrink-0" />
                Payment Received
              </label>
              {/* Currency Selector */}
              <div className="flex gap-1 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl border border-gray-200 dark:border-zinc-800 flex-shrink-0">
                {['NGN', 'USD', 'GBP', 'EUR', 'CAD'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`px-2.5 py-1 text-[11px] font-black rounded-lg cursor-pointer transition-all ${
                      currency === curr
                        ? 'bg-[#0E2A47] text-white shadow-md dark:bg-[#00A896]'
                        : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
                    }`}
                  >
                    {curr === 'NGN' ? '₦' : curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Major Input Box */}
            <div className="relative rounded-2xl border border-gray-300/80 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-[#00A896]/30 focus-within:border-[#00A896] overflow-hidden bg-gradient-to-br from-gray-50/50 to-teal-50/20 dark:from-zinc-900/40 dark:to-zinc-900/10 flex items-center pr-4 transition-all">
              <span className="pl-5 text-[#0E2A47] dark:text-zinc-200 font-extrabold text-3xl select-none flex-shrink-0">
                {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'C$'}
              </span>
              <input
                id="calculator-main-input"
                type="text"
                value={amount}
                onChange={handleAmountInputChange}
                placeholder="0.00"
                className="w-full pl-3 pr-4 py-4 text-3xl font-black bg-transparent border-none text-gray-900 dark:text-zinc-50 placeholder-gray-300 dark:placeholder-zinc-700 focus:outline-none tracking-tight"
              />
            </div>

            {/* Quick Amounts */}
            <div className="mt-3">
              <QuickAmounts 
                onSelect={(amt) => setAmount(formatRawValue(amt.toString()))}
                inputCurrency={currency}
                defaultCurrency={defaultCurrency}
                exchangeRates={exchangeRates}
              />
            </div>

            {/* Dynamic Premium Income Description / Source Input Field (Appears when income is typed) */}
            {numericAmount > 0 && (
              <div className="mt-3.5 pt-3.5 border-t border-gray-150 dark:border-zinc-850 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[11px] font-black text-[#0E2A47] dark:text-zinc-200 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00A896]" />
                    Payment Description / Income Source
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal lowercase">(Optional)</span>
                </label>
                <div className="relative rounded-xl border border-gray-250 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-[#00A896]/30 focus-within:border-[#00A896] overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs transition-all flex items-center pr-3">
                  <input
                    id="calculator-note-input"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Website design project payment or Salary Income"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time Conversion helper block */}
          {currency !== defaultCurrency && numericAmount > 0 && (
            <div id="real-time-conversion-helper" className="flex items-center gap-2.5 p-4 rounded-2xl bg-gradient-to-r from-teal-50/60 to-emerald-50/40 border border-teal-100 dark:from-teal-950/20 dark:to-emerald-950/10 dark:border-teal-900/40 text-xs shadow-xs">
              <Sparkles className="w-4 h-4 text-[#00A896] flex-shrink-0 animate-pulse" />
              <div className="text-gray-700 dark:text-zinc-200 font-medium">
                Converts to <strong className="text-[#00A896] dark:text-teal-300 font-bold">{formatCurrency(convertedAmount, defaultCurrency)}</strong> at 
                <span className="font-mono ml-1">1 {currency} = {formatCurrency(exchangeRates[currency] || 1, 'NGN')}</span>
              </div>
            </div>
          )}

          {/* Screenshot Upload Block */}
          <div className="pt-1">
            <label className="text-xs font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider block mb-2">
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
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center gap-2 ${
                  isDragging 
                    ? 'border-[#00A896] bg-teal-50/40 dark:bg-teal-950/30' 
                    : 'border-gray-200 hover:border-[#00A896] dark:border-zinc-800 dark:hover:border-teal-700 bg-gray-50/40 dark:bg-zinc-900/20'
                }`}
              >
                <ImageIcon className="w-6 h-6 text-[#00A896] opacity-80" />
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Drag & drop receipt or <span className="text-[#00A896] underline font-bold">browse file</span>
                </span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">PNG, JPG up to 2MB</span>
              </div>
            ) : (
              <div id="receipt-preview-container" className="flex items-center justify-between p-3.5 rounded-2xl border border-teal-200 bg-teal-50/30 dark:bg-teal-950/20 dark:border-teal-900/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-teal-200 dark:border-teal-800 flex-shrink-0 shadow-xs">
                    <img referrerPolicy="no-referrer" src={receiptBase64} alt="Receipt preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate max-w-[160px]">
                      {receiptName || 'receipt_uploaded.png'}
                    </p>
                    <span className="text-[11px] text-[#00A896] dark:text-teal-400 font-semibold flex items-center gap-1 mt-0.5">
                      <FileCheck className="w-3.5 h-3.5" /> Receipt Attached
                    </span>
                  </div>
                </div>
                <button
                  id="remove-receipt-button"
                  type="button"
                  onClick={clearReceipt}
                  className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="calculator-copy-all-button"
              type="button"
              disabled={numericAmount <= 0}
              onClick={handleCopyAll}
              className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                numericAmount > 0
                  ? 'border-gray-300 hover:bg-gray-100 text-[#0E2A47] dark:border-zinc-700 dark:hover:bg-zinc-900 dark:text-zinc-200 shadow-xs'
                  : 'border-gray-200 text-gray-300 dark:border-zinc-900 dark:text-zinc-700 cursor-not-allowed'
              }`}
            >
              {copiedAll ? <Check className="w-4 h-4 text-[#00A896]" /> : <Copy className="w-4 h-4" />}
              <span>Copy Summary</span>
            </button>
            <button
              id="calculator-save-button"
              type="button"
              disabled={numericAmount <= 0}
              onClick={handleSave}
              className={`py-3 px-4 rounded-2xl text-xs font-black text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                numericAmount > 0
                  ? 'bg-gradient-to-r from-[#0E2A47] to-[#00A896] hover:opacity-95 shadow-teal-500/10'
                  : 'bg-gray-200 dark:bg-zinc-900 text-gray-400 dark:text-zinc-700 cursor-not-allowed shadow-none'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Save to Buckets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Calculation Display Area */}
      <div className="lg:col-span-7 space-y-4">
        <div id="calculator-results-card" className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-zinc-900 pb-4">
            <div>
              <h3 className="font-black text-[#0E2A47] dark:text-zinc-50 text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#00A896]" />
                Real-Time Split Distribution
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Instant distribution rule breakdown across your active money buckets.
              </p>
            </div>

            {numericAmount > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 text-right">
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 block uppercase">Total Split Value</span>
                <span className="text-sm font-black text-[#00A896] dark:text-teal-300">
                  <AnimatedNumber value={convertedAmount} currency={defaultCurrency} />
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {splits.length === 0 ? (
              <div className="text-center py-14 text-gray-400 dark:text-zinc-500 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-[#00A896] opacity-60">
                  <Layers className="w-7 h-7" />
                </div>
                <p className="text-base font-bold text-[#0E2A47] dark:text-zinc-200">Ready for Payment Allocation</p>
                <p className="text-xs max-w-xs mx-auto text-gray-500 dark:text-zinc-400">
                  Enter an income payment on the left to see the breakdown calculated live across your buckets.
                </p>
              </div>
            ) : (
              splits.map((split, idx) => {
                const originalBucket = buckets.find((b) => b.id === split.bucketId);
                const currentBalance = originalBucket ? originalBucket.balance : 0;
                
                return (
                  <div key={split.bucketId} className="p-4 rounded-2xl bg-gray-50/60 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/80 hover:border-teal-200 dark:hover:border-teal-900/60 transition-all space-y-3">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getThemeColorClass(split.color)} shadow-xs`} />
                        <span className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate">
                          {split.bucketName}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0 ${getThemePillClass(split.color)}`}>
                          {split.percentage}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-base font-black text-[#0E2A47] dark:text-zinc-50">
                          <AnimatedNumber value={split.amount} currency={defaultCurrency} />
                        </span>
                        
                        <button
                          id={`copy-amount-btn-${split.bucketId}`}
                          onClick={() => handleCopyAmount(split.amount, idx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
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

                    {/* Split Percentage Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getThemeColorClass(split.color)} transition-all duration-500 ease-out`}
                        style={{ width: `${Math.min(split.percentage, 100)}%` }}
                      />
                    </div>

                    {/* Progress indicators */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-zinc-400 gap-2 pt-0.5">
                      <span className="font-medium flex items-center gap-1">
                        <span className="text-gray-400">Destination:</span> 
                        <strong className="text-gray-700 dark:text-zinc-300 font-semibold">{split.destinationAccount}</strong>
                      </span>
                      <span className="font-medium">
                        Current Balance:{' '}
                        <strong className={currentBalance >= 0 ? 'text-[#00A896]' : 'text-rose-500'}>
                          <AnimatedNumber value={currentBalance} currency={defaultCurrency} />
                        </strong>
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
