/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LedgerTable } from '../../components/LedgerTable';
import { SkeletonTableRows } from '../../components/Preloader';

interface HistoryViewProps {
  onOpenReconciliation: (bucketId?: string) => void;
  onOpenStatementParser: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onOpenReconciliation,
  onOpenStatementParser,
}) => {
  const { transactions, buckets, userProfile, dataLoaded } = useAppContext();
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');

  return (
    <div id="view-ledger-tab" className="space-y-6">
      {!dataLoaded ? (
        <SkeletonTableRows />
      ) : (
        <LedgerTable
          transactions={transactions}
          buckets={buckets}
          currency={userProfile.defaultCurrency}
          searchTerm={ledgerSearchTerm}
          onSearchTermChange={setLedgerSearchTerm}
          onOpenReconciliation={onOpenReconciliation}
          onOpenStatementParser={onOpenStatementParser}
        />
      )}
    </div>
  );
};
