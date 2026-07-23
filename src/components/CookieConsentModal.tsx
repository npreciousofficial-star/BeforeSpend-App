import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

interface CookieConsentModalProps {
  onGoToPrivacy?: () => void;
}

export function CookieConsentModal({ onGoToPrivacy }: CookieConsentModalProps) {
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const consentChoice = localStorage.getItem('beforespend_cookie_consent');
    if (!consentChoice) {
      setShowModal(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('beforespend_cookie_consent', 'accepted');
    setShowModal(false);
  };

  const handleDecline = () => {
    localStorage.setItem('beforespend_cookie_consent', 'declined');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/90 dark:border-zinc-800 p-5 rounded-3xl shadow-2xl space-y-3.5 text-left relative">
        
        {/* Close Button */}
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1 cursor-pointer transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Cookie Icon */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00A896] border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-[#00A896]" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-zinc-50">
            We value your privacy
          </h3>
        </div>

        {/* Body Text */}
        <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
          We use cookies to enhance your experience and analyze traffic. Read our{' '}
          <button
            type="button"
            onClick={onGoToPrivacy}
            className="font-bold text-[#00A896] hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          . By clicking "Accept All", you consent to our use of cookies.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleAccept}
            className="px-5 py-2 rounded-full bg-[#00A896] hover:bg-teal-600 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
          >
            Accept All
          </button>

          <button
            onClick={handleDecline}
            className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Decline
          </button>
        </div>

      </div>
    </div>
  );
}
