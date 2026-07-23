import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle, ExternalLink } from 'lucide-react';
import { BeforeSpendLogo } from './BeforeSpendLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone PWA mode
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isAppStandalone);
    if (isAppStandalone) return;

    // 2. Check if user dismissed the banner recently
    const dismissedTime = localStorage.getItem('beforespend_pwa_dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 3) {
        return; // Don't show for 3 days after user dismisses
      }
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      setShowBanner(true);
    }

    // 4. Listen for Chrome / Android / Desktop beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Hide banner once app is installed
    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.setItem('beforespend_pwa_installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // Open iOS instruction modal
      setShowIosModal(true);
    } else {
      // Fallback for browsers that don't support automated prompt
      alert('To install BeforeSpend: Open your browser menu (⋮ or Share icon) and tap "Add to Home Screen".');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('beforespend_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* BOTTOM PWA DOWNLOAD APP BANNER */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/90 dark:border-zinc-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-left">
          
          {/* App Icon & Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#00A896]/10 p-1.5 shrink-0 border border-[#00A896]/20 flex items-center justify-center overflow-hidden shadow-xs">
              <img
                src="/logo.png"
                alt="BeforeSpend App Icon"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-xs text-gray-900 dark:text-zinc-50 truncate">
                  BeforeSpend App
                </h4>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#00A896]/15 text-[#00A896]">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
                Install app for instant access & offline mode
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white text-xs font-black transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* iOS INSTALL INSTRUCTION MODAL */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-left relative">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#00A896]/10 text-[#00A896] flex items-center justify-center mb-3">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-zinc-50">
                Install on iPhone & iPad
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Follow these simple steps to add BeforeSpend directly to your home screen:
              </p>
            </div>

            <div className="space-y-3 text-xs text-gray-700 dark:text-zinc-300">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <p>Tap the <strong>Share button <Share className="inline w-3.5 h-3.5 text-[#00A896]" /></strong> in Safari navigation bar.</p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <p>Scroll down and select <strong>'Add to Home Screen' <PlusSquare className="inline w-3.5 h-3.5 text-[#00A896]" /></strong>.</p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <p>Tap <strong>'Add'</strong> in the top right corner.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-3 rounded-2xl bg-[#00A896] hover:bg-[#0E2A47] text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
