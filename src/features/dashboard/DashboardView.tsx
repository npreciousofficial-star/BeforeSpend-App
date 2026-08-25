/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { BucketCard } from '../../components/BucketCard';
import { SkeletonBucketCard } from '../../components/Preloader';
import { Plus, RefreshCw } from 'lucide-react';
import { Bucket } from '../../types';

interface DashboardViewProps {
  hideBalance: boolean;
  onOpenReallocate: () => void;
  onOpenAddCustomBucket: () => void;
  onOpenDirectDeposit: () => void;
  onEditBucket: (bucket: Bucket) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  hideBalance,
  onOpenReallocate,
  onOpenAddCustomBucket,
  onOpenDirectDeposit,
  onEditBucket,
}) => {
  const { buckets, setBuckets, userProfile, dataLoaded } = useAppContext();
  const [draggedBucketId, setDraggedBucketId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedBucketId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedBucketId || draggedBucketId === targetId) return;

    const fromIndex = buckets.findIndex((b) => b.id === draggedBucketId);
    const toIndex = buckets.findIndex((b) => b.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const newBuckets = [...buckets];
    const [moved] = newBuckets.splice(fromIndex, 1);
    newBuckets.splice(toIndex, 0, moved);

    setBuckets(newBuckets);
    setDraggedBucketId(null);
  };

  return (
    <div id="view-buckets-tab" className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-black text-gray-900 dark:text-zinc-50">
          Budget Allocations Breakdown
        </h2>
        <div className="flex items-center gap-4">
          <button
            id="transfer-funds-trigger"
            onClick={onOpenReallocate}
            className="text-xs font-bold text-[#00A896] hover:text-[#0E2A47] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reallocate / Transfer Funds
          </button>
          <button
            id="add-custom-bucket-trigger"
            onClick={onOpenAddCustomBucket}
            className="text-xs font-bold text-[#00A896] hover:text-[#0E2A47] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Custom Bucket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
        {!dataLoaded ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonBucketCard key={idx} />
          ))
        ) : (
          buckets.map((bucket) => (
            <div
              key={bucket.id}
              id={`bucket-card-wrapper-${bucket.id}`}
              className={`relative group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                draggedBucketId === bucket.id ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, bucket.id)}
              onDragOver={(e) => handleDragOver(e)}
              onDrop={(e) => handleDrop(e, bucket.id)}
            >
              <BucketCard
                bucket={bucket}
                currency={userProfile.defaultCurrency}
                hideBalance={hideBalance}
                onDeposit={onOpenDirectDeposit}
                onEdit={() => onEditBucket(bucket)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
