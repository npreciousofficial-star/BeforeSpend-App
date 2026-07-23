import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaTopBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check standalone mode
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isAppStandalone);
    if (isAppStandalone) return;

    // 2. Industry Standard: Check if user already dismissed or installed PWA banner
    const isDismissed = localStorage.getItem('beforespend_pwa_top_banner_dismissed');
    if (isDismissed === 'true') {
      return; // Permanently hide on refresh once dismissed
    }

    // Show banner by default unless dismissed
    setShowBanner(true);

    // 3. Listen for browser install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('beforespend_pwa_top_banner_dismissed', 'true');
      }
      setDeferredPrompt(null);
    } else {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        alert('To install BeforeSpend on iOS: Tap Safari Share icon ⎋ and select "Add to Home Screen" ➕');
      } else {
        alert('To install BeforeSpend: Tap your browser menu (⋮) and select "Add to Home Screen" or "Install App".');
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Industry standard: Save permanent dismissal in localStorage so refresh never re-shows it
    localStorage.setItem('beforespend_pwa_top_banner_dismissed', 'true');
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* MOBILE VERSION: Top Sticky Banner (block md:hidden) */}
      <div className="md:hidden sticky top-0 w-full bg-white dark:bg-zinc-900 border-b border-gray-200/90 dark:border-zinc-800 px-4 py-2 flex items-center justify-between gap-3 text-left shadow-xs transition-colors z-50">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
            title="Close Banner"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 shadow-2xs">
            <img src="/pwa-icon.png" alt="BeforeSpend Icon" className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0">
            <h4 className="font-extrabold text-xs text-gray-900 dark:text-zinc-50 leading-tight">
              Get the app
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate leading-tight">
              Fastest way to manage & split your income
            </p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="px-4 py-1.5 rounded-full bg-[#00A896] hover:bg-teal-600 text-white font-extrabold text-xs uppercase tracking-wide transition-all cursor-pointer shadow-xs shrink-0"
        >
          USE APP
        </button>
      </div>

      {/* DESKTOP & TABLET VERSION: Bottom Right Floating Banner (hidden md:flex) */}
      <div className="hidden md:flex fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/90 dark:border-zinc-800 p-3.5 rounded-2xl shadow-2xl items-center justify-between gap-3 text-left animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer shrink-0"
            title="Close Banner"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 shadow-2xs">
            <img src="/pwa-icon.png" alt="BeforeSpend Icon" className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0">
            <h4 className="font-extrabold text-xs text-gray-900 dark:text-zinc-50 leading-tight">
              Get the app
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate leading-tight">
              Fastest way to manage & split your income
            </p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="px-4 py-1.5 rounded-full bg-[#00A896] hover:bg-teal-600 text-white font-extrabold text-xs uppercase tracking-wide transition-all cursor-pointer shadow-xs shrink-0"
        >
          USE APP
        </button>
      </div>
    </>
  );
}

export const PwaInstallBanner = PwaTopBanner;
