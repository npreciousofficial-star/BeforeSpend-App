import React from 'react';
import { BeforeSpendLogo } from './BeforeSpendLogo';

export function GooglePreloader({ message = 'Retrieving your financial ledger...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/90 dark:bg-zinc-950/90 backdrop-blur-md transition-all duration-300">
      <div className="relative flex flex-col items-center p-8 rounded-3xl bg-white/60 dark:bg-zinc-900/60 border border-gray-200/50 dark:border-zinc-800/50 shadow-2xl backdrop-blur-xl max-w-sm w-full mx-4 text-center">
        {/* Pulsating Brand Ring */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00A896]/20 to-[#0E2A47]/20 animate-ping opacity-75" />
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#00A896] to-[#0E2A47] opacity-20 blur-md animate-pulse" />
          <div className="relative flex items-center justify-center w-20 h-20 bg-white dark:bg-zinc-900 rounded-full shadow-lg border border-teal-100 dark:border-teal-900/40">
            <BeforeSpendLogo size="lg" animate={true} />
          </div>
        </div>

        <h3 className="text-base font-bold text-[#0E2A47] dark:text-zinc-100 mb-1 tracking-tight">
          Before<span className="text-[#00A896]">Spend</span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-6 animate-pulse">
          {message}
        </p>

        {/* Google-style Smooth Loading Progress Bar */}
        <div className="w-48 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#00A896] via-teal-400 to-[#0E2A47] w-full animate-[shimmer_1.5s_infinite] -translate-x-full" 
               style={{
                 animation: 'progressShimmer 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite'
               }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progressShimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
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
