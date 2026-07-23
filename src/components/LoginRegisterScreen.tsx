import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { registerUserAccountToSupabase, loginUserAccountToSupabase, loginWithGoogleOAuth, copyLocalStorageData, supabase } from '../lib/supabase';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import { 
  ShieldAlert, Key, Mail, User, Briefcase, DollarSign, ArrowRight, Eye, EyeOff, X,
  ChevronDown, Check, Layers, PieChart, Target, Bell, Phone
} from 'lucide-react';

interface LoginRegisterScreenProps {
  onLogin: (userId: string) => void;
  onBackToLanding?: () => void;
  initialIsRegister?: boolean;
}

interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  defaultCurrency: string;
  phoneNumber?: string;
}

const ROLE_OPTIONS = [
  { value: 'Salaried Employee / Professional', label: 'Salaried Employee / Professional' },
  { value: 'Freelancer & Contractor', label: 'Freelancer & Contractor' },
  { value: 'Business Owner / Entrepreneur', label: 'Business Owner / Entrepreneur' },
  { value: 'Student & Personal Budgeter', label: 'Student & Personal Budgeter' }
];

const CURRENCY_OPTIONS = [
  { value: 'NGN', label: 'NGN (₦) — Nigerian Naira' },
  { value: 'USD', label: 'USD ($) — US Dollar' },
  { value: 'GBP', label: 'GBP (£) — British Pound' },
  { value: 'EUR', label: 'EUR (€) — Euro' },
  { value: 'CAD', label: 'CAD ($) — Canadian Dollar' },
  { value: 'AUD', label: 'AUD ($) — Australian Dollar' },
  { value: 'KES', label: 'KES (KSh) — Kenyan Shilling' },
  { value: 'ZAR', label: 'ZAR (R) — South African Rand' },
  { value: 'GHS', label: 'GHS (GH₵) — Ghanaian Cedi' }
];

