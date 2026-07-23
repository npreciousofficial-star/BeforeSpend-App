import React from 'react';
import { Smartphone, X, Share, PlusSquare, MonitorCheck } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallGuideModal({ isOpen, onClose }: InstallGuideModalProps) {
  if (!isOpen) return null;

  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isIos = /iphone|ipad|ipod/.test(userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-left relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1 cursor-pointer transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#00A896]/10 text-[#00A896] flex items-center justify-center mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-zinc-50 tracking-tight">
            Install BeforeSpend App
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
            Follow these simple steps to add BeforeSpend to your home screen for quick access and offline mode:
          </p>
        </div>

        {/* Instructions */}
        {isIos ? (
          <div className="space-y-2.5 text-xs text-gray-700 dark:text-zinc-300">
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
        ) : (
          <div className="space-y-2.5 text-xs text-gray-700 dark:text-zinc-300">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <p>Open browser menu <strong>(⋮ or Share)</strong> in your address bar.</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <p>Select <strong>'Install App' <MonitorCheck className="inline w-3.5 h-3.5 text-[#00A896]" /></strong> or <strong>'Add to Home Screen'</strong>.</p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#00A896] hover:bg-[#0E2A47] text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
        >
          Got It
        </button>

      </div>
    </div>
  );
}
