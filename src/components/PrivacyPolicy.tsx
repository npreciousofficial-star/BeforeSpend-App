import React, { useEffect } from 'react';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, Server, CheckCircle2, Mail, Key } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
  onGoToTerms?: () => void;
}

export function PrivacyPolicy({ onBack, onGoToTerms }: PrivacyPolicyProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-zinc-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#00A896]" />
              <span>Back</span>
            </button>
            <BeforeSpendLogo size="md" />
          </div>

          <div className="flex items-center gap-2">
            {onGoToTerms && (
              <button
                onClick={onGoToTerms}
                className="text-xs font-bold text-[#00A896] hover:underline cursor-pointer"
              >
                Terms of Service →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
        
        {/* Header Hero */}
        <div className="space-y-4 border-b border-gray-200 dark:border-zinc-800 pb-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#00A896]/10 text-[#00A896]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Effective Date: July 23, 2026 • Last Updated: July 23, 2026
          </p>
          <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed pt-2">
            BeforeSpend ("we", "us", or "our") respects your privacy and is committed to protecting the personal and financial information you share with us. This Privacy Policy explains how your data is collected, processed, encrypted, and protected when using our Platform.
          </p>
        </div>

        {/* Section Breakdown */}
        <div className="space-y-8 text-left text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          
          {/* Section 1 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">1</span>
              <span>Information We Collect</span>
            </h2>
            <p>We collect information to provide and optimize your financial allocation experience:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 dark:text-zinc-300">
              <li><strong className="text-gray-800 dark:text-zinc-100">Account Credentials:</strong> Full name, email address, phone number, workspace role, and primary currency provided during registration or Google OAuth sign-in.</li>
              <li><strong className="text-gray-800 dark:text-zinc-100">Google OAuth Profile:</strong> Name, verified email, and high-res profile photo URL provided directly by Google Auth APIs.</li>
              <li><strong className="text-gray-800 dark:text-zinc-100">Financial Allocations & Ledger Entries:</strong> Money bucket percentages, custom category balances, transaction amounts, expense notes, and bank statement uploads.</li>
              <li><strong className="text-gray-800 dark:text-zinc-100">Device & Telemetry Data:</strong> Browser type, viewport resolution, theme preferences (dark mode), and encrypted session tokens.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">2</span>
              <span>How We Use Your Data</span>
            </h2>
            <p>We utilize your data strictly for legitimate operational purposes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-[#00A896]">1. Workspace Personalization</span>
                <p className="text-gray-500 dark:text-zinc-400">Customizing your home currency symbols (₦, $, €, £), income split templates, and milestone targets.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-[#00A896]">2. Secure Cloud Synchronization</span>
                <p className="text-gray-500 dark:text-zinc-400">Syncing your visual buckets and transaction ledgers securely across your authorized devices via Supabase.</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold mt-2">
              <p className="font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Zero Data Selling Promise</span>
              </p>
              <p className="font-normal text-emerald-800 dark:text-emerald-300">
                BeforeSpend NEVER sells, rents, trades, or monetizes your personal information, email, or financial transaction logs to third-party advertisers or data brokers.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">3</span>
              <span>Data Storage & Encryption</span>
            </h2>
            <p>
              BeforeSpend implements enterprise-grade security controls:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 dark:text-zinc-300">
              <li><strong className="text-gray-800 dark:text-zinc-100">Transport Layer Security (TLS):</strong> All API traffic between your browser and our servers is encrypted using 256-bit SSL/TLS.</li>
              <li><strong className="text-gray-800 dark:text-zinc-100">Row Level Security (RLS):</strong> Supabase PostgreSQL databases enforce strict RLS policies ensuring only your authenticated UUID can query your financial records.</li>
              <li><strong className="text-gray-800 dark:text-zinc-100">Password Hashing:</strong> Email passwords are fully salted and hashed using standard bcrypt algorithms.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">4</span>
              <span>Your Rights & Control</span>
            </h2>
            <p>You have full ownership of your data:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 dark:text-zinc-300">
              <li><strong className="text-gray-800 dark:text-zinc-100">Export Snapshot:</strong> You can export a complete JSON database dump of your entries at any time from the Admin Center.</li>
              <li><strong className="text-gray-800 dark:text-zinc-100">Right to Erasure:</strong> You can request full deletion of your profile and data records by contacting support.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">5</span>
              <span>Privacy Contact</span>
            </h2>
            <p>For any privacy-related inquiries or data requests, please reach out to our privacy compliance officer:</p>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00A896]">
              <Mail className="w-4 h-4" />
              <span>privacy@beforespend.app</span>
            </div>
          </section>
        </div>

        {/* Bottom CTA Bar */}
        <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            © 2026 BeforeSpend Inc. All rights reserved.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-2xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-bold text-xs cursor-pointer transition-all shadow-md"
          >
            I Understand & Agree
          </button>
        </div>
      </main>
    </div>
  );
}
