import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Expense, Bucket } from '../types';
import { formatCurrency } from '../lib/utils';
import { LayoutGrid, PieChart as PieIcon, TrendingDown } from 'lucide-react';

interface ExpensePieChartProps {
  expenses: Expense[];
  buckets: Bucket[];
  currency: string;
}

const COLORS = [
  '#00A896', // brand teal
  '#0E2A47', // brand dark blue
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
];

export function ExpensePieChart({ expenses, buckets, currency }: ExpensePieChartProps) {
  // Aggregate expenses by bucket
  const aggregatedData = React.useMemo(() => {
    const dataMap: { [bucketId: string]: number } = {};
    
    expenses.forEach((exp) => {
      dataMap[exp.bucketId] = (dataMap[exp.bucketId] || 0) + exp.amount;
    });

    return Object.entries(dataMap)
      .map(([bucketId, amount]) => {
        const bucket = buckets.find((b) => b.id === bucketId);
        return {
          name: bucket ? bucket.name : 'Other',
          value: amount,
          percentage: 0, // calculated below
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, buckets]);

  const totalExpenseAmount = React.useMemo(() => {
    return aggregatedData.reduce((sum, item) => sum + item.value, 0);
  }, [aggregatedData]);

  // Add percentages
  const chartData = React.useMemo(() => {
    if (totalExpenseAmount === 0) return [];
    return aggregatedData.map((item) => ({
      ...item,
      percentage: (item.value / totalExpenseAmount) * 100,
    }));
  }, [aggregatedData, totalExpenseAmount]);

  if (expenses.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center text-center space-y-2 h-64 shadow-xs">
        <PieIcon className="w-8 h-8 text-gray-300 dark:text-zinc-700 animate-pulse" />
        <p className="text-xs font-bold text-gray-500 dark:text-zinc-400">No Expenses Recorded</p>
        <p className="text-[10px] text-gray-400 max-w-[200px]">Add your first expense to generate a dynamic visual breakdown.</p>
      </div>
    );
  }

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-xl text-xs space-y-1">
          <p className="font-extrabold text-[#00A896]">{data.name}</p>
          <p className="font-medium text-[11px]">Amount: <span className="font-bold">{formatCurrency(data.value, currency)}</span></p>
          <p className="text-[10px] text-gray-400">Share: <span className="font-bold text-teal-300">{data.percentage.toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-rose-500" />
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-zinc-50">Expenses Summary Breakdown</h3>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Spent</span>
          <span className="text-sm font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalExpenseAmount, currency)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Pie Chart display */}
        <div className="md:col-span-6 h-48 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered label */}
          <div className="absolute text-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block leading-none">Total</span>
            <span className="text-xs font-black text-gray-800 dark:text-zinc-100 mt-1 block">
              {formatCurrency(totalExpenseAmount, currency).split('.')[0]}
            </span>
          </div>
        </div>

        {/* Legend table */}
        <div className="md:col-span-6 max-h-48 overflow-y-auto pr-1 scrollbar-none space-y-1.5">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-bold text-gray-700 dark:text-zinc-300 truncate text-[11px]">{item.name}</span>
              </div>
              <div className="text-right flex-shrink-0 pl-2">
                <span className="font-bold text-gray-900 dark:text-zinc-50 text-[11px] block">
                  {formatCurrency(item.value, currency)}
                </span>
                <span className="text-[9px] text-gray-400 block font-semibold">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
