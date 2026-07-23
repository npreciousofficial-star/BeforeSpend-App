import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaTopBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone PWA mode
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isAppStandalone);
    if (isAppStandalone) {
      setShowBanner(false);
      return;
    }

    // 2. Check if user dismissed top banner recently
    const dismissedTime = localStorage.getItem('beforespend_pwa_top_banner_dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 3) {
        setShowBanner(false);
        return;
      }
    }

    // 3. Capture install prompt if supported
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
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
      }
      setDeferredPrompt(null);
    } else {
      // Fallback action
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
    localStorage.setItem('beforespend_pwa_top_banner_dismissed', Date.now().toString());
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200/90 dark:border-zinc-800 px-4 py-2 flex items-center justify-between gap-3 text-left shadow-xs transition-colors z-50">
      <div className="flex items-center gap-3 min-w-0">
        {/* Close X */}
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
          title="Close Banner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App Icon */}
        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 shadow-2xs">
          <img src="/pwa-icon.png" alt="BeforeSpend App Icon" className="w-full h-full object-cover" />
        </div>

        {/* Text stack */}
        <div className="min-w-0">
          <h4 className="font-extrabold text-xs text-gray-900 dark:text-zinc-50 leading-tight">
            Get the app
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate leading-tight">
            Fastest way to manage & split your income
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleInstallClick}
        className="px-4 py-1.5 rounded-full bg-[#00A896] hover:bg-teal-600 text-white font-extrabold text-xs uppercase tracking-wide transition-all cursor-pointer shadow-xs shrink-0"
      >
        USE APP
      </button>
    </div>
  );
}
