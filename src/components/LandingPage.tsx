/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import { Avatar } from './Avatar';
import { 
  Wallet, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Calculator, 
  Database, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Users, 
  RefreshCw, 
  Sun, 
  Moon, 
  Globe, 
  Award, 
  Check, 
  HelpCircle, 
  BarChart2, 
  DollarSign, 
  Briefcase, 
  Menu, 
  X, 
  Star,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isLoggedIn?: boolean;
  currentUserId?: string | null;
  onGoToDashboard?: () => void;
  onLogout?: () => void;
}

export function LandingPage({
  onGoToLogin,
  onGoToRegister,
  isDark,
  onToggleTheme,
  isLoggedIn = false,
  currentUserId = null,
  onGoToDashboard,
  onLogout,
}: LandingPageProps) {
  // Mobile Nav Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Retrieve user profile if logged in
  let userProfile = { name: 'User', email: '', role: 'Member', avatar: 'preset-emerald' };
  if (isLoggedIn && currentUserId) {
    try {
      const raw = window.localStorage.getItem(`user_${currentUserId}_beforespend_profile`);
      if (raw) {
        const parsed = JSON.parse(raw);
        userProfile = {
          name: parsed.name || 'User',
          email: parsed.email || '',
          role: parsed.role || 'Member',
          avatar: parsed.avatar || 'preset-emerald'
        };
      }
    } catch (e) {
      // fallback
    }
  }

  const isAdmin = userProfile.role === 'Platform Administrator' || userProfile.email.toLowerCase() === 'admin@beforespend.app';

  // Live Calculator state
  const [sandboxIncome, setSandboxIncome] = useState<number>(500000);
  const [sandboxCurrency, setSandboxCurrency] = useState<string>('NGN');
  const [presetStrategy, setPresetStrategy] = useState<string>('balanced');
  
  // Custom ratios in sandbox
  const [ratios, setRatios] = useState({
    living: 50,
    emergency: 20,
    investment: 15,
    discretionary: 15
  });

  // Handle Strategy Preset Changes
  const applyPreset = (preset: string) => {
    setPresetStrategy(preset);
    if (preset === 'balanced') {
      setRatios({ living: 50, emergency: 20, investment: 15, discretionary: 15 });
    } else if (preset === 'fire') {
      setRatios({ living: 40, emergency: 10, investment: 40, discretionary: 10 });
    } else if (preset === 'freelancer') {
      setRatios({ living: 45, emergency: 30, investment: 15, discretionary: 10 });
    }
  };

  // FAQs Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Calculate sandbox amounts
  const livingAmt = (sandboxIncome * ratios.living) / 100;
  const emergencyAmt = (sandboxIncome * ratios.emergency) / 100;
  const investmentAmt = (sandboxIncome * ratios.investment) / 100;
  const discretionaryAmt = (sandboxIncome * ratios.discretionary) / 100;

  const faqs = [
    {
      q: 'How does BeforeSpend help me manage my money?',
      a: 'Traditional budget apps tell you where your money went after you have already spent it. BeforeSpend helps you plan ahead: whenever income enters your account, it automatically splits into simple categories like Bills, Savings, Investments, and Fun spending. You always know exactly how much you can spend safely.'
    },
    {
      q: 'How does BeforeSpend ensure my calculations are accurate?',
      a: 'Every deposit, expense, and transfer is tracked automatically with complete accuracy. You will never have missing records, mysterious math errors, or uncounted transactions.'
    },
    {
      q: 'Can I import bank statements from OPay, GTBank, Kuda, Zenith, or Chase?',
      a: 'Yes! You can easily upload bank statements from any major bank. The app automatically recognizes your income and expenses and places them into the right categories.'
    },
    {
      q: 'Is my personal financial data safe and private?',
      a: 'Yes, completely. Your financial data stays 100% private and secure on your device. We never sell, share, or view your personal money details.'
    },
    {
      q: 'How does splitting bills with friends work?',
      a: 'Our Bill Splitter lets you divide dinner bills, rent, or trip costs with friends. It calculates everyone’s share automatically so you get paid back with zero hassle.'
    },
    {
      q: 'Is BeforeSpend free to use?',
      a: 'Yes! BeforeSpend is completely free to use with full access to smart category buckets, bank statement imports, goal tracking, and private data backups.'
    },
    {
      q: 'Can I back up or export my financial records?',
      a: 'Yes, you can export your records as clean files or back them up anytime with a single click.'
    }
  ];

  const testimonials = [
    {
      name: 'Chidi Okechukwu',
      role: 'UI/UX Designer & Senior Freelancer',
      avatar: 'CO',
      imgUrl: '/avatars/avatar1.jpg',
      color: 'bg-emerald-600',
      rating: 5,
      impact: 'Saved ₦1.8M in Emergency Savings',
      quote: 'Before BeforeSpend, I had income flowing in from multiple international clients, but at the end of every month, I couldn’t account for 30% of my earnings. BeforeSpend changed everything—now every invoice payment is split automatically before I touch it.'
    },
    {
      name: 'Amaka Vance',
      role: 'Product Manager & Real Estate Investor',
      avatar: 'AV',
      imgUrl: '/avatars/avatar2.jpg',
      color: 'bg-teal-600',
      rating: 5,
      impact: '100% Reliable Money Tracking',
      quote: 'This app is a total game changer for anyone serious about building wealth. I used to rely on confusing spreadsheets that always broke. Having clear money categories gives me total peace of mind every month.'
    },
    {
      name: 'Tunde Bakare',
      role: 'Software Engineer & Agency Founder',
      avatar: 'TB',
      imgUrl: '/avatars/avatar3.jpg',
      color: 'bg-blue-600',
      rating: 5,
      impact: 'Zero Wasted Cash',
      quote: 'The bank statement feature imported months of OPay and GTBank statements in seconds. Allocating money into purpose buckets before spending gave our household complete financial control.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 font-sans transition-colors duration-200 overflow-x-hidden antialiased">
      
      {/* 1. SIMPLE STICKY NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Simple Clean Brand Logo */}
          <BeforeSpendLogo size="md" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          {/* Simple Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-gray-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">Features</a>
            <a href="#sandbox" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">Calculator</a>
            <a href="#how-it-works" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">Testimonials</a>
            <a href="#faqs" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">FAQs</a>
          </nav>

          {/* Clean Right CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 hover:text-[#00A896] dark:hover:text-[#00A896] cursor-pointer transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#00A896]" />}
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                {/* User Dropdown Avatar */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-8.5 h-8.5 rounded-full overflow-hidden focus:outline-none cursor-pointer border border-gray-200 dark:border-zinc-800 hover:border-[#00A896] transition-all flex items-center justify-center shrink-0 shadow-xs"
                    title="Account Details"
                  >
                    <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
                  </button>

                  {showUserDropdown && (
                    <>
                      {/* Close popover backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                      <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-gray-200/85 dark:border-zinc-850 bg-white dark:bg-zinc-950 p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                        <div className="flex flex-col items-center text-center pb-3 border-b border-gray-100 dark:border-zinc-900/60">
                          <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-150 dark:border-zinc-800 shadow-2xs mb-2">
                            <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
                          </div>
                          <h4 className="font-extrabold text-xs text-gray-900 dark:text-zinc-50">{userProfile.name}</h4>
                          <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{userProfile.email}</p>
                          <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 dark:bg-teal-950/20 text-[#00A896] border border-teal-100/50 dark:border-teal-900/30">
                            {userProfile.role}
                          </span>
                        </div>
                        
                        <div className="py-2 space-y-1">
                          <button
                            onClick={() => {
                              onGoToDashboard?.();
                              setShowUserDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:text-[#00A896] dark:hover:text-[#00A896] hover:bg-gray-50 dark:hover:bg-zinc-900/40 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer text-left"
                          >
                            <LayoutGrid className="w-4 h-4 text-[#00A896]" />
                            <span>Go to Dashboard</span>
                          </button>
                        </div>
                        
                        {onLogout && (
                          <div className="pt-2 border-t border-gray-100 dark:border-zinc-900/60">
                            <button
                              onClick={() => {
                                setShowUserDropdown(false);
                                onLogout();
                              }}
                              className="w-full px-3 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/15 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer text-left"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={onGoToLogin}
                  className="hidden sm:inline-flex px-3.5 py-2.5 text-xs font-extrabold text-gray-700 dark:text-zinc-200 hover:text-[#00A896] dark:hover:text-[#00A896] cursor-pointer transition-colors min-h-[44px] items-center"
                >
                  Sign In
                </button>

                <button
                  onClick={onGoToRegister}
                  className="hidden sm:flex px-4 py-2.5 text-xs font-black rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white shadow-md shadow-[#00A896]/20 cursor-pointer transition-all items-center gap-1.5 min-h-[44px]"
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:text-[#00A896] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 z-50 md:hidden bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2 text-sm font-bold text-gray-700 dark:text-zinc-200">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
              >
                Features
              </a>
              <a 
                href="#sandbox" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
              >
                Live Calculator
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
              >
                How It Works
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
              >
                Testimonials
              </a>
              <a 
                href="#faqs" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
              >
                FAQs
              </a>
            </nav>

            <div className="pt-3 border-t border-gray-100 dark:border-zinc-900 flex flex-col gap-2.5">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50/80 dark:bg-zinc-900/50 rounded-xl border border-gray-150 dark:border-zinc-800/80">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
                      <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">{userProfile.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate">{userProfile.email}</p>
                    </div>
                    {onLogout && (
                      <button
                        onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onGoToDashboard?.(); }}
                    className="w-full py-3 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-black text-xs text-center min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>Go to Workspace Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onGoToLogin(); }}
                    className="w-full py-3 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-extrabold text-gray-800 dark:text-zinc-100 text-center min-h-[44px] cursor-pointer"
                  >
                    Sign In to Account
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onGoToRegister(); }}
                    className="w-full py-3 rounded-xl bg-[#00A896] text-white font-black text-xs text-center min-h-[44px] cursor-pointer"
                  >
                    Create Free Account
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28 border-b border-gray-100 dark:border-zinc-900 bg-gradient-to-b from-teal-50/50 via-white to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950">
        
        {/* Subtle Glow Background Gradient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[250px] bg-[#00A896]/10 dark:bg-[#00A896]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6 sm:space-y-8">

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 dark:text-zinc-50 max-w-4xl mx-auto leading-[1.12]">
            Master Your Income <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#0E2A47] via-[#00A896] to-[#0E2A47] bg-clip-text text-transparent">
              Before It Leaves Your Hands.
            </span>
          </h1>

          {/* Subtitle - Simplified non-technical text */}
          <p className="text-xs sm:text-base lg:text-lg text-gray-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Stop wondering where your money went at the end of the month. BeforeSpend automatically splits your salary or freelance income into clear categories—Bills, Savings, Future, and Fun—so you spend with confidence.
          </p>

          {/* Action Callouts */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-black rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white shadow-lg shadow-[#0E2A47]/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
              >
                Go to Workspace Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onGoToRegister}
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-black rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white shadow-lg shadow-[#0E2A47]/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
              >
                Open Your Free Account
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <a
              href="#sandbox"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-850 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <Calculator className="w-4 h-4 text-[#00A896] dark:text-[#00A896]" />
              Try Live Calculator
            </a>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="pt-6 max-w-5xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-zinc-800 bg-slate-900 text-white p-3 sm:p-5 shadow-2xl overflow-hidden relative text-left">
              
              {/* Mock App Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-4 border-b border-zinc-800 text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 shrink-0" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 shrink-0" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#00A896] shrink-0" />
                  <span className="ml-1 sm:ml-2 font-mono text-[9px] sm:text-xs text-zinc-400 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">app.beforespend.com/dashboard</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#00A896] font-mono whitespace-nowrap shrink-0 ml-auto">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00A896] animate-ping shrink-0" />
                  <span>Money Status: Organized</span>
                </div>
              </div>

              {/* Mock Grid Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Total Income</div>
                  <div className="text-sm sm:text-base font-black text-[#00A896] font-mono mt-0.5">₦1,250,000.00</div>
                  <div className="text-[9px] text-zinc-400 mt-1">100% Categorized</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Bills & Rent</div>
                  <div className="text-sm sm:text-base font-black text-white font-mono mt-0.5">₦625,000.00</div>
                  <div className="text-[9px] text-[#00A896] mt-1">50% Set Aside</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Emergency Savings</div>
                  <div className="text-sm sm:text-base font-black text-blue-400 font-mono mt-0.5">₦250,000.00</div>
                  <div className="text-[9px] text-zinc-400 mt-1">Protected Reserve</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Record Status</div>
                  <div className="text-sm sm:text-base font-black text-purple-400 font-mono mt-0.5">100% Accurate</div>
                  <div className="text-[9px] text-zinc-400 mt-1">Balanced Records</div>
                </div>
              </div>

              {/* Mock Transaction Stream Table */}
              <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800 text-[11px] font-mono space-y-2">
                <div className="text-[10px] font-bold uppercase text-zinc-400 flex justify-between">
                  <span>Recent Transaction</span>
                  <span>Status</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-zinc-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00A896] flex-shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-xs">Salary / Freelance Payment</span>
                  </div>
                  <span className="text-[#00A896] font-bold">+₦500,000.00</span>
                </div>
              </div>

            </div>
          </div>

          {/* Key Trust Stats Grid */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto border-t border-gray-200/80 dark:border-zinc-800/80">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-850/80">
              <div className="text-xl sm:text-2xl font-black text-[#00A896] dark:text-[#00A896]">₦1.8B+</div>
              <div className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 font-medium">Organized Income</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-850/80">
              <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-zinc-50">100%</div>
              <div className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 font-medium">Calculation Accuracy</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-850/80">
              <div className="text-xl sm:text-2xl font-black text-[#00A896] dark:text-[#00A896]">0%</div>
              <div className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 font-medium">Wasted Money</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-850/80">
              <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-zinc-50">25,000+</div>
              <div className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 font-medium">Active Users</div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SUPPORTED BANK STATEMENT PARSERS */}
      <section className="py-8 bg-gray-50/80 dark:bg-zinc-900/40 border-b border-gray-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
            Easily Import Bank Statements From All Major Banks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {[
              { src: '/banks/opay.png',        alt: 'OPay Digital',  bg: 'bg-white dark:bg-zinc-900' },
              { src: '/banks/GTBank.jpg',       alt: 'GTBank',        bg: 'bg-white dark:bg-zinc-900' },
              { src: '/banks/Kuda Bank.png',    alt: 'Kuda Bank',     bg: 'bg-white dark:bg-zinc-900' },
              { src: '/banks/Zenith Bank.jpg',  alt: 'Zenith Bank',   bg: 'bg-white dark:bg-zinc-900' },
              { src: '/banks/Moniepoint.png',   alt: 'Moniepoint',    bg: 'bg-white dark:bg-zinc-900' },
              { src: '/banks/FirstBank.svg',    alt: 'First Bank',    bg: 'bg-white dark:bg-zinc-900' },
            ].map(bank => (
              <div
                key={bank.alt}
                className={`flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow duration-200 ${bank.bg}`}
                style={{ minWidth: '90px', height: '48px' }}
                title={bank.alt}
              >
                <img
                  src={bank.src}
                  alt={bank.alt}
                  className="h-7 w-auto object-contain"
                  style={{ maxWidth: '100px' }}
                  onError={e => {
                    // Fallback to text if image fails
                    (e.target as HTMLImageElement).style.display = 'none';
                    const span = document.createElement('span');
                    span.textContent = bank.alt;
                    span.className = 'text-xs font-bold text-gray-600';
                    (e.target as HTMLImageElement).parentNode?.appendChild(span);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE BUCKET SPLIT SANDBOX */}
      <section id="sandbox" className="py-16 lg:py-24 bg-white dark:bg-zinc-950 border-b border-gray-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#00A896] dark:text-[#00A896]">
              Interactive Live Calculator
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
              Test Money Categories Right Now
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300">
              Enter your salary, invoice payment, or monthly income to see how BeforeSpend instantly divides your money into clear categories.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/90 rounded-[28px] border border-gray-200/90 dark:border-zinc-800 p-6 sm:p-10 shadow-2xl max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Controls Side */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              
              <div className="space-y-6">
                {/* Allocation Strategy Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                      Allocation Strategy
                    </label>
                    <span className="text-[10px] font-bold text-[#00A896]">Auto-Calculated</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'balanced', label: 'Balanced', sub: '50/20/30' },
                      { id: 'fire', label: 'FIRE Goal', sub: '40% Save' },
                      { id: 'freelancer', label: 'Freelancer', sub: 'Tax & Safe' },
                    ].map(strat => (
                      <button
                        key={strat.id}
                        type="button"
                        onClick={() => applyPreset(strat.id as any)}
                        className={`p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-center ${
                          presetStrategy === strat.id
                            ? 'bg-[#00A896] text-white border-[#00A896] shadow-md shadow-[#00A896]/20'
                            : 'bg-gray-50 dark:bg-zinc-850 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-750 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-xs font-black truncate">{strat.label}</span>
                        <span className={`text-[10px] ${presetStrategy === strat.id ? 'text-teal-100' : 'text-gray-400 dark:text-zinc-500'}`}>{strat.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Mode Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">
                    Currency Mode
                  </label>
                  <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-zinc-950/60 rounded-2xl border border-gray-200/80 dark:border-zinc-800">
                    {['NGN', 'USD', 'EUR', 'GBP'].map(curr => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setSandboxCurrency(curr)}
                        className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer select-none ${
                          sandboxCurrency === curr
                            ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-50 shadow-xs'
                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Income Slider Input */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                      Monthly Inflow
                    </label>
                    <span className="text-sm font-black text-[#00A896]">
                      {formatCurrency(sandboxIncome, sandboxCurrency)}
                    </span>
                  </div>

                  <div className="relative flex items-center rounded-2xl border border-gray-300/80 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-950/40 focus-within:border-[#00A896] focus-within:ring-4 focus-within:ring-[#00A896]/10 transition-all">
                    <input
                      type="number"
                      value={sandboxIncome}
                      onChange={(e) => setSandboxIncome(Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3.5 rounded-2xl bg-transparent font-black text-base text-gray-900 dark:text-zinc-50 focus:outline-none"
                      placeholder="Enter revenue amount"
                    />
                  </div>

                  <input
                    type="range"
                    min={10000}
                    max={2000000}
                    step={10000}
                    value={sandboxIncome}
                    onChange={(e) => setSandboxIncome(Number(e.target.value))}
                    className="w-full accent-[#00A896] cursor-pointer h-2 bg-gray-200 rounded-lg dark:bg-zinc-800"
                  />

                  {/* Quick Amount Pills */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[100000, 250000, 500000, 1000000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSandboxIncome(amt)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                          sandboxIncome === amt 
                            ? 'bg-[#00A896]/10 border-[#00A896] text-[#00A896]' 
                            : 'bg-white dark:bg-zinc-950/60 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-400'
                        }`}
                      >
                        {formatCurrency(amt, sandboxCurrency).replace(',000', 'k')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fill empty gap with Live Allocation Insight Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200/60 dark:border-emerald-900/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-[#00A896] shrink-0" />
                    <span>100% Pre-allocated Security</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed font-medium">
                    Every naira of your {formatCurrency(sandboxIncome, sandboxCurrency)} inflow is assigned to a specific bucket before it leaves your hands.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={isLoggedIn ? onGoToDashboard : onGoToRegister}
                  className="w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 text-white bg-gradient-to-r from-[#0E2A47] to-[#00A896] hover:from-[#00A896] hover:to-[#0E2A47] shadow-lg shadow-[#00A896]/20"
                >
                  <span>{isLoggedIn ? 'Return To Dashboard' : 'Lock In Your Categories Free'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Calculated Breakdown Display Side */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
              
              {/* Category 1: Living & Essentials */}
              <div className="p-5 rounded-2xl bg-gray-50/60 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 space-y-2.5 hover:border-[#00A896]/40 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#00A896]" />
                    <span className="font-extrabold text-xs text-gray-900 dark:text-zinc-100">Living &amp; Essentials</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#00A896]/10 text-[#00A896]">
                      {ratios.living}%
                    </span>
                  </div>
                  <span className="font-black text-base text-gray-900 dark:text-zinc-50">
                    {formatCurrency(livingAmt, sandboxCurrency)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#00A896] h-full rounded-full transition-all duration-300" style={{ width: `${ratios.living}%` }} />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Rent, power bills, groceries, and non-negotiable living overhead.</p>
              </div>

              {/* Category 2: Emergency Savings */}
              <div className="p-5 rounded-2xl bg-gray-50/60 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 space-y-2.5 hover:border-blue-500/40 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-extrabold text-xs text-gray-900 dark:text-zinc-100">Emergency Savings</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                      {ratios.emergency}%
                    </span>
                  </div>
                  <span className="font-black text-base text-gray-900 dark:text-zinc-50">
                    {formatCurrency(emergencyAmt, sandboxCurrency)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${ratios.emergency}%` }} />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Emergency buffer for unexpected expenses and rainy days.</p>
              </div>

              {/* Category 3: Future & Investments */}
              <div className="p-5 rounded-2xl bg-gray-50/60 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 space-y-2.5 hover:border-purple-500/40 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="font-extrabold text-xs text-gray-900 dark:text-zinc-100">Future &amp; Investments</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                      {ratios.investment}%
                    </span>
                  </div>
                  <span className="font-black text-base text-gray-900 dark:text-zinc-50">
                    {formatCurrency(investmentAmt, sandboxCurrency)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${ratios.investment}%` }} />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Wealth-building capital for stocks, real estate, and business growth.</p>
              </div>

              {/* Category 4: Personal & Lifestyle */}
              <div className="p-5 rounded-2xl bg-gray-50/60 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 space-y-2.5 hover:border-amber-500/40 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-extrabold text-xs text-gray-900 dark:text-zinc-100">Personal &amp; Lifestyle</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                      {ratios.discretionary}%
                    </span>
                  </div>
                  <span className="font-black text-base text-gray-900 dark:text-zinc-50">
                    {formatCurrency(discretionaryAmt, sandboxCurrency)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${ratios.discretionary}%` }} />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Guilt-free spending money for dining, recreation, and gifts.</p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 5. FEATURES GRID */}
      <section id="features" className="py-20 bg-gray-50/60 dark:bg-zinc-900/30 border-b border-gray-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#00A896] dark:text-[#00A896]">
              Built For Everyone
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
              Simple Tools to Help You Save & Control Your Money
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300">
              Everything you need to organize your income, track savings goals, and manage your expenses effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4 hover:border-[#00A896]/50 transition-colors shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-[#00A896] dark:text-[#00A896] flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-zinc-50">Smart Category Buckets</h3>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Choose your percentage split once. Every paycheck or freelance payment gets sorted automatically before you spend.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4 hover:border-[#00A896]/50 transition-colors shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-zinc-50">Automatic Record Keeping</h3>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Keep clear, reliable records of every deposit and expense without manual spreadsheet stress or math errors.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4 hover:border-[#00A896]/50 transition-colors shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-zinc-50">Easy Bank Statement Import</h3>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Upload bank statements from OPay, GTBank, Kuda, Zenith, or Chase to automatically organize your income and expenses.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4 hover:border-[#00A896]/50 transition-colors shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-zinc-50">Savings Goal Tracker</h3>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Set clear targets for emergency funds, major purchases, or future plans with visual progress meters.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4 hover:border-[#00A896]/50 transition-colors shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-[#00A896] dark:text-teal-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-zinc-50">Shared Bill Splitter</h3>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Easily divide rent, dining out, or group expenses with friends and track repayments hassle-free.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4 hover:border-[#00A896]/50 transition-colors shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-zinc-50">Multi-Currency Support</h3>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Manage income and expenses easily in NGN, USD, EUR, GBP, or CAD.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-zinc-950 border-b border-gray-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#00A896] dark:text-[#00A896]">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
              How BeforeSpend Helps You Stay in Control
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300">
              Transform how you manage your money in less than 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#00A896] text-white font-black text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">Set Up Your Categories</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Choose percentage splits for Living, Savings, Future, and Fun spending.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#00A896] text-white font-black text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">Log Your Income</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Type in salary deposits or upload your bank statements.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#00A896] text-white font-black text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">Automatic Splitting</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                BeforeSpend calculates exact amounts and sorts your money instantly.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#00A896] text-white font-black text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">Spend Stress-Free</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Spend from your personal bucket knowing your rent and savings are already taken care of.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 7. HIGH-CRAFT BEAUTIFUL TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-20 bg-gray-50/60 dark:bg-zinc-900/40 border-b border-gray-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#00A896] dark:text-[#00A896]">
              Loved By Over 25,000 Users
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
              Real Stories of Financial Peace & Growth
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300">
              See how everyday people, freelancers, and professionals transformed their finances with simple pre-spend allocation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((item, idx) => (
              <div 
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800/90 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden transition-all hover:border-[#00A896]/40"
              >
                {/* Top Rating & Impact */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-[#00A896] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      Verified User
                    </span>
                  </div>

                  <div className="text-xs font-black text-[#00A896] dark:text-[#00A896] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{item.impact}</span>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-normal pt-1">
                    "{item.quote}"
                  </p>
                  {/* User Profile */}
                  <div className="pt-4 flex items-center gap-3">
                    {item.imgUrl ? (
                      <img
                        src={item.imgUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-full object-cover shadow-xs flex-shrink-0 border border-gray-250/60 dark:border-zinc-800"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${item.color} text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0`}>
                        {item.avatar}
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-xs text-gray-900 dark:text-zinc-100">{item.name}</div>
                      <div className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">{item.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. ABOUT US SECTION */}
      <section id="about" className="py-20 bg-white dark:bg-zinc-950 border-b border-gray-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-black uppercase tracking-wider text-[#00A896] dark:text-[#00A896]">
              Our Mission
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-zinc-50 tracking-tight leading-tight">
              We Created BeforeSpend Because Traditional Budgeting Was Too Confusing.
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
              <p>
                Most budget applications ask you to write down expenses *after* money has already left your bank account. By the time you check your monthly report, money has already leaked away.
              </p>
              <p>
                <strong>BeforeSpend turns the process around.</strong> We believe true financial peace comes from planning *before* you spend. By giving every incoming deposit a clear job—paying rent, building savings, or fun spending—you eliminate stress completely.
              </p>
              <p>
                With easy bank statement imports, smart category sorting, and 100% private data security, BeforeSpend gives everyone complete control of their money.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs font-extrabold text-gray-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00A896]" />
                <span>Zero Subscription Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00A896]" />
                <span>100% Private & Safe</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-8 rounded-3xl bg-[#0E2A47] text-white space-y-6 shadow-2xl relative overflow-hidden border border-zinc-800">
              <div className="w-12 h-12 rounded-2xl bg-[#00A896]/20 text-[#00A896] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <blockquote className="text-xs sm:text-sm font-medium leading-relaxed text-zinc-200 italic">
                "Before BeforeSpend, I had money flowing into my account from different clients, but at the end of the month, I couldn't account for where it went. BeforeSpend changed everything—now every payout is sorted before I touch it."
              </blockquote>
              <div className="pt-2 border-t border-zinc-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00A896] text-white font-black text-xs flex items-center justify-center">
                  CO
                </div>
                <div>
                  <div className="font-extrabold text-xs text-white">Chidi Okechukwu</div>
                  <div className="text-[10px] text-zinc-400">UI/UX Designer & Freelancer</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 9. FAQs SECTION */}
      <section id="faqs" className="py-20 bg-gray-50/60 dark:bg-zinc-900/30 border-b border-gray-200/80 dark:border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#00A896] dark:text-[#00A896]">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
              Got Questions? We Have Answers.
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300">
              Learn more about how BeforeSpend makes managing money simple and stress-free.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left font-extrabold text-xs sm:text-sm text-gray-900 dark:text-zinc-100 flex items-center justify-between gap-4 cursor-pointer hover:text-[#00A896] dark:hover:text-[#00A896] min-h-[44px]"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#00A896] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs text-gray-600 dark:text-zinc-300 leading-relaxed border-t border-gray-100 dark:border-zinc-850">
                      <p className="mt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. CONVERSION CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-[#0E2A47] via-slate-900 to-[#00A896] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
            Stop Spending Mindlessly. Start Planning Intentionally Today.
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl mx-auto">
            Join over 25,000 individuals taking control of their financial future with BeforeSpend.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-black rounded-xl bg-[#00A896] hover:bg-teal-400 text-white shadow-lg shadow-[#00A896]/20 cursor-pointer transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                Go to Workspace Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onGoToRegister}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-black rounded-xl bg-[#00A896] hover:bg-teal-400 text-white shadow-lg shadow-[#00A896]/20 cursor-pointer transition-all flex items-center justify-center gap-2 min-h-[48px]"
                >
                  Get Started Free Now
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onGoToLogin}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 cursor-pointer transition-colors min-h-[48px]"
                >
                  Sign In to Existing Account
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-900 py-12 text-xs text-gray-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          
          <div className="space-y-3">
            <BeforeSpendLogo size="md" />
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm">
              The smart way to manage your money before you spend it. Organise your salary, protect your savings, and spend stress-free.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-extrabold text-xs text-gray-900 dark:text-zinc-200 uppercase tracking-wider">Quick Links</div>
            <ul className="flex flex-wrap gap-4 text-xs">
              <li><a href="#features" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">Features</a></li>
              <li><a href="#sandbox" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">Calculator</a></li>
              <li><a href="#how-it-works" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">How It Works</a></li>
              <li><a href="#testimonials" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">Testimonials</a></li>
              <li><a href="#faqs" className="hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors">FAQs</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-zinc-900 pt-6 text-center sm:text-left text-xs text-gray-400">
          © 2026 BeforeSpend is a Product of DirectPadi Ltd.
        </div>
      </footer>

    </div>
  );
}
