import React, { useState } from 'react';
import { Bucket, Transaction, StatementRow } from '../types';
import { formatCurrency, generateId } from '../lib/utils';
import { Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck, ArrowDownRight, ArrowUpRight, X, RefreshCw, Table, SlidersHorizontal, ArrowRight } from 'lucide-react';

interface StatementParserModalProps {
  buckets: Bucket[];
  currency: string;
  existingTransactions: Transaction[];
  onBatchImport: (newTransactions: Transaction[], totalSplitIncomeAmount?: number) => void;
  onClose: () => void;
}

interface ColumnMap {
  dateCol: number;
  descCol: number;
  amountCol: number;
  directionCol: number;
  bucketCol: number;
}

export function StatementParserModal({
  buckets,
  currency,
  existingTransactions,
  onBatchImport,
  onClose,
}: StatementParserModalProps) {
  const [step, setStep] = useState<'UPLOAD' | 'MAP_COLUMNS' | 'PREVIEW'>('UPLOAD');
  const [fileName, setFileName] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRawRows, setCsvRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    dateCol: 0,
    descCol: 1,
    amountCol: 2,
    directionCol: -1,
    bucketCol: -1,
  });

  const [parsedRows, setParsedRows] = useState<StatementRow[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'NEW' | 'DUPLICATES'>('ALL');

  // Simple string hash for deduplication matching
  const generateDedupHash = (dateStr: string, amountNum: number, descStr: string) => {
    const raw = `${dateStr.trim().toLowerCase()}_${amountNum.toFixed(2)}_${descStr.trim().toLowerCase()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  };

  // 1. Handle File Reading
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseRawCsvText(text);
    };
    reader.readAsText(file);
  };

  // Parse raw text into lines and tokens
  const parseRawCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    const rawGrid: string[][] = lines.map(line => {
      return line.split(/,|\t|\|/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    });

    const headers = rawGrid[0];
    const dataRows = rawGrid.slice(1);

    setCsvHeaders(headers);
    setCsvRawRows(dataRows);

    // Auto-detect columns intelligently
    const newMap: ColumnMap = {
      dateCol: 0,
      descCol: 1,
      amountCol: 2,
      directionCol: -1,
      bucketCol: -1,
    };

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (lower.includes('date') || lower.includes('time')) newMap.dateCol = idx;
      else if (lower.includes('desc') || lower.includes('memo') || lower.includes('narration') || lower.includes('detail') || lower.includes('payee')) newMap.descCol = idx;
      else if (lower.includes('amount') || lower.includes('value') || lower.includes('sum')) newMap.amountCol = idx;
      else if (lower.includes('type') || lower.includes('dr/cr') || lower.includes('direction') || lower.includes('kind')) newMap.directionCol = idx;
      else if (lower.includes('category') || lower.includes('bucket') || lower.includes('tag')) newMap.bucketCol = idx;
    });

    setColumnMap(newMap);
    setStep('MAP_COLUMNS');
  };

  // 2. Process Data Grid using selected Column Mapping
  const applyColumnMappingAndProcess = () => {
    const existingHashes = new Set(
      existingTransactions.map(t => t.deduplicationHash).filter(Boolean)
    );

    const rows: StatementRow[] = [];

    csvRawRows.forEach(parts => {
      if (parts.length === 0) return;

      const dateStr = parts[columnMap.dateCol] || new Date().toISOString().split('T')[0];
      const descStr = parts[columnMap.descCol] || 'CSV Transaction';
      
      const rawAmountStr = (parts[columnMap.amountCol] || '0').replace(/[^0-9.-]/g, '');
      const rawVal = parseFloat(rawAmountStr) || 0;
      if (rawVal === 0 && parts.length < 2) return;

      let direction: 'CREDIT' | 'DEBIT' = 'DEBIT';
      let amountNum = Math.abs(rawVal);

      // Explicit direction column check
      if (columnMap.directionCol !== -1 && parts[columnMap.directionCol]) {
        const dirVal = parts[columnMap.directionCol].toLowerCase();
        if (dirVal.includes('credit') || dirVal.includes('cr') || dirVal.includes('inflow') || dirVal.includes('deposit')) {
          direction = 'CREDIT';
        } else {
          direction = 'DEBIT';
        }
      } else {
        // Fallback to sign or keyword in description
        if (rawVal < 0) {
          direction = 'DEBIT';
        } else {
          const lowerDesc = descStr.toLowerCase();
          if (lowerDesc.includes('deposit') || lowerDesc.includes('credit') || lowerDesc.includes('received') || lowerDesc.includes('inflow') || lowerDesc.includes('salary')) {
            direction = 'CREDIT';
          } else {
            direction = 'DEBIT';
          }
        }
      }

      const hash = generateDedupHash(dateStr, amountNum, descStr);
      const isDuplicate = existingHashes.has(hash);

      // Bucket matching
      let defaultBucketId = buckets.length > 0 ? buckets[0].id : undefined;
      
      // Explicit bucket column check
      if (columnMap.bucketCol !== -1 && parts[columnMap.bucketCol]) {
        const catName = parts[columnMap.bucketCol].toLowerCase();
        const found = buckets.find(b => b.name.toLowerCase().includes(catName) || catName.includes(b.name.toLowerCase()));
        if (found) defaultBucketId = found.id;
      }

      if (!defaultBucketId) {
        const descLower = descStr.toLowerCase();
        const matchedBucket = buckets.find(b => 
          descLower.includes(b.name.toLowerCase()) || 
          (b.destinationAccount && descLower.includes(b.destinationAccount.toLowerCase()))
        );
        if (matchedBucket) defaultBucketId = matchedBucket.id;
      }

      rows.push({
        id: generateId('st-row'),
        date: dateStr,
        description: descStr,
        amount: amountNum,
        direction,
        deduplicationHash: hash,
        isDuplicate,
        selectedBucketId: defaultBucketId,
        status: isDuplicate ? 'SKIPPED' : 'PENDING'
      });
    });

    setParsedRows(rows);
    setStep('PREVIEW');
  };

  const loadDemoData = () => {
    const demoCsv = `Date,Description,Amount,Type,Category
2026-07-20,Client Invoice Payment - TechCo Inflow,250000,Credit,Operating
2026-07-19,AWS Cloud Servers Subscription,14500,Debit,Operating
2026-07-18,OPay Account Transfer - Living Expenses,50000,Debit,Salary & Personal
2026-07-17,Supermarket Groceries & Provisions,32000,Debit,Living Expenses
2026-07-16,Freelance UI Design Milestone Payment,180000,Credit,Investments`;
    parseRawCsvText(demoCsv);
  };

  const toggleRowStatus = (id: string) => {
    setParsedRows(prev =>
      prev.map(r => {
        if (r.id === id) {
          const nextStatus = r.status === 'PENDING' ? 'SKIPPED' : 'PENDING';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const updateRowBucket = (id: string, bucketId: string) => {
    setParsedRows(prev =>
      prev.map(r => r.id === id ? { ...r, selectedBucketId: bucketId } : r)
    );
  };

  const filteredRows = parsedRows.filter(r => {
    if (selectedFilter === 'NEW') return !r.isDuplicate;
    if (selectedFilter === 'DUPLICATES') return r.isDuplicate;
    return true;
  });

  const pendingRows = parsedRows.filter(r => r.status === 'PENDING');
  const duplicatesCount = parsedRows.filter(r => r.isDuplicate).length;
  const newCount = parsedRows.filter(r => !r.isDuplicate).length;

  const totalPendingCredits = pendingRows
    .filter(r => r.direction === 'CREDIT')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleConfirmImport = () => {
    const newTxns: Transaction[] = pendingRows.map(row => {
      const bName = buckets.find(b => b.id === row.selectedBucketId)?.name || 'General Inflow';
      return {
        id: generateId('txn'),
        bucketId: row.selectedBucketId || (buckets[0]?.id || null),
        bucketName: bName,
        type: row.direction === 'CREDIT' ? 'INCOME_SPLIT' : 'EXPENSE',
        amount: row.amount,
        direction: row.direction,
        description: `Statement Import: ${row.description}`,
        sourceType: 'CSV_IMPORT',
        deduplicationHash: row.deduplicationHash,
        createdAt: new Date(row.date).toISOString()
      };
    });

    onBatchImport(newTxns, totalPendingCredits > 0 ? totalPendingCredits : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-850 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-zinc-50 tracking-tight leading-snug">
                CSV Bank Statement Import
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400">
                Map columns and import bank statement transactions seamlessly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1.5 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: FILE UPLOAD */}
        {step === 'UPLOAD' && (
          <div className="py-8 sm:py-12 px-4 sm:px-6 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl text-center space-y-4 bg-slate-50/50 dark:bg-zinc-950/40">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <Upload className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-zinc-200 text-sm">
                Drop or select your raw bank CSV file
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                Supports standard CSV statement exports from any bank or finance provider.
              </p>
            </div>
            <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors w-full sm:w-auto">
              <FileText className="w-4 h-4" /> Select CSV File
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <div className="pt-2">
              <button
                type="button"
                onClick={loadDemoData}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Or click here to load sample demo CSV statement data
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 'MAP_COLUMNS' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Map CSV Columns to Transaction Fields ({fileName || 'Statement.csv'})
              </div>
              <span className="text-[10px] bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full font-mono">
                {csvRawRows.length} Rows Detected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Date Column */}
              <div className="p-3 border border-gray-200 dark:border-zinc-800 rounded-xl space-y-1">
                <label className="font-bold text-gray-700 dark:text-zinc-300 block">
                  Date Column <span className="text-rose-500">*</span>
                </label>
                <select
                  value={columnMap.dateCol}
                  onChange={(e) => setColumnMap({ ...columnMap, dateCol: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-lg text-xs font-medium"
                >
                  {csvHeaders.map((h, i) => (
                    <option key={i} value={i}>Column {i + 1}: {h}</option>
                  ))}
                </select>
              </div>

              {/* Description Column */}
              <div className="p-3 border border-gray-200 dark:border-zinc-800 rounded-xl space-y-1">
                <label className="font-bold text-gray-700 dark:text-zinc-300 block">
                  Description / Narration <span className="text-rose-500">*</span>
                </label>
                <select
                  value={columnMap.descCol}
                  onChange={(e) => setColumnMap({ ...columnMap, descCol: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-lg text-xs font-medium"
                >
                  {csvHeaders.map((h, i) => (
                    <option key={i} value={i}>Column {i + 1}: {h}</option>
                  ))}
                </select>
              </div>

              {/* Amount Column */}
              <div className="p-3 border border-gray-200 dark:border-zinc-800 rounded-xl space-y-1">
                <label className="font-bold text-gray-700 dark:text-zinc-300 block">
                  Amount Column <span className="text-rose-500">*</span>
                </label>
                <select
                  value={columnMap.amountCol}
                  onChange={(e) => setColumnMap({ ...columnMap, amountCol: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-lg text-xs font-medium"
                >
                  {csvHeaders.map((h, i) => (
                    <option key={i} value={i}>Column {i + 1}: {h}</option>
                  ))}
                </select>
              </div>

              {/* Direction Column (Optional) */}
              <div className="p-3 border border-gray-200 dark:border-zinc-800 rounded-xl space-y-1">
                <label className="font-bold text-gray-700 dark:text-zinc-300 block">
                  Type / Direction Column <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={columnMap.directionCol}
                  onChange={(e) => setColumnMap({ ...columnMap, directionCol: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-lg text-xs font-medium"
                >
                  <option value={-1}>None (Auto-detect from sign / keywords)</option>
                  {csvHeaders.map((h, i) => (
                    <option key={i} value={i}>Column {i + 1}: {h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Data Sample Preview */}
            <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-3 bg-slate-50 dark:bg-zinc-950/50 space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Sample Row Mapping Preview</span>
              {csvRawRows[0] && (
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
                    <span className="text-[9px] text-gray-400 block uppercase">Mapped Date</span>
                    <span className="font-bold text-gray-800 dark:text-zinc-200">{csvRawRows[0][columnMap.dateCol] || 'N/A'}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
                    <span className="text-[9px] text-gray-400 block uppercase">Mapped Description</span>
                    <span className="font-bold text-gray-800 dark:text-zinc-200 truncate block">{csvRawRows[0][columnMap.descCol] || 'N/A'}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
                    <span className="text-[9px] text-gray-400 block uppercase">Mapped Amount</span>
                    <span className="font-bold text-emerald-600">{csvRawRows[0][columnMap.amountCol] || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep('UPLOAD')}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Back to Upload
              </button>
              <button
                onClick={applyColumnMappingAndProcess}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                Continue to Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: STAGING & PREVIEW */}
        {step === 'PREVIEW' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
            {/* Stats Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-shrink-0">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                    New Transactions
                  </span>
                  <span className="block text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300">
                    {newCount}
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                    Duplicates Match
                  </span>
                  <span className="block text-base sm:text-lg font-black text-amber-800 dark:text-amber-300">
                    {duplicatesCount}
                  </span>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400">
                    Ready to Import
                  </span>
                  <span className="block text-base sm:text-lg font-black text-blue-800 dark:text-blue-300">
                    {pendingRows.length}
                  </span>
                </div>
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
            </div>

            {/* Filter Pills & Reset */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold overflow-x-auto">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    selectedFilter === 'ALL'
                      ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 shadow-2xs'
                      : 'text-gray-500 dark:text-zinc-400'
                  }`}
                >
                  All ({parsedRows.length})
                </button>
                <button
                  onClick={() => setSelectedFilter('NEW')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    selectedFilter === 'NEW'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-gray-500 dark:text-zinc-400'
                  }`}
                >
                  New ({newCount})
                </button>
                <button
                  onClick={() => setSelectedFilter('DUPLICATES')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    selectedFilter === 'DUPLICATES'
                      ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                      : 'text-gray-500 dark:text-zinc-400'
                  }`}
                >
                  Duplicates ({duplicatesCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold self-end sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-upload File
              </button>
            </div>

            {/* Staging List Container */}
            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-zinc-800 rounded-2xl">
              {/* MOBILE CARDS VIEW */}
              <div className="block sm:hidden divide-y divide-gray-100 dark:divide-zinc-850">
                {filteredRows.map(row => (
                  <div
                    key={row.id}
                    className={`p-3 space-y-2 transition-colors ${
                      row.status === 'SKIPPED'
                        ? 'opacity-50 bg-gray-50/50 dark:bg-zinc-950/20'
                        : row.isDuplicate
                        ? 'bg-amber-50/30 dark:bg-amber-950/10'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={row.status === 'PENDING'}
                          onChange={() => toggleRowStatus(row.id)}
                          className="mt-1 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-900 dark:text-zinc-100 leading-snug">
                            {row.description}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {row.date}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-mono font-bold text-xs block text-gray-900 dark:text-zinc-100">
                          {formatCurrency(row.amount, currency)}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                          row.direction === 'CREDIT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400'
                        }`}>
                          {row.direction}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 flex-shrink-0">
                        Bucket:
                      </label>
                      <select
                        value={row.selectedBucketId || ''}
                        onChange={(e) => updateRowBucket(row.id, e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold text-gray-800 dark:text-zinc-200"
                      >
                        {buckets.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-zinc-950 text-gray-400 uppercase text-[9px] font-bold sticky top-0 border-b border-gray-200 dark:border-zinc-850">
                    <tr>
                      <th className="p-3">Import</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3">Target Bucket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                    {filteredRows.map(row => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          row.status === 'SKIPPED'
                            ? 'opacity-40 bg-gray-50/50 dark:bg-zinc-950/20'
                            : row.isDuplicate
                            ? 'bg-amber-50/30 dark:bg-amber-950/10'
                            : 'hover:bg-slate-50 dark:hover:bg-zinc-850/50'
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={row.status === 'PENDING'}
                            onChange={() => toggleRowStatus(row.id)}
                            className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                          />
                        </td>
                        <td className="p-3 text-gray-500 font-mono whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="p-3 font-semibold text-gray-800 dark:text-zinc-200 max-w-[200px] truncate">
                          {row.description}
                          {row.isDuplicate && (
                            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-md">
                              Duplicate
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            row.direction === 'CREDIT'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>
                            {row.direction === 'CREDIT' ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {row.direction}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                          {formatCurrency(row.amount, currency)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <select
                            value={row.selectedBucketId || ''}
                            onChange={(e) => updateRowBucket(row.id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-medium"
                          >
                            {buckets.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-2 sm:pt-3 border-t border-gray-100 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs text-gray-400 font-medium text-center sm:text-left">
                {pendingRows.length} transactions selected for ledger entry.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-zinc-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={pendingRows.length === 0}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Batch Import to Ledger
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
