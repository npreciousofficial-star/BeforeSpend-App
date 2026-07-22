import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../lib/utils';
import { Target, TrendingUp, Info, HelpCircle, DollarSign, Percent, Calendar } from 'lucide-react';

interface FinanceCalculatorsProps {
  currency: string;
}

export function FinanceCalculators({ currency }: FinanceCalculatorsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'savings' | 'loan'>('savings');

  // Savings Calculator States
  const [initialAmount, setInitialAmount] = useState<number>(100000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(15000);
  const [interestRate, setInterestRate] = useState<number>(12); // % APY
  const [years, setYears] = useState<number>(5);

  // Loan Calculator States
  const [loanPrincipal, setLoanPrincipal] = useState<number>(1500000);
  const [loanApr, setLoanApr] = useState<number>(18);
  const [loanTenureMonths, setLoanTenureMonths] = useState<number>(24);

  // 1. Savings / Compound Interest Growth Calculation
  const savingsResult = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = years * 12;
    let totalValue = initialAmount;
    let totalInvested = initialAmount;

    for (let i = 0; i < totalMonths; i++) {
      totalValue = totalValue * (1 + monthlyRate) + monthlyContribution;
      totalInvested += monthlyContribution;
    }

    const interestEarned = Math.max(0, totalValue - totalInvested);

    return {
      totalValue,
      totalInvested,
      interestEarned,
    };
  }, [initialAmount, monthlyContribution, interestRate, years]);

  // 2. Loan Amortization / EMI Calculation
  const loanResult = useMemo(() => {
    const monthlyRate = loanApr / 100 / 12;
    const n = loanTenureMonths;
    const P = loanPrincipal;

    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = P / n;
    } else {
      monthlyPayment = (P * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    }

    const totalRepayment = monthlyPayment * n;
    const totalInterest = Math.max(0, totalRepayment - P);

    return {
      monthlyPayment,
      totalRepayment,
      totalInterest,
    };
  }, [loanPrincipal, loanApr, loanTenureMonths]);

  return (
    <div className="p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-5">
      
      {/* Header and subtabs */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-gray-150 dark:border-zinc-900">
        <div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-zinc-50 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-500" />
            Money Calculators
          </h3>
          <p className="text-[10px] text-gray-400">Estimate savings growth and calculate loan repayments easily.</p>
        </div>
        
        {/* Toggle buttons */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-xl max-w-fit self-end sm:self-auto">
          <button
            onClick={() => setActiveSubTab('savings')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'savings'
                ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
            }`}
          >
            Savings Planner
          </button>
          <button
            onClick={() => setActiveSubTab('loan')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'loan'
                ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
            }`}
          >
            Loan Amortization
          </button>
        </div>
      </div>

      {/* CALCULATOR 1: SAVINGS PLANNER */}
      {activeSubTab === 'savings' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Controls column */}
          <div className="md:col-span-7 space-y-4">
            {/* Input 1: Initial savings */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-500 dark:text-zinc-400">Initial Deposit</span>
                <span className="font-extrabold text-gray-900 dark:text-zinc-200">{formatCurrency(initialAmount, currency)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000000"
                step="50000"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>{formatCurrency(0, currency)}</span>
                <span>{formatCurrency(5000000, currency)}</span>
              </div>
            </div>

            {/* Input 2: Monthly contributions */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-500 dark:text-zinc-400">Monthly Contribution</span>
                <span className="font-extrabold text-gray-900 dark:text-zinc-200">{formatCurrency(monthlyContribution, currency)} / mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="500000"
                step="5000"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>{formatCurrency(0, currency)}</span>
                <span>{formatCurrency(500000, currency)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Input 3: Interest Rate */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400">APY Interest (%)</label>
                <div className="relative rounded-lg border border-gray-250 dark:border-zinc-800 focus-within:border-emerald-500 flex items-center bg-gray-50/50 dark:bg-zinc-900/50">
                  <Percent className="w-3.5 h-3.5 text-gray-400 ml-2.5 flex-shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-transparent border-none py-1.5 px-2 text-xs font-bold text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Input 4: Years */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400">Duration (Years)</label>
                <div className="relative rounded-lg border border-gray-250 dark:border-zinc-800 focus-within:border-emerald-500 flex items-center bg-gray-50/50 dark:bg-zinc-900/50">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 ml-2.5 flex-shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={years}
                    onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent border-none py-1.5 px-2 text-xs font-bold text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="md:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Estimated Future Value</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block tracking-tight">
                {formatCurrency(savingsResult.totalValue, currency)}
              </span>
              <p className="text-[10px] text-gray-400 leading-tight pt-1">Assuming compounding monthly at an annual interest yield of {interestRate}%.</p>
            </div>

            <div className="border-t border-gray-200 dark:border-zinc-800 pt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">Total Invested</span>
                <span className="font-extrabold text-gray-800 dark:text-zinc-200">{formatCurrency(savingsResult.totalInvested, currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">Compound Interest Earned</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(savingsResult.interestEarned, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 2: LOAN AMORTIZATION */}
      {activeSubTab === 'loan' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Controls column */}
          <div className="md:col-span-7 space-y-4">
            {/* Input 1: Loan Principal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-500 dark:text-zinc-400">Loan Principal</span>
                <span className="font-extrabold text-gray-900 dark:text-zinc-200">{formatCurrency(loanPrincipal, currency)}</span>
              </div>
              <input
                type="range"
                min="50000"
                max="10000000"
                step="50000"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>{formatCurrency(50000, currency)}</span>
                <span>{formatCurrency(10000000, currency)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Input 2: APR interest */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400">Annual Interest (APR %)</label>
                <div className="relative rounded-lg border border-gray-250 dark:border-zinc-800 focus-within:border-emerald-500 flex items-center bg-gray-50/50 dark:bg-zinc-900/50">
                  <Percent className="w-3.5 h-3.5 text-gray-400 ml-2.5 flex-shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={loanApr}
                    onChange={(e) => setLoanApr(Math.max(0.1, Number(e.target.value)))}
                    className="w-full bg-transparent border-none py-1.5 px-2 text-xs font-bold text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Input 3: Tenure Months */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400">Tenure (Months)</label>
                <div className="relative rounded-lg border border-gray-250 dark:border-zinc-800 focus-within:border-emerald-500 flex items-center bg-gray-50/50 dark:bg-zinc-900/50">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 ml-2.5 flex-shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={loanTenureMonths}
                    onChange={(e) => setLoanTenureMonths(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent border-none py-1.5 px-2 text-xs font-bold text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="md:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Estimated Monthly EMI</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block tracking-tight">
                {formatCurrency(loanResult.monthlyPayment, currency)}
              </span>
              <p className="text-[10px] text-gray-400 leading-tight pt-1">Monthly repayment obligation matching principal, APR, and repayment term.</p>
            </div>

            <div className="border-t border-gray-200 dark:border-zinc-800 pt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">Principal Loan</span>
                <span className="font-extrabold text-gray-800 dark:text-zinc-200">{formatCurrency(loanPrincipal, currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">Total Interest Payable</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(loanResult.totalInterest, currency)}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-1.5 flex justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-zinc-300">Total Paid Amount</span>
                <span className="font-black text-gray-900 dark:text-zinc-50">{formatCurrency(loanResult.totalRepayment, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
