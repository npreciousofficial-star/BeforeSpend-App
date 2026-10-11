import React from 'react';

export function SkeletonPageLoader() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex font-sans">
      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0E2A47] dark:bg-[#0A1628] border-r border-[#0E2A47]/20 dark:border-[#0A1628] p-5 space-y-5 flex-shrink-0 sticky top-0 h-screen animate-pulse">
        {/* Brand Logo Skeleton */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10" />
          <div className="w-28 h-5 rounded-md bg-white/10" />
        </div>

        {/* User Profile Snippet Skeleton */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="space-y-1.5 flex-1">
              <div className="w-20 h-3 rounded bg-white/10" />
              <div className="w-14 h-2.5 rounded bg-white/10" />
            </div>
          </div>
        </div>

        {/* Balance Card Skeleton */}
        <div className="p-3.5 rounded-2xl bg-[#00A896]/10 border border-[#00A896]/20 space-y-2">
          <div className="w-20 h-2.5 rounded bg-[#00A896]/20" />
          <div className="w-28 h-6 rounded bg-[#00A896]/25" />
        </div>

        {/* Nav Items Skeletons */}
        <div className="space-y-1.5 pt-2 flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
              <div className="w-4 h-4 rounded bg-white/10" />
              <div className="w-24 h-3 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area Skeleton */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-pulse">
        {/* Top Header Skeleton */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-zinc-800">
          <div className="space-y-1.5">
            <div className="w-44 h-6 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
            <div className="w-28 h-3 bg-gray-100 dark:bg-zinc-800/60 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-28 h-9 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            <div className="w-9 h-9 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>

        {/* Action Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="w-48 h-5 bg-gray-200 dark:bg-zinc-800 rounded-md" />
          <div className="flex gap-2">
            <div className="w-24 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
            <div className="w-24 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>

        {/* Bucket Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
          {[...Array(6)].map((_, i) => (
            <SkeletonBucketCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

// Backward compatibility alias ensuring no preloader modal is ever displayed
export function GooglePreloader(_props?: { message?: string }) {
  return <SkeletonPageLoader />;
}


export function SkeletonBucketCard() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-gray-100 dark:border-zinc-800/80 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="w-24 h-3.5 bg-gray-200 dark:bg-zinc-800 rounded-md" />
            <div className="w-16 h-2.5 bg-gray-100 dark:bg-zinc-800/60 rounded-md" />
          </div>
        </div>
        <div className="w-12 h-6 bg-gray-200 dark:bg-zinc-800 rounded-full" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="w-32 h-6 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonContentBlock() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-gray-100 dark:border-zinc-800/80 shadow-sm animate-pulse space-y-4">
      <div className="w-48 h-5 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      <div className="space-y-3 pt-2">
        <div className="w-full h-3 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-3/4 h-3 bg-gray-100 dark:bg-zinc-800/60 rounded-md" />
        <div className="w-1/2 h-3 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonTableRows() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-gray-100 dark:border-zinc-800/80 shadow-sm animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800/60">
        <div className="w-1/4 h-4 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-1/4 h-4 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-1/4 h-4 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-1/5 h-4 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-4">
            <div className="w-1/4 h-3 bg-gray-100 dark:bg-zinc-800/60 rounded-md" />
            <div className="w-1/5 h-3 bg-gray-200 dark:bg-zinc-800 rounded-md" />
            <div className="w-1/4 h-3 bg-gray-100 dark:bg-zinc-800/60 rounded-md" />
            <div className="w-1/6 h-3 bg-gray-200 dark:bg-zinc-800 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChartCard() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-gray-100 dark:border-zinc-800/80 shadow-sm animate-pulse space-y-5">
      <div className="w-40 h-4 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      <div className="w-full h-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
      <div className="flex justify-center gap-4 pt-2">
        <div className="w-16 h-2.5 bg-gray-100 dark:bg-zinc-800/60 rounded-full" />
        <div className="w-16 h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full" />
        <div className="w-16 h-2.5 bg-gray-100 dark:bg-zinc-800/60 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonFormCard() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-gray-100 dark:border-zinc-800/80 shadow-sm animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="w-20 h-3 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-full h-9 bg-gray-100 dark:bg-zinc-800/60 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="w-20 h-3 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-full h-9 bg-gray-100 dark:bg-zinc-800/60 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="w-20 h-3 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-full h-9 bg-gray-100 dark:bg-zinc-800/60 rounded-lg" />
      </div>
      <div className="pt-2">
        <div className="w-32 h-10 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}
