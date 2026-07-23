import React, { useEffect } from 'react';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import { ShieldCheck, ArrowLeft, Lock, FileText, Scale, Globe, CheckCircle2, Mail } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
  onGoToPrivacy?: () => void;
}

export function TermsOfService({ onBack, onGoToPrivacy }: TermsOfServiceProps) {
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
            {onGoToPrivacy && (
              <button
                onClick={onGoToPrivacy}
                className="text-xs font-bold text-[#00A896] hover:underline cursor-pointer"
              >
                Privacy Policy →
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
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Effective Date: July 23, 2026 • Last Updated: July 23, 2026
          </p>
          <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed pt-2">
            Welcome to BeforeSpend ("BeforeSpend", "we", "us", or "our"). These Terms of Service govern your access to and use of the BeforeSpend website, mobile application, database integrations, and financial allocation services (collectively, the "Platform").
          </p>
        </div>

        {/* Section Breakdown */}
        <div className="space-y-8 text-left text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          
          {/* Section 1 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, registering, or using the BeforeSpend Platform—whether through our website, mobile interface, or Google OAuth authentication—you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to all terms herein, you must refrain from accessing or using the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">2</span>
              <span>Description of Services</span>
            </h2>
            <p>
              BeforeSpend provides an income allocation, visual money ledger, and expense tracking workspace designed to help freelancers, salaried professionals, business owners, and personal budgeters plan allocations before spending occurs.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-semibold space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Important Financial Disclaimer</span>
              </p>
              <p className="font-normal text-amber-800 dark:text-amber-300">
                BeforeSpend is a software tool for personal budgeting and financial organization. BeforeSpend is NOT a registered bank, financial institution, investment advisor, or tax consultancy. The Platform does not hold, move, custody, or manage monetary funds or bank deposits directly.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">3</span>
              <span>User Registration & Security</span>
            </h2>
            <p>
              To access certain features, you must create an account using Google OAuth or email registration. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 dark:text-zinc-300">
              <li>Provide accurate, current, and complete information, including a valid phone number and primary currency.</li>
              <li>Maintain the security of your authentication credentials and account tokens.</li>
              <li>Promptly notify BeforeSpend if you suspect any unauthorized access to your account.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">4</span>
              <span>Data Protection & Privacy</span>
            </h2>
            <p>
              Your data privacy is fundamental to our architecture. BeforeSpend utilizes local browser storage encryption, Supabase Row Level Security (RLS), and SSL/TLS transport protocols. Please review our <button onClick={onGoToPrivacy} className="text-[#00A896] font-bold underline cursor-pointer">Privacy Policy</button> to understand how your data is collected, stored, and protected.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">5</span>
              <span>Prohibited Uses</span>
            </h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 dark:text-zinc-300">
              <li>Using the Platform for fraudulent, deceptive, or illegal financial activities.</li>
              <li>Attempting to bypass authentication or probe system vulnerabilities.</li>
              <li>Reverse engineering or compiling derivative works of the BeforeSpend codebase.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">6</span>
              <span>Limitation of Liability</span>
            </h2>
            <p>
              To the maximum extent permitted by applicable law, BeforeSpend shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Platform.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 dark:text-zinc-50 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#00A896]/10 text-[#00A896] text-xs flex items-center justify-center font-black">7</span>
              <span>Contact Information</span>
            </h2>
            <p>If you have questions regarding these Terms of Service, please contact our legal team:</p>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00A896]">
              <Mail className="w-4 h-4" />
              <span>legal@beforespend.app</span>
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
