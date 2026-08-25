/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ExpenseForm } from '../../components/ExpenseForm';
import { ExpensePieChart } from '../../components/ExpensePieChart';
import { ExpenseList } from '../../components/ExpenseList';
import { SkeletonFormCard, SkeletonChartCard, SkeletonContentBlock } from '../../components/Preloader';

export const ExpensesView: React.FC = () => {
  const {
    buckets,
    expenses,
    userProfile,
    dataLoaded,
    addToast,
    handleAddExpense,
    handleDeleteExpense,
    handleClearExpenses,
  } = useAppContext();

  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  return (
    <div id="view-expenses-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {!dataLoaded ? (
        <>
          <div className="lg:col-span-4">
            <SkeletonFormCard />
          </div>
          <div className="lg:col-span-8 space-y-5">
            <SkeletonChartCard />
            <SkeletonContentBlock />
          </div>
        </>
      ) : (
        <>
          <div className="lg:col-span-4">
            <ExpenseForm
              buckets={buckets}
              currency={userProfile.defaultCurrency}
              onAdd={handleAddExpense}
              addToast={addToast}
            />
          </div>
          <div className="lg:col-span-8 space-y-5">
            <ExpensePieChart
              expenses={expenses}
              buckets={buckets}
              currency={userProfile.defaultCurrency}
            />
            <ExpenseList
              expenses={expenses}
              buckets={buckets}
              currency={userProfile.defaultCurrency}
              searchQuery={expenseSearchQuery}
              onSearchQueryChange={setExpenseSearchQuery}
              onDeleteExpense={handleDeleteExpense}
              onClearAll={handleClearExpenses}
              addToast={addToast}
            />
          </div>
        </>
      )}
    </div>
  );
};
