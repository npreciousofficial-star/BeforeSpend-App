import React, { useEffect } from 'react';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import { Sun, Moon, ArrowLeft, Mail, ChevronRight, ShieldCheck } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
  onGoToPrivacy?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoToLogin?: () => void;
  onGoToRegister?: () => void;
  onGoToDashboard?: () => void;
  isLoggedIn?: boolean;
}

export function TermsOfService({
  onBack,
  onGoToPrivacy,
  isDark = false,
  onToggleTheme,
  onGoToLogin,
  onGoToRegister,
  onGoToDashboard,
  isLoggedIn = false,
}: TermsOfServiceProps) {
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
            {onGoToPrivacy && (
              <button onClick={onGoToPrivacy} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">
                Privacy Policy
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
            Terms of Service
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
            Welcome to <strong>BeforeSpend</strong> ("BeforeSpend", "Platform", "we", "us", or "our"). These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and BeforeSpend governing your access to and use of our financial allocation software, website, database tools, and mobile web services.
          </p>
          <p>
            By accessing or using BeforeSpend, creating an account, or authenticating via Google OAuth, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            1. Acceptance of Terms & Eligibility
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            By creating an account on BeforeSpend, you represent and warrant that you are at least 18 years of age (or legal age of majority in your jurisdiction) and have the full legal capacity to enter into this agreement.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            2. Scope of Services & Important Financial Disclaimer
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            BeforeSpend is an income allocation software application designed to help individuals, freelancers, and businesses plan category budgets before spending occurs.
          </p>
          
          <div className="my-4 p-5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border-l-4 border-[#00A896] text-xs text-gray-800 dark:text-zinc-200 leading-relaxed space-y-2">
            <p className="font-extrabold uppercase tracking-wider text-[#00A896]">
              Non-Banking Notice
            </p>
            <p>
              BeforeSpend is a financial tracking and planning software product. <strong>BeforeSpend is not a bank, licensed deposit-taking institution, or registered investment advisor.</strong> BeforeSpend does not execute wire transfers, hold user deposits, or guarantee financial returns.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            3. Account Registration, Phone Verification & Security
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            When registering via email or Google OAuth, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 dark:text-zinc-300">
            <li>Provide accurate and complete information, including a mandatory verified phone number.</li>
            <li>Maintain the confidentiality of your authentication credentials and tokens.</li>
            <li>Accept full responsibility for all activities that occur under your authenticated profile.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            4. Data Encryption, Storage & Intellectual Property
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            All proprietary code, branding, vector assets, algorithms, and interface designs of BeforeSpend are protected by copyright, trademark, and intellectual property laws. All user financial data is encrypted in transit using SSL/TLS and secured at rest using PostgreSQL Row Level Security (RLS).
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            5. Termination & Data Export Rights
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            You may terminate your account at any time. BeforeSpend grants you the right to export your complete database snapshot in JSON format prior to account closure.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-200 dark:border-zinc-800 pb-2">
            6. Governing Law & Legal Contact
          </h2>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            These Terms are governed by and construed in accordance with applicable business laws. For formal legal inquiries, contact our legal counsel:
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-[#00A896] pt-1">
            <Mail className="w-4 h-4" />
            <span>legal@beforespend.app</span>
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
              <li><button onClick={onBack} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">Features</button></li>
              <li><button onClick={onBack} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">Calculator</button></li>
              <li><button onClick={onBack} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">How It Works</button></li>
              <li><button onClick={onBack} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">Testimonials</button></li>
              <li><button onClick={onBack} className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer">FAQs</button></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-zinc-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <span>© 2026 BeforeSpend is a Product of DirectPadi Ltd.</span>
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#00A896]">Terms of Service</span>
            <span>•</span>
            {onGoToPrivacy && (
              <button onClick={onGoToPrivacy} className="hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer">
                Privacy Policy
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
