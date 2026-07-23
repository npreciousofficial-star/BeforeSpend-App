/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Bucket, PaymentEntry, Expense } from '../types';
import { formatCurrency } from '../lib/utils';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Award, Download, FileCheck, Loader2, Zap, Gauge, Activity } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface FinanceChartsProps {
  buckets: Bucket[];
  history: PaymentEntry[];
  expenses: Expense[];
  currency: string;
}

export function FinanceCharts({ buckets, history, expenses, currency }: FinanceChartsProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfReportRef = useRef<HTMLDivElement>(null);

  // 1. Calculate General Metrics
  const totalInBuckets = buckets.reduce((sum, b) => sum + b.balance, 0);
  const totalReceived = history.reduce((sum, h) => sum + h.convertedAmount, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Download PDF Summary Handler
  const handleDownloadPdf = async () => {
    if (!pdfReportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = pdfReportRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const allElems = clonedDoc.querySelectorAll('*');
          allElems.forEach((el) => {
            const htmlEl = el as HTMLElement;
            try {
              const style = window.getComputedStyle(htmlEl);
              const isModernColor = (val: string) => val && (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix') || val.includes('light-dark'));

              if (isModernColor(style.color)) {
                htmlEl.style.color = '#0E2A47';
              }
              if (isModernColor(style.backgroundColor)) {
                htmlEl.style.backgroundColor = '#FFFFFF';
              }
              if (isModernColor(style.backgroundImage)) {
                htmlEl.style.backgroundImage = 'none';
                htmlEl.style.backgroundColor = '#0E2A47';
              }
              if (isModernColor(style.borderColor)) {
                htmlEl.style.borderColor = '#E5E7EB';
              }
              if (isModernColor(style.borderTopColor)) {
                htmlEl.style.borderTopColor = '#00A896';
              }
            } catch (e) {
              // ignore computed style fallback
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      pdf.save(`BeforeSpend_Financial_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Prepare data for Donut Chart (Bucket balance breakdown)
  const positiveBuckets = buckets.filter((b) => b.balance > 0);
  const totalPositiveBalance = positiveBuckets.reduce((sum, b) => sum + b.balance, 0);

  // SVG Donut Chart Calculation helper
  let cumulativePercent = 0;
  const donutSlices = positiveBuckets.map((bucket) => {
    const percent = totalPositiveBalance > 0 ? (bucket.balance / totalPositiveBalance) : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    
    return {
      bucket,
      percent,
      startPercent,
    };
  });

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
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

  const getThemeColorHex = (colorName: string) => {
    switch (colorName) {
      case 'emerald': return '#10b981';
      case 'blue': return '#3b82f6';
      case 'amber': return '#f59e0b';
      case 'red': return '#f43f5e';
      case 'purple': return '#a855f7';
      case 'teal': return '#14b8a6';
      case 'indigo': return '#6366f1';
      case 'pink': return '#ec4899';
      default: return '#6b7280';
    }
  };

  // 3. Prepare monthly trends
  // Let's list the last 6 months splits vs expenses
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  // Create 6 months range up to current month
  const monthlyData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - idx);
    const monthIndex = d.getMonth();
    const year = d.getFullYear();
    
    // Sum payments saved this month
    const splitSum = history
      .filter((h) => {
        const hDate = new Date(h.date);
        return hDate.getMonth() === monthIndex && hDate.getFullYear() === year;
      })
      .reduce((sum, h) => sum + h.convertedAmount, 0);

    // Sum expenses logged this month
    const expenseSum = expenses
      .filter((e) => {
        const eDate = new Date(e.date);
        return eDate.getMonth() === monthIndex && eDate.getFullYear() === year;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      name: `${months[monthIndex]}`,
      splits: splitSum,
      expenses: expenseSum,
    };
  }).reverse();

  // Find max value to scale bar heights
  const maxVal = Math.max(...monthlyData.map(d => Math.max(d.splits, d.expenses, 10000)));

  // 4. Calculate Month-over-Month Savings Velocity & Trend Line
  const velocityData = monthlyData.map((d) => ({
    name: d.name,
    splits: d.splits,
    expenses: d.expenses,
    netSavings: d.splits - d.expenses,
  }));

  const currentMonthNet = velocityData.length > 0 ? velocityData[velocityData.length - 1].netSavings : 0;
  const previousMonthNet = velocityData.length > 1 ? velocityData[velocityData.length - 2].netSavings : 0;
  const velocityDiff = currentMonthNet - previousMonthNet;
  const velocityChangePercent = previousMonthNet !== 0 
    ? ((velocityDiff) / Math.abs(previousMonthNet)) * 100 
    : (currentMonthNet > 0 ? 100 : 0);

  // SVG Trend Line calculation
  const netValues = velocityData.map(v => v.netSavings);
  const maxNet = Math.max(...netValues, 1000);
  const minNet = Math.min(...netValues, 0);
  const netRange = (maxNet - minNet) || 1;

  const chartWidth = 500;
  const chartHeight = 140;
  const paddingX = 35;
  const paddingY = 25;

  const points = velocityData.map((d, i) => {
    const x = paddingX + (i * (chartWidth - 2 * paddingX)) / Math.max(velocityData.length - 1, 1);
    const normalizedY = (d.netSavings - minNet) / netRange;
    const y = chartHeight - paddingY - (normalizedY * (chartHeight - 2 * paddingY));
    return { x, y, name: d.name, netSavings: d.netSavings };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '')
    : '';

  const zeroY = chartHeight - paddingY - (((0 - minNet) / netRange) * (chartHeight - 2 * paddingY));

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${zeroY.toFixed(1)} L ${points[0].x.toFixed(1)} ${zeroY.toFixed(1)} Z`
    : '';

  return (
    <div id="finance-analytics-dashboard" className="space-y-6">
      
      {/* Top Banner with PDF Report Generation Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-200" />
            Financial Analytics & Statements
          </h2>
          <p className="text-xs text-emerald-100 max-w-xl">
            Export a clean, branded PDF financial summary of your income allocation, bucket balances, and 6-month spending trends.
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 transition font-bold text-xs flex items-center justify-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download PDF Summary</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Major Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Net Wealth (In Buckets)
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {formatCurrency(totalInBuckets, currency)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Lifetime Freelance Splits
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
              {formatCurrency(totalReceived, currency)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Lifetime Logged Expenses
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut Chart: Bucket Distribution */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-50 uppercase tracking-wider">
            Current Net Allocation
          </h3>
          
          {totalPositiveBalance === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              Save some payments to see your balance breakdown chart.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* SVG Donut render */}
              <div className="relative w-40 h-40">
                <svg viewBox="-1.2 -1.2 2.4 2.4" className="-rotate-90 w-full h-full">
                  {donutSlices.map((slice, index) => {
                    const [startX, startY] = getCoordinatesForPercent(slice.startPercent);
                    const [endX, endY] = getCoordinatesForPercent(slice.startPercent + slice.percent);
                    const largeArcFlag = slice.percent > 0.5 ? 1 : 0;
                    
                    const pathData = [
                      `M ${startX} ${startY}`,
                      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                      `L 0 0`,
                    ].join(' ');

                    return (
                      <path
                        key={slice.bucket.id}
                        d={pathData}
                        fill={getThemeColorHex(slice.bucket.color)}
                        stroke="#ffffff"
                        strokeWidth="0.02"
                        className="dark:stroke-zinc-950"
                      />
                    );
                  })}
                  {/* Inner Cutout to turn pie chart into a donut chart */}
                  <circle cx="0" cy="0" r="0.6" fill="#ffffff" className="dark:fill-zinc-950" />
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Sum</span>
                  <span className="text-sm font-black text-gray-800 dark:text-zinc-200">
                    {formatCurrency(totalInBuckets, currency)}
                  </span>
                </div>
              </div>

              {/* Legends */}
              <div className="flex-1 space-y-2.5 w-full">
                {donutSlices.map((slice) => (
                  <div key={slice.bucket.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${getThemeColorClass(slice.bucket.color)}`} />
                      <span className="font-semibold text-gray-700 dark:text-zinc-300">{slice.bucket.name}</span>
                    </div>
                    <div className="font-bold">
                      {formatCurrency(slice.bucket.balance, currency)}
                      <span className="text-[10px] text-gray-400 font-medium ml-1">({(slice.percent * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart: splits vs expenses (historical) */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-50 uppercase tracking-wider">
              6-Month Income vs Expenses
            </h3>
            <div className="flex gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Splits
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          {/* Bar Charts Render */}
          <div className="space-y-4">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 border-b border-gray-150 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/30 p-3 sm:p-4 rounded-xl">
              {monthlyData.map((data, index) => {
                const splitsPct = data.splits > 0 ? Math.max(10, (data.splits / maxVal) * 100) : 0;
                const expensePct = data.expenses > 0 ? Math.max(10, (data.expenses / maxVal) * 100) : 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="flex gap-1 sm:gap-2 items-end justify-center w-full h-[82%]">
                      {/* Splits Bar */}
                      <div 
                        style={{ height: `${splitsPct}%` }}
                        className="w-3.5 sm:w-6 bg-[#00A896] dark:bg-teal-500 rounded-t-md shadow-xs transition-all duration-500 hover:opacity-90 cursor-pointer"
                        title={`Splits: ${formatCurrency(data.splits, currency)}`}
                      />
                      {/* Expense Bar */}
                      <div 
                        style={{ height: `${expensePct}%` }}
                        className="w-3.5 sm:w-6 bg-rose-500 dark:bg-rose-600 rounded-t-md shadow-xs transition-all duration-500 hover:opacity-90 cursor-pointer"
                        title={`Expenses: ${formatCurrency(data.expenses, currency)}`}
                      />
                    </div>
                    {/* Month Label */}
                    <span className="text-[10px] sm:text-xs font-black text-[#0E2A47] dark:text-zinc-300">
                      {data.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 px-1 pt-1">
              <span>*Hover over bars to inspect monthly breakdown figures.</span>
              <span className="font-bold text-[#006654]">Peak Month Volume: {formatCurrency(maxVal, currency)}</span>
            </div>
          </div>
        </div>

        {/* Month-over-Month Net Savings Velocity & Trend Curve */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-150 dark:border-zinc-900">
            <div className="space-y-0.5">
              <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-sm flex items-center gap-2">
                <Gauge className="w-4 h-4 text-teal-500" /> Month-over-Month Net Savings Velocity
              </h3>
              <p className="text-xs text-gray-400">Track net trajectory (Inflow Splits minus Expenses) month over month.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg ${
                velocityChangePercent >= 0 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
              }`}>
                <Activity className="w-3.5 h-3.5" />
                {velocityChangePercent >= 0 ? '+' : ''}{velocityChangePercent.toFixed(1)}% Velocity
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SVG Trend Line Chart */}
            <div className="md:col-span-2 space-y-2">
              <div className="relative w-full h-40 bg-slate-50/70 dark:bg-zinc-900/40 rounded-xl p-3 border border-gray-150 dark:border-zinc-850 flex items-center justify-center">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Zero Guideline */}
                  <line 
                    x1={paddingX} 
                    y1={zeroY} 
                    x2={chartWidth - paddingX} 
                    y2={zeroY} 
                    stroke="currentColor" 
                    className="text-gray-300 dark:text-zinc-700" 
                    strokeDasharray="4 4" 
                    strokeWidth="1"
                  />

                  {/* Shaded Fill Area */}
                  {areaD && <path d={areaD} fill="url(#savingsGradient)" />}

                  {/* Trend Curve Line */}
                  {pathD && <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Points & Labels */}
                  {points.map((p, idx) => (
                    <g key={idx} className="group/pt cursor-pointer">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="5" 
                        fill="#10b981" 
                        className="transition-transform group-hover/pt:scale-150 stroke-white dark:stroke-zinc-950 stroke-2" 
                      />
                      <text 
                        x={p.x} 
                        y={p.y - 10} 
                        textAnchor="middle" 
                        className="text-[9px] font-bold fill-gray-600 dark:fill-zinc-300 pointer-events-none"
                      >
                        {formatCurrency(p.netSavings, currency)}
                      </text>
                      <text 
                        x={p.x} 
                        y={chartHeight - 4} 
                        textAnchor="middle" 
                        className="text-[10px] font-bold fill-gray-400 pointer-events-none"
                      >
                        {p.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Velocity Summary Side Metrics */}
            <div className="space-y-3 flex flex-col justify-center bg-gray-50/50 dark:bg-zinc-900/30 p-4 rounded-xl border border-gray-150 dark:border-zinc-850">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Month Net Savings</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(currentMonthNet, currency)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Previous Month Net Savings</span>
                <p className="text-base font-bold text-gray-700 dark:text-zinc-300">{formatCurrency(previousMonthNet, currency)}</p>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 text-[11px] text-gray-500 dark:text-zinc-400">
                {velocityDiff >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Net savings increased by {formatCurrency(velocityDiff, currency)} this month.
                  </span>
                ) : (
                  <span className="text-rose-500 font-semibold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Net savings decreased by {formatCurrency(Math.abs(velocityDiff), currency)} this month.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Offscreen PDF Printable Report Template */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none z-[-50] overflow-hidden" aria-hidden="true">
        <div
          ref={pdfReportRef}
          style={{ width: '800px', backgroundColor: '#ffffff', color: '#0F172A', fontFamily: 'sans-serif' }}
          className="p-8 space-y-6"
        >
          {/* Branded Header Banner */}
          <div style={{ backgroundColor: '#0E2A47', color: '#ffffff' }} className="p-6 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <div className="text-2xl font-black tracking-tight text-white">
                Before<span style={{ color: '#00A896' }}>Spend</span> Statement
              </div>
              <p style={{ color: '#99F6E4' }} className="text-[10px] uppercase tracking-widest font-mono font-bold">
                Plan allocations before spending • Official Financial Summary
              </p>
            </div>
            <div style={{ backgroundColor: '#0A192F', borderColor: '#1E293B' }} className="text-right text-xs font-mono p-3 rounded-xl border">
              <div className="font-bold text-white">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style={{ color: '#94A3B8' }}>Base Currency: <strong className="text-white">{currency}</strong></div>
            </div>
          </div>

          {/* Executive Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div style={{ backgroundColor: '#F0FDF4', borderColor: '#00A896' }} className="p-4 border-l-4 border-y border-r rounded-2xl space-y-1">
              <span style={{ color: '#0E2A47' }} className="text-[10px] font-black uppercase tracking-wider block">Net Budgeted Assets</span>
              <div style={{ color: '#00A896' }} className="text-xl font-black">{formatCurrency(totalInBuckets, currency)}</div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', borderColor: '#0E2A47' }} className="p-4 border-l-4 border-y border-r rounded-2xl space-y-1">
              <span style={{ color: '#0E2A47' }} className="text-[10px] font-black uppercase tracking-wider block">Total Income Inflows</span>
              <div style={{ color: '#0E2A47' }} className="text-xl font-black">{formatCurrency(totalReceived, currency)}</div>
            </div>
            <div style={{ backgroundColor: '#FFF1F2', borderColor: '#F43F5E' }} className="p-4 border-l-4 border-y border-r rounded-2xl space-y-1">
              <span style={{ color: '#9F1239' }} className="text-[10px] font-black uppercase tracking-wider block">Total Logged Expenses</span>
              <div style={{ color: '#E11D48' }} className="text-xl font-black">{formatCurrency(totalSpent, currency)}</div>
            </div>
          </div>

          {/* Bucket Allocations Table */}
          <div className="space-y-2.5">
            <div style={{ borderColor: '#00A896' }} className="flex items-center justify-between border-b-2 pb-1.5">
              <h2 style={{ color: '#0E2A47' }} className="text-xs font-black uppercase tracking-wider">Bucket Balances & Allocations</h2>
              <span style={{ color: '#64748B' }} className="text-[10px] font-bold">{buckets.length} Active Categories</span>
            </div>
            <table style={{ borderColor: '#E2E8F0' }} className="w-full text-left text-xs border rounded-xl overflow-hidden">
              <thead style={{ backgroundColor: '#0E2A47', color: '#ffffff' }} className="font-bold">
                <tr>
                  <th className="p-3">Bucket Name</th>
                  <th className="p-3 text-center">Split Allocation</th>
                  <th className="p-3 text-right">Current Balance</th>
                  <th className="p-3">Target Bank Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buckets.map((b, idx) => (
                  <tr key={b.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}>
                    <td style={{ color: '#0E2A47' }} className="p-3 font-bold flex items-center gap-2">
                      <span style={{ backgroundColor: '#00A896' }} className="w-2.5 h-2.5 rounded-full inline-block" />
                      {b.name}
                    </td>
                    <td style={{ color: '#334155' }} className="p-3 text-center font-extrabold">{b.percentage}%</td>
                    <td style={{ color: '#00A896' }} className="p-3 text-right font-black">{formatCurrency(b.balance, currency)}</td>
                    <td style={{ color: '#475569' }} className="p-3 font-semibold">{b.destinationAccount || 'Default Bank'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 6-Month Trend Overview */}
          <div className="space-y-2.5">
            <div style={{ borderColor: '#0E2A47' }} className="flex items-center justify-between border-b-2 pb-1.5">
              <h2 style={{ color: '#0E2A47' }} className="text-xs font-black uppercase tracking-wider">Recent 6-Month Financial Velocity</h2>
              <span style={{ color: '#64748B' }} className="text-[10px] font-bold">Historical Trend</span>
            </div>
            <table style={{ borderColor: '#E2E8F0' }} className="w-full text-left text-xs border rounded-xl overflow-hidden">
              <thead style={{ backgroundColor: '#F1F5F9', color: '#0E2A47' }} className="font-extrabold border-b">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3 text-right">Inflow Splits</th>
                  <th className="p-3 text-right">Outflow Expenses</th>
                  <th className="p-3 text-right">Net Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyData.map((m, idx) => (
                  <tr key={m.name} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}>
                    <td style={{ color: '#1E293B' }} className="p-3 font-bold">{m.name}</td>
                    <td style={{ color: '#0E2A47' }} className="p-3 text-right font-semibold">{formatCurrency(m.splits, currency)}</td>
                    <td style={{ color: '#E11D48' }} className="p-3 text-right font-semibold">{formatCurrency(m.expenses, currency)}</td>
                    <td style={{ color: '#00A896' }} className="p-3 text-right font-black">{formatCurrency(m.splits - m.expenses, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Report Footer */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <div>Generated by BeforeSpend Financial Operating System • DirectPadi Ltd.</div>
            <div>Page 1 of 1</div>
          </div>
        </div>
      </div>

    </div>
  );
}
