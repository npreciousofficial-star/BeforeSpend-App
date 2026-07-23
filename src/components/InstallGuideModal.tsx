import React from 'react';
import { Smartphone, X, Share, PlusSquare, MonitorCheck, MoreVertical, Compass } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallGuideModal({ isOpen, onClose }: InstallGuideModalProps) {
  if (!isOpen) return null;

  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isIos = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);
  const isDesktop = !isIos && !isAndroid;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-left relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1 cursor-pointer transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shrink-0 shadow-xs">
              <img src="/pwa-icon.png" alt="BeforeSpend Icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-zinc-50 tracking-tight">
                Install BeforeSpend
              </h3>
              <p className="text-[11px] font-bold text-[#00A896]">
                {isIos ? 'iPhone & iPad Setup' : isAndroid ? 'Android Setup' : 'Desktop Setup'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed pt-1">
            Add BeforeSpend to your home screen for instant full-screen access & offline mode:
          </p>
        </div>

        {/* Tailored Device Instructions */}
        {isIos ? (
          /* iOS Instructions */
          <div className="space-y-2.5 text-xs text-gray-700 dark:text-zinc-300">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">1</span>
              <p>Tap the <strong>Share button <Share className="inline w-3.5 h-3.5 text-[#00A896]" /></strong> at the bottom of Safari.</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">2</span>
              <p>Scroll down and select <strong>'Add to Home Screen' <PlusSquare className="inline w-3.5 h-3.5 text-[#00A896]" /></strong>.</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">3</span>
              <p>Tap <strong>'Add'</strong> in the top right corner.</p>
            </div>
          </div>
        ) : isAndroid ? (
          /* Android Instructions */
          <div className="space-y-2.5 text-xs text-gray-700 dark:text-zinc-300">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">1</span>
              <p>Tap your Chrome menu <strong>(⋮ <MoreVertical className="inline w-3.5 h-3.5 text-[#00A896]" />)</strong> in top right.</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">2</span>
              <p>Select <strong>'Install app'</strong> or <strong>'Add to Home screen'</strong>.</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">3</span>
              <p>Confirm by clicking <strong>'Install'</strong>.</p>
            </div>
          </div>
        ) : (
          /* Desktop Instructions */
          <div className="space-y-2.5 text-xs text-gray-700 dark:text-zinc-300">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">1</span>
              <p>Look at your browser's address bar in the top right.</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">2</span>
              <p>Click the <strong>Install icon <MonitorCheck className="inline w-3.5 h-3.5 text-[#00A896]" /></strong> or browser menu <strong>(⋮)</strong>.</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-extrabold text-xs shrink-0">3</span>
              <p>Click <strong>'Install'</strong> to open BeforeSpend as a desktop app.</p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#00A896] hover:bg-[#0E2A47] text-white text-xs font-bold transition-colors cursor-pointer shadow-md uppercase tracking-wider"
        >
          Got It
        </button>

      </div>
    </div>
  );
}
