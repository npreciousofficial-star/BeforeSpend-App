import React, { useEffect } from 'react';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import { Sun, Moon, ArrowLeft, Mail, ChevronRight, Lock, Eye, Database } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
  onGoToTerms?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoToLogin?: () => void;
  onGoToRegister?: () => void;
  onGoToDashboard?: () => void;
  isLoggedIn?: boolean;
}

export function PrivacyPolicy({
  onBack,
  onGoToTerms,
  isDark = false,
  onToggleTheme,
  onGoToLogin,
  onGoToRegister,
  onGoToDashboard,
  isLoggedIn = false,
}: PrivacyPolicyProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 font-sans transition-colors duration-200 overflow-x-hidden antialiased">
      
      {/* 1. LANDING PAGE HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <BeforeSpendLogo size="md" onClick={onBack} />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-gray-600 dark:text-zinc-300">
            <button onClick={onBack} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">Homepage</button>
            <button onClick={onBack} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">Features</button>
            <button onClick={onBack} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">Calculator</button>
            {onGoToTerms && (
              <button onClick={onGoToTerms} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">
                Terms of Service
              </button>
            )}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="w-10 h-10 rounded-2xl border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:border-[#00A896]/50 hover:text-[#00A896] dark:hover:text-[#00A896] cursor-pointer transition-all shadow-2xs hover:shadow-xs flex items-center justify-center"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-[#00A896]" />}
              </button>
            )}

            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 text-xs font-black rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white transition-all cursor-pointer shadow-xs"
              >
                Go to Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {onGoToLogin && (
                  <button
                    onClick={onGoToLogin}
                    className="px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:text-[#00A896] transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
                {onGoToRegister && (
                  <button
                    onClick={onGoToRegister}
                    className="px-4 py-2 text-xs font-black rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white transition-all cursor-pointer shadow-xs"
                  >
                    Get Started
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. ELEGANT DOCUMENT TITLE BAR */}
      <div className="bg-[#0A192F] text-white py-12 px-4 sm:px-8 border-b border-[#1e293b]">
        <div className="max-w-4xl mx-auto space-y-2 text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Last Updated: July 23, 2026 • Effective Date: July 23, 2026
          </p>
        </div>
      </div>

      {/* 3. WELL-FORMATTED DOCUMENT CONTENT (Clean Document Typography) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16 text-left space-y-12">
        
        {/* Preamble */}
        <div className="text-base leading-relaxed text-gray-700 dark:text-zinc-300 border-b border-gray-150 dark:border-zinc-800/80 pb-8 space-y-4">
          <p>
            At <strong>BeforeSpend</strong>, we respect your privacy and are committed to protecting the personal and financial information you entrust to us. This Privacy Policy outlines our practices regarding data collection, encryption, cloud synchronization, and user control rights.
          </p>
          <p>
            By using BeforeSpend, creating a workspace profile, or authenticating via Google OAuth, you consent to the data practices described in this policy.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            1. Information We Collect
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            We collect only the minimum necessary information required to operate a secure income-splitting and budgeting workspace:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 dark:text-zinc-300">
            <li><strong>Account Profile Information:</strong> Full name, email address, mandatory phone number, primary workspace currency (NGN, USD, EUR, etc.), and role.</li>
            <li><strong>Google OAuth Metadata:</strong> Full name, verified Google email, and high-resolution profile photo URL (`lh3.googleusercontent.com`) automatically retrieved upon Google Auth.</li>
            <li><strong>Financial Allocation Entries:</strong> Budget bucket names, percentage splits, target bank destinations, transaction records, expense entries, and uploaded bank statements.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            2. How We Use Your Information & Zero Data-Selling Pledge
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            Your data is used exclusively to deliver, maintain, and personalize your BeforeSpend experience.
          </p>

          <div className="my-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed space-y-1">
            <p className="font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Zero Third-Party Data Monetization
            </p>
            <p>
              BeforeSpend <strong>never sells, rents, leases, or trades your personal data, email, or financial logs to advertisers or third-party data brokers</strong>.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            3. Security, Encryption & PostgreSQL RLS
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            We implement industry-standard encryption protocols:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 dark:text-zinc-300">
            <li><strong>SSL/TLS Transport Encryption:</strong> All data transmitted between your device and our servers is secured via 256-bit SSL/TLS encryption.</li>
            <li><strong>Row Level Security (RLS):</strong> Database tables enforce PostgreSQL RLS rules ensuring only your authenticated user UUID can access your financial data.</li>
            <li><strong>Salted Password Hashes:</strong> User passwords are fully salted and hashed using secure cryptographic algorithms.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            4. User Rights & Data Erasure
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            You retain full rights over your data. You may export a complete JSON snapshot of your database entries or request permanent deletion of your profile by emailing:
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-[#00A896] pt-1">
            <Mail className="w-4 h-4" />
            <span>privacy@beforespend.app</span>
          </div>
        </section>

      </main>

      {/* 4. LANDING PAGE FOOTER */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-900 py-12 text-xs text-gray-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          
          <div className="space-y-3">
            <BeforeSpendLogo size="md" onClick={onBack} />
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm">
              The smart way to manage your money before you spend it. Organise your salary, protect your savings, and spend stress-free.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <div className="font-extrabold text-xs text-gray-900 dark:text-zinc-200 uppercase tracking-wider">Quick Links</div>
            <ul className="flex flex-wrap gap-4 text-xs">
              <li><button onClick={onBack} className="hover:text-[#00A896] transition-colors cursor-pointer">Homepage</button></li>
              <li><button onClick={onBack} className="hover:text-[#00A896] transition-colors cursor-pointer">Calculator</button></li>
              {onGoToTerms && (
                <li>
                  <button onClick={onGoToTerms} className="hover:text-[#00A896] transition-colors cursor-pointer font-semibold text-[#00A896]">
                    Terms of Service
                  </button>
                </li>
              )}
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-zinc-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <span>© 2026 BeforeSpend is a Product of DirectPadi Ltd.</span>
          <div className="flex items-center gap-4">
            {onGoToTerms && (
              <button onClick={onGoToTerms} className="hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer">
                Terms of Service
              </button>
            )}
            <span>•</span>
            <span className="font-bold text-[#00A896]">Privacy Policy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