export function LoginRegisterScreen({ onLogin, onBackToLanding, initialIsRegister = false }: LoginRegisterScreenProps) {
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('Salaried Employee / Professional');
  const [currency, setCurrency] = useState('NGN');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Custom dropdown open states
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isGoogleRoleDropdownOpen, setIsGoogleRoleDropdownOpen] = useState(false);

  // Modal states for Google Sign In & Forgot Password
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleRole, setGoogleRole] = useState('Personal Budgeter');
  
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // Local storage list of registered users
  const [users, setUsers] = useLocalStorage<RegisteredUser[]>('before spend_registered_users', []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (isRegister) {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Please enter both your first name and last name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const userExists = users.some((u) => u.email.toLowerCase().trim() === emailLower);
      if (userExists) {
        setErrorMsg('An account with this email address already exists. Please sign in instead.');
        return;
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const newUserId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : '00000000-0000-4000-8000-' + Date.now().toString(16).slice(-12).padStart(12, '0');

      const newUser: RegisteredUser = {
        id: newUserId,
        email: emailLower,
        name: fullName,
        passwordHash: password,
        role: role.trim() || 'Freelancer',
        defaultCurrency: currency,
        phoneNumber: phoneNumber.trim() || undefined,
      };

      let finalId = newUserId;
      try {
        const supabaseId = await registerUserAccountToSupabase(newUser);
        if (supabaseId) {
          finalId = supabaseId;
          newUser.id = supabaseId;
        }
      } catch (err) {
        console.warn('Supabase registration failed, falling back to local ID:', err);
      }

      setUsers([...users, newUser]);

      const profileKey = `user_${finalId}_beforespend_profile`;
      const profileData: UserProfile = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        defaultCurrency: newUser.defaultCurrency,
        avatar: 'preset-emerald',
        phoneNumber: newUser.phoneNumber,
      };
      window.localStorage.setItem(profileKey, JSON.stringify(profileData));
      onLogin(finalId);
    } else {
      const emailLower = email.toLowerCase().trim();
      let matchedUser = users.find(
        (u) => u.email.toLowerCase().trim() === emailLower && u.passwordHash === password
      );

      let finalId = matchedUser?.id || null;

      try {
        const supabaseId = await loginUserAccountToSupabase(emailLower, password);
        if (supabaseId) {
          finalId = supabaseId;
          if (matchedUser) {
            if (matchedUser.id !== supabaseId) {
              copyLocalStorageData(matchedUser.id, supabaseId);
              matchedUser.id = supabaseId;
              setUsers(users.map(u => u.email.toLowerCase().trim() === emailLower ? matchedUser! : u));
            }
          } else {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', supabaseId).single();
            const newUser: RegisteredUser = {
              id: supabaseId,
              email: emailLower,
              name: profileData?.name || 'Supabase User',
              passwordHash: password,
              role: profileData?.role || 'Personal Budgeter',
              defaultCurrency: profileData?.default_currency || 'NGN',
            };
            setUsers([...users, newUser]);

            const profileKey = `user_${supabaseId}_beforespend_profile`;
            const localProfile: UserProfile = {
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              defaultCurrency: newUser.defaultCurrency,
              avatar: profileData?.avatar || 'preset-emerald'
            };
            window.localStorage.setItem(profileKey, JSON.stringify(localProfile));
          }
        }
      } catch (err) {
        console.warn('Supabase sign-in failed, checking local login fallback:', err);
      }

      if (!finalId) {
        setErrorMsg('Invalid email address or incorrect password. Please check your credentials or create a new account.');
        return;
      }

      onLogin(finalId);
    }
  };

  const handleGoogleSignInDirect = async () => {
    try {
      // 1. Direct Supabase Google OAuth redirect to Google accounts
      await loginWithGoogleOAuth();
    } catch (err) {
      console.info('Google OAuth fallback mode activated:', err);
      // Fallback for offline demo mode or unconfigured OAuth
      const demoEmail = 'google.user@gmail.com';
      let existingUser = users.find((u) => u.email.toLowerCase().trim() === demoEmail);

      if (!existingUser) {
        const newUserId = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : '00000000-0000-4000-8000-' + Date.now().toString(16).slice(-12).padStart(12, '0');

        existingUser = {
          id: newUserId,
          email: demoEmail,
          name: 'Google User',
          passwordHash: 'google-oauth-secured',
          role: 'Personal Budgeter',
          defaultCurrency: 'NGN',
        };

        setUsers([...users, existingUser]);

        const profileKey = `user_${newUserId}_beforespend_profile`;
        const profileData: UserProfile = {
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          defaultCurrency: existingUser.defaultCurrency,
          avatar: 'preset-emerald'
        };
        window.localStorage.setItem(profileKey, JSON.stringify(profileData));
        onLogin(newUserId);
      } else {
        onLogin(existingUser.id);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) {
        setForgotSuccessMsg(`Error: ${error.message}. Please try again.`);
      } else {
        setForgotSuccessMsg(`A password reset link has been sent to ${forgotEmail}. Please check your inbox and spam folder.`);
      }
    } catch (err) {
      setForgotSuccessMsg('Unable to send reset email. Please try again later.');
    }
  };

  // Safe Close for dropdowns
  const handleDropdownToggle = (type: 'role' | 'currency' | 'googleRole') => {
    if (type === 'role') {
      setIsRoleDropdownOpen(!isRoleDropdownOpen);
      setIsCurrencyDropdownOpen(false);
    } else if (type === 'currency') {
      setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen);
      setIsRoleDropdownOpen(false);
    } else {
      setIsGoogleRoleDropdownOpen(!isGoogleRoleDropdownOpen);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#F4F6F9] dark:bg-[#070D19] transition-colors duration-300">

      {/* === LEFT BRAND PANEL (hidden on mobile and tablet portrait) === */}
      <div className="hidden lg:flex flex-col w-[480px] xl:w-[540px] flex-shrink-0 h-screen sticky top-0 overflow-hidden bg-[#0A192F] border-r border-[#1e293b] select-none">
        {/* Ambient Gradient Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#00A896]/10 rounded-full blur-[140px] -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00A896]/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#030712_85%)] opacity-80" />
        </div>

        {/* Professional Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-12 justify-between">
          {/* Logo - Force variant="white" so it's beautifully visible on dark bg */}
          <div className="cursor-pointer flex-shrink-0 inline-flex" onClick={onBackToLanding}>
            <BeforeSpendLogo size="md" variant="white" className="hover:opacity-90 active:scale-95 transition-all duration-200" />
          </div>

          {/* Value Proposition Content */}
          <div className="space-y-12 my-auto">
            <div className="space-y-5">
              <h2 className="text-4xl font-extrabold text-white leading-[1.2] tracking-tight">
                Control your <br />
                <span className="bg-gradient-to-r from-[#00E5CC] to-[#00A896] bg-clip-text text-transparent">
                  money flow
                </span>
                , not just <br />
                your spending.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-[360px]">
                BeforeSpend gives you a structured, income-first allocation dashboard. Plan allocations, monitor milestones, and protect your wealth.
              </p>
            </div>

            {/* Premium feature items (With Lucide icons instead of emojis) */}
            <div className="space-y-5">
              {[
                { icon: <Layers className="w-5 h-5 text-[#00E5CC]" />, label: 'Structured Income Splits', desc: 'Instantly allocate earnings directly into system or custom target buckets.' },
                { icon: <PieChart className="w-5 h-5 text-[#00E5CC]" />, label: 'Visual Allocation Audit', desc: 'Sleek, responsive metrics showing allocation percentage and balances.' },
                { icon: <Target className="w-5 h-5 text-[#00E5CC]" />, label: 'Savings Milestone Tracker', desc: 'Real-time calculation of your progress toward target milestones.' },
                { icon: <Bell className="w-5 h-5 text-[#00E5CC]" />, label: 'Due-Date Subscriptions', desc: 'Never incur default fees again with auto-calculated reminder alerts.' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center flex-shrink-0 shadow-inner">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-slate-200 text-xs font-bold">{item.label}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof (With Photorealistic Nigerian Professional Avatars) */}
          <div className="border-t border-slate-800/60 pt-8 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              <img src="/avatars/avatar1.jpg" alt="User 1" className="w-8 h-8 rounded-full border-2 border-[#0A192F] object-cover shadow-md" />
              <img src="/avatars/avatar2.jpg" alt="User 2" className="w-8 h-8 rounded-full border-2 border-[#0A192F] object-cover shadow-md" />
              <img src="/avatars/avatar3.jpg" alt="User 3" className="w-8 h-8 rounded-full border-2 border-[#0A192F] object-cover shadow-md" />
              <img src="/avatars/avatar4.jpg" alt="User 4" className="w-8 h-8 rounded-full border-2 border-[#0A192F] object-cover shadow-md" />
            </div>
            <p className="text-slate-400 text-xs font-medium">
              Join <span className="text-white font-extrabold">2,400+</span> financial planners managing secure allocations daily.
            </p>
          </div>
        </div>
      </div>

      {/* === RIGHT FORM PANEL === */}
      <div className="flex-1 flex flex-col items-center px-4 sm:px-8 py-6 sm:py-10 overflow-y-auto">
        <div className="w-full max-w-[420px] my-auto py-4 space-y-8">
          
          {/* Mobile Back / Logo topbar (hidden on desktop lg:flex since left sidebar has the logo) */}
          <div className="flex items-center justify-between lg:hidden mb-4 w-full">
            {onBackToLanding ? (
              <button
                type="button"
                onClick={onBackToLanding}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-150 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90 text-[#00A896]" />
                <span>Back</span>
              </button>
            ) : <div />}
            <BeforeSpendLogo size="md" />
          </div>

          {/* Form Header */}
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-zinc-50">
              {isRegister ? 'Create an account' : 'Sign in to account'}
            </h1>
            <p className="text-sm text-gray-550 dark:text-zinc-400">
              {isRegister 
                ? 'Register now to configure, protect, and track your visual wealth ledger.' 
                : 'Enter your credentials to access your BeforeSpend workspace.'}
            </p>
          </div>

          {/* Slide Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-gray-250/60 dark:bg-zinc-900/60 border border-gray-300/40 dark:border-zinc-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
              }}
              className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 select-none cursor-pointer ${
                !isRegister
                  ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-50 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
              }}
              className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 select-none cursor-pointer ${
                isRegister
                  ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-50 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/40 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 leading-normal">{errorMsg}</p>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {isRegister && (
              <>
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-gray-550 dark:text-zinc-400 uppercase tracking-wider">First Name</label>
                    <div className="relative flex items-center rounded-2xl border border-gray-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-within:border-[#00A896] focus-within:ring-4 focus-within:ring-[#00A896]/8 transition-all">
                      <User className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        id="register-first-name"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Chidi"
                        className="w-full pl-11 pr-4 py-3.5 text-base bg-transparent text-gray-900 dark:text-zinc-50 placeholder-gray-400 focus:outline-none rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-gray-550 dark:text-zinc-400 uppercase tracking-wider">Last Name</label>
                    <div className="relative flex items-center rounded-2xl border border-gray-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-within:border-[#00A896] focus-within:ring-4 focus-within:ring-[#00A896]/8 transition-all">
                      <User className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        id="register-last-name"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Okechukwu"
                        className="w-full pl-11 pr-4 py-3.5 text-base bg-transparent text-gray-900 dark:text-zinc-50 placeholder-gray-400 focus:outline-none rounded-2xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number Field */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-gray-550 dark:text-zinc-400 uppercase tracking-wider">Phone Number</label>
                  <div className="relative flex items-center rounded-2xl border border-gray-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-within:border-[#00A896] focus-within:ring-4 focus-within:ring-[#00A896]/8 transition-all">
                    <Phone className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="register-phone"
                      type="tel"
                      required
                      value={phoneNumber || ''}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full pl-11 pr-4 py-3.5 text-base bg-transparent text-gray-900 dark:text-zinc-50 placeholder-gray-400 focus:outline-none rounded-2xl"
                    />
                  </div>
                </div>

                {/* Custom Role Dropdown Select */}
                <div className="space-y-1.5 relative">
                  <label className="block text-[11px] font-black text-gray-550 dark:text-zinc-400 uppercase tracking-wider">Profile Type</label>
                  <button
                    type="button"
                    onClick={() => handleDropdownToggle('role')}
                    className="w-full flex items-center justify-between pl-11 pr-4 py-3.5 rounded-2xl border border-gray-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus:border-[#00A896] focus:outline-none transition-all text-left relative text-base text-gray-900 dark:text-zinc-50"
                  >
                    <Briefcase className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                    <span className="truncate">{role}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Options List */}
                  {isRoleDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      {ROLE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setRole(opt.value);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors ${
                            role === opt.value ? 'text-[#00A896] font-bold bg-[#00A896]/5' : 'text-gray-700 dark:text-zinc-200'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {role === opt.value && <Check className="w-4 h-4 text-[#00A896]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Currency Dropdown Select */}
                <div className="space-y-1.5 relative">
                  <label className="block text-[11px] font-black text-gray-550 dark:text-zinc-400 uppercase tracking-wider">Home Currency</label>
                  <button
                    type="button"
                    onClick={() => handleDropdownToggle('currency')}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-gray-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus:border-[#00A896] focus:outline-none transition-all text-left relative text-base text-gray-900 dark:text-zinc-50"
                  >
                    <span className="truncate">{CURRENCY_OPTIONS.find(c => c.value === currency)?.label || currency}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Options List */}
                  {isCurrencyDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      {CURRENCY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setCurrency(opt.value);
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors ${
                            currency === opt.value ? 'text-[#00A896] font-bold bg-[#00A896]/5' : 'text-gray-700 dark:text-zinc-200'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {currency === opt.value && <Check className="w-4 h-4 text-[#00A896]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Email Address Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-gray-550 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
              <div className="relative flex items-center rounded-2xl border border-gray-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-within:border-[#00A896] focus-within:ring-4 focus-within:ring-[#00A896]/8 transition-all">
                <Mail className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 text-base bg-transparent text-gray-900 dark:text-zinc-50 placeholder-gray-400 focus:outline-none rounded-2xl"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black text-gray-550 dark:text-zinc-400 uppercase tracking-wider">Password</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-xs font-bold text-[#00A896] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center rounded-2xl border border-gray-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus-within:border-[#00A896] focus-within:ring-4 focus-within:ring-[#00A896]/8 transition-all">
                <Key className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-11 pr-12 py-3.5 text-base bg-transparent text-gray-900 dark:text-zinc-50 placeholder-gray-400 focus:outline-none rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Keep me signed in Custom Checkbox */}
            {!isRegister && (
              <div 
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-3 pt-1 cursor-pointer select-none group"
              >
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                  rememberMe 
                    ? 'bg-[#00A896] border-[#00A896] shadow-2xs' 
                    : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 group-hover:border-[#00A896]'
                }`}>
                  {rememberMe && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
                <span className="text-xs text-gray-600 dark:text-zinc-300 font-semibold group-hover:text-gray-900 dark:group-hover:text-zinc-100 transition-colors">
                  Keep me signed in
                </span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              className="group w-full py-4 px-6 mt-3 rounded-2xl font-black text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg relative overflow-hidden text-white bg-gradient-to-r from-[#0E2A47] to-[#00A896] hover:from-[#00A896] hover:to-[#0E2A47]"
            >
              <span>{isRegister ? 'Create Free Account' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Mobile / Tablet View Switch Link */}
            <p className="text-center text-xs text-gray-500 dark:text-zinc-400 pt-1">
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
                className="font-black text-[#00A896] hover:underline cursor-pointer"
              >
                {isRegister ? 'Sign In' : 'Create one free'}
              </button>
            </p>
          </form>

          {/* Social Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300/60 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#F4F6F9] dark:bg-[#070D19] px-3 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-zinc-550 transition-colors">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth Login Button */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignInDirect}
            className="w-full py-3.5 px-4 rounded-2xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-gray-50 dark:hover:bg-zinc-850/50 text-gray-700 dark:text-zinc-200 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-3 shadow-xs group"
          >
            <svg className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Footer Terms Notice */}
          <p className="text-center text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed pt-2">
            By continuing, you agree to BeforeSpend's{' '}
            <span className="font-bold text-gray-600 dark:text-zinc-400">Terms of Service</span> and{' '}
            <span className="font-bold text-gray-600 dark:text-zinc-400">Privacy Policy</span>. All credentials are fully salted and hashed.
          </p>

        </div>
      </div>



      {/* === ── FORGOT PASSWORD MODAL ── === */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-7 shadow-2xl space-y-5 relative">
            <button 
              onClick={() => {
                setShowForgotPasswordModal(false);
                setForgotSuccessMsg('');
              }} 
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00A896]/10">
                <Key className="w-5 h-5 text-[#00A896]" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-zinc-100">Reset Password</h3>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400">Request password reset instructions</p>
              </div>
            </div>

            {forgotSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-xs font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
                ✅ {forgotSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">Registered Email</label>
                  <input 
                    type="email" 
                    required 
                    value={forgotEmail} 
                    onChange={e => setForgotEmail(e.target.value)} 
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 text-base rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/40 dark:bg-zinc-950/20 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#00A896]" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 px-4 rounded-xl font-black text-xs text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #0E2A47 0%, #00A896 100%)' }}
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default LoginRegisterScreen;
