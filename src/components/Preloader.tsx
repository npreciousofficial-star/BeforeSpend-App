import React from 'react';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import { ShieldCheck, Sparkles, Lock } from 'lucide-react';

interface PreloaderProps {
  message?: string;
}

export function Preloader({ message = 'Connecting to financial vault...' }: PreloaderProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 transition-colors duration-300">
      
      {/* Background Ambient Glow */}
      <div className="absolute w-96 h-96 bg-[#00A896]/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-72 h-72 bg-[#0E2A47]/10 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
        {/* Animated Brand Logo Container */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#00A896]/30 via-teal-400/20 to-[#0E2A47]/30 blur-lg animate-pulse" />
          <div className="relative p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-2xl flex items-center justify-center">
            <BeforeSpendLogo className="h-12 w-auto text-[#00A896]" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-zinc-50 mb-1 flex items-center gap-1.5">
          <span>BeforeSpend</span>
          <Sparkles className="w-4 h-4 text-[#00A896] animate-bounce" />
        </h2>
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-6">
          Master Your Income Before It Leaves Your Hands
        </p>

        {/* Sleek Animated Progress Bar */}
        <div className="w-56 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-4 relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#00A896] via-teal-400 to-[#0E2A47] rounded-full w-full animate-[progress_1.5s_infinite_linear]" />
        </div>

        {/* Loading Message & Security Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/70 px-3.5 py-1.5 rounded-full border border-gray-200/60 dark:border-zinc-800 backdrop-blur-md shadow-xs">
          <Lock className="w-3.5 h-3.5 text-[#00A896]" />
          <span>{message}</span>
        </div>

        {/* End-to-End Encryption Tag */}
        <div className="mt-8 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00A896]" />
          <span>256-Bit Encrypted Data Sync</span>
        </div>
      </div>
    </div>
  );
}
