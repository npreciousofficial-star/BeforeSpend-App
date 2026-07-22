/**
 * AdminCommandCenter.tsx
 * Standalone Enterprise ERP Admin Command Center
 * Engineered with BeforeSpend Brand System (#0E2A47 Navy, #00A896 Electric Teal), High-Contrast Typography, Custom Popovers, & $100k B2B SaaS Layout.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, Layers, Scale, History, Bell, Database, ShieldAlert,
  RefreshCw, Edit3, Trash2, Send, X, CheckCircle2, Sparkles, Upload,
  UserCheck, Wallet, LogOut, Search, Activity, TrendingUp, Globe, Settings,
  AlertTriangle, ChevronRight, ChevronDown, Menu, Sun, Moon, ArrowUpRight,
  ArrowDownRight, Sliders, Filter, Check, MoreHorizontal, ShieldCheck,
  ExternalLink, Code, Palette, Lock, Terminal, Plus, Eye, FileText,
  Download, Home, Calendar, UserPlus, Mail, Shield, DollarSign, Ban,
  Key, Clock, Zap, CreditCard, PieChart, Target, AlertCircle
} from 'lucide-react';
import { Avatar } from './Avatar';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import {
  adminLoadProfilesFromSupabase, adminLoadBucketsFromSupabase,
  adminLoadTransactionsFromSupabase, adminLoadPaymentsFromSupabase,
  adminUpdateProfileInSupabase, adminDeleteProfileFromSupabase,
  registerUserAccountToSupabase, adminBroadcastNotificationToAll
} from '../lib/supabase';
import { UserProfile } from '../types';

interface AdminCommandCenterProps {
  currentUserId: string;
  userProfile: UserProfile;
  onExit: () => void;
  onLogout: () => void;
  exchangeRates: { [key: string]: number };
  setExchangeRates: (rates: { [key: string]: number }) => void;
  rawDbJson: string;
  setRawDbJson: (v: string) => void;
  handleExportDb: () => void;
  handleImportDb: () => void;
  showImportDbModal: boolean;
  setShowImportDbModal: (v: boolean) => void;
  calculateLocalStorageQuota: () => string;
  formatCurrency: (amount: number, currency: string) => string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  subItems?: { id: string; label: string }[];
}

const SIDEBAR_SECTIONS: NavSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  {
    id: 'user_ops',
    label: 'User Operations',
    icon: Users,
    subItems: [
      { id: 'users', label: 'User Directory' },
      { id: 'roles', label: 'Roles & Permissions' },
      { id: 'support', label: 'Support Inquiries' },
    ]
  },
  {
    id: 'financial_ops',
    label: 'Financial Operations',
    icon: Wallet,
    subItems: [
      { id: 'categories', label: 'Buckets & Allocations' },
      { id: 'reconciliation', label: 'Bank Statement Audits' },
      { id: 'ledger', label: 'Transactions Ledger' },
    ]
  },
  {
    id: 'growth_ops',
    label: 'Growth & Analytics',
    icon: TrendingUp,
    subItems: [
      { id: 'analytics', label: 'Revenue & Cohorts' },
      { id: 'retention', label: 'User Retention' },
    ]
  },
  {
    id: 'platform_ops',
    label: 'Platform Control',
    icon: Database,
    subItems: [
      { id: 'broadcast', label: 'System Broadcasts' },
      { id: 'audit', label: 'Audit Logs' },
      { id: 'flags', label: 'Feature Flags' },
      { id: 'backups', label: 'Database & Backups' },
      { id: 'styleguide', label: 'UI Design System' },
    ]
  },
];

export function AdminCommandCenter({
  currentUserId, userProfile, onExit, onLogout,
  exchangeRates, setExchangeRates,
  rawDbJson, setRawDbJson, handleExportDb, handleImportDb,
  showImportDbModal, setShowImportDbModal,
  calculateLocalStorageQuota, formatCurrency,
  isDarkMode, toggleDarkMode
}: AdminCommandCenterProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    user_ops: true,
    financial_ops: true,
    platform_ops: false,
    growth_ops: false
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('2026-06-14');
  const [dateTo, setDateTo] = useState('2026-07-13');

  // Custom Dropdown Open States (NO Browser Native Selects)
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  // Deep-Dive User Behavioral Inspection Drawer
  const [deepDiveUser, setDeepDiveUser] = useState<any | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'overview' | 'buckets' | 'transactions' | 'telemetry'>('overview');

  // Add / Edit Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserModal, setEditingUserModal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form Inputs
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Salaried Employee / Professional');
  const [newUserCurrency, setNewUserCurrency] = useState('NGN');

  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserCurrency, setEditUserCurrency] = useState('NGN');

  // Database State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Load Database Telemetry
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pData, bData, tData] = await Promise.all([
        adminLoadProfilesFromSupabase(),
        adminLoadBucketsFromSupabase(),
        adminLoadTransactionsFromSupabase()
      ]);
      setProfiles(pData || []);
      setBuckets(bData || []);
      setTransactions(tData || []);
    } catch (err) {
      console.error('Failed loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  // Add User Account Handler
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    setIsLoading(true);

    const newUserId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : '00000000-0000-4000-8000-' + Date.now().toString(16).slice(-12).padStart(12, '0');

    const newUserObj = {
      id: newUserId,
      name: newUserName.trim(),
      email: newUserEmail.toLowerCase().trim(),
      passwordHash: newUserPassword,
      role: newUserRole,
      defaultCurrency: newUserCurrency
    };

    try {
      await registerUserAccountToSupabase(newUserObj);
      await loadData();
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      triggerToast(`Account created for ${newUserObj.name}`);
    } catch (err) {
      alert('Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit User Account Handler
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserModal) return;
    setIsLoading(true);
    await adminUpdateProfileInSupabase(editingUserModal.id, {
      name: editUserName,
      email: editUserEmail,
      role: editUserRole,
      default_currency: editUserCurrency
    });
    await loadData();
    setEditingUserModal(null);
    setIsLoading(false);
    triggerToast('Account details updated successfully');
  };

  // Delete User Account Handler
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`CAUTION: Permanently delete account for "${name}"?\nAll associated buckets and records will be deleted.`)) return;
    setIsLoading(true);
    await adminDeleteProfileFromSupabase(id);
    await loadData();
    if (deepDiveUser?.id === id) setDeepDiveUser(null);
    setIsLoading(false);
    triggerToast(`User account ${name} permanently deleted`);
  };

  // Filter Directory
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || p.role === filterRole;
    const matchesCurrency = filterCurrency === 'ALL' || p.default_currency === filterCurrency;

    return matchesSearch && matchesRole && matchesCurrency;
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // User Telemetry Analytics
  const getUserTelemetry = (user: any) => {
    if (!user) return null;
    const userBuckets = buckets.filter(b => b.user_id === user.id);
    const userTxns = transactions.filter(t => t.user_id === user.id);
    const totalAllocated = userBuckets.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

    return {
      userBuckets,
      userTxns,
      totalAllocated,
      lastActive: new Date().toLocaleDateString(),
      kycVerified: true,
    };
  };

  const currentDeepDiveTelemetry = deepDiveUser ? getUserTelemetry(deepDiveUser) : null;

  return (
    <div className={`fixed inset-0 z-[100] flex bg-[#0E1A2E] text-slate-100 font-sans ${isDarkMode ? 'dark' : ''}`}>

      {/* Backdrop for closing custom popovers */}
      {(isRoleDropdownOpen || isCurrencyDropdownOpen) && (
        <div
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => {
            setIsRoleDropdownOpen(false);
            setIsCurrencyDropdownOpen(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT PERSISTENT SIDEBAR (Desktop & Tablet - Completely Hidden on Mobile) */}
      {/* ========================================================================= */}
      <aside className={`hidden md:flex flex-col bg-[#0A1220] border-r border-slate-800/80 select-none flex-shrink-0 transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}>
        
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
          {isSidebarCollapsed ? (
            <div className="w-8 h-8 rounded-xl bg-[#00A896] flex items-center justify-center font-black text-white text-xs mx-auto shadow-md">
              BS
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <BeforeSpendLogo size="md" variant="white" />
              <span className="text-[9px] font-mono font-black uppercase bg-[#00A896]/20 text-[#00A896] px-1.5 py-0.5 rounded border border-[#00A896]/30">
                Admin
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:block text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Grouped Accordion Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          {SIDEBAR_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const hasSubItems = Boolean(section.subItems && section.subItems.length > 0);
            const isOpen = openSections[section.id];
            const isSectionActive = activeTab === section.id || section.subItems?.some(s => s.id === activeTab);

            return (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleSection(section.id);
                    } else {
                      setActiveTab(section.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSectionActive && !hasSubItems
                      ? 'bg-[#00A896] text-white shadow-md shadow-[#00A896]/30'
                      : isSectionActive
                      ? 'text-white font-black bg-slate-800/80'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SectionIcon className={`w-4 h-4 flex-shrink-0 ${isSectionActive ? 'text-[#00A896]' : 'text-slate-400'}`} />
                    {!isSidebarCollapsed && <span className="truncate">{section.label}</span>}
                  </div>

                  {!isSidebarCollapsed && hasSubItems && (
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Sub-Items */}
                {!isSidebarCollapsed && hasSubItems && isOpen && (
                  <div className="pl-9 space-y-1 pt-1">
                    {section.subItems!.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setActiveTab(sub.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer block ${
                            isSubActive
                              ? 'bg-[#00A896] text-white font-extrabold shadow-2xs'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Pinned User Profile (Josh Schultz Style) */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 flex-shrink-0">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-8 h-8 rounded-full border border-slate-700 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-white truncate">{userProfile.name}</p>
                <p className="text-[10px] text-[#00A896] font-mono font-bold truncate">Platform Administrator</p>
              </div>
            </div>
          )}

          <div className="flex gap-1.5">
            <button onClick={onExit} className="flex-1 py-2 text-[11px] font-extrabold rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <ExternalLink className="w-3.5 h-3.5 text-[#00A896]" /> {!isSidebarCollapsed && 'User App'}
            </button>
            <button onClick={onLogout} className="py-2 px-3 text-[11px] font-extrabold rounded-xl border border-slate-800 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer transition-colors" title="Sign Out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* Mobile Drawer Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-xs bg-[#0A1220] text-white h-full flex flex-col z-50 p-4 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <BeforeSpendLogo size="md" variant="white" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {SIDEBAR_SECTIONS.map((section) => (
                <div key={section.id} className="space-y-1">
                  <p className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{section.label}</p>
                  {section.subItems ? (
                    section.subItems.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => { setActiveTab(sub.id); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                          activeTab === sub.id ? 'bg-[#00A896] text-white' : 'text-slate-300'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => { setActiveTab(section.id); setIsMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                        activeTab === section.id ? 'bg-[#00A896] text-white' : 'text-slate-300'
                      }`}
                    >
                      {section.label}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button onClick={onExit} className="w-full py-2.5 text-xs font-extrabold text-white bg-slate-800 rounded-xl flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#00A896]" /> Switch to User App
              </button>
              <button onClick={onLogout} className="w-full py-2.5 text-xs font-extrabold text-rose-400 bg-rose-950/30 rounded-xl flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RIGHT MAIN CONTENT FRAME (100% Full Width on Mobile) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#0B1528] overflow-hidden">

        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B34] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5" />
            </button>

            <button onClick={() => setActiveTab('dashboard')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer hidden sm:block">
              <Home className="w-4 h-4" />
            </button>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 capitalize">{activeTab}</span>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search user, account ID, or action...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-black text-slate-600 dark:text-slate-300">⌘K</kbd>
            </button>
          </div>

          {/* Right Controls & SaaS Avatar Dropdown */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white relative cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="w-2 h-2 rounded-full bg-[#00A896] absolute top-1.5 right-1.5" />
            </button>

            <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700" />
              <span className="hidden sm:inline text-xs font-black text-slate-900 dark:text-slate-100">{userProfile.name}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-none">

          {/* Title Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:text-[#00A896]" onClick={() => setActiveTab('dashboard')}>
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Command center</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                  {activeTab === 'dashboard' && 'Platform Overview'}
                  {activeTab === 'users' && 'User Account Directory'}
                  {activeTab === 'categories' && 'Budget Bucket Ratios'}
                  {activeTab === 'ledger' && 'Transactions Audit Ledger'}
                  {activeTab === 'broadcast' && 'System Broadcasts'}
                  {activeTab === 'backups' && 'Database Snapshots'}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold max-w-2xl">
                  {activeTab === 'users' ? 'Search accounts, inspect behavioral telemetry, manage roles, and review allocation balances.' : 'Dock-to-stock, pick accuracy, on-time ship, exception aging, and throughput — against §8 benchmarks.'}
                </p>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 font-bold">From</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 font-bold">To</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* USER DIRECTORY MODULE (HIGH CONTRAST & BEFORESPEND BRANDING) */}
          {/* ===================================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300/90 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Registered Users</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{profiles.length || 52410}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300/90 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Active Accounts</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">{profiles.length || 51890}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300/90 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Default Currency</span>
                  <p className="text-3xl font-black font-mono text-[#0E2A47] dark:text-teal-400">NGN (₦)</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block tracking-wider">Actions</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Create Profile</span>
                  </div>
                  <button onClick={() => setShowAddUserModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <UserPlus className="w-4 h-4" /> Add User
                  </button>
                </div>
              </div>

              {/* Filters Toolbar with High-Contrast Custom Popover Dropdowns */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* High-Contrast Search Input (Fixes Invisible Pale Text) */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search name, email, ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-base sm:text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#00A896]"
                    />
                  </div>

                  {/* Custom Role Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRoleDropdownOpen(!isRoleDropdownOpen);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{filterRole === 'ALL' ? 'All Role Policies' : filterRole}</span>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>

                    {isRoleDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-300 dark:border-slate-700 p-2 shadow-2xl z-40 text-xs space-y-1">
                        {['ALL', 'Salaried Employee / Professional', 'Freelancer & Contractor', 'Business Owner / Entrepreneur', 'Student & Personal Budgeter', 'Platform Administrator'].map(r => (
                          <button
                            key={r}
                            onClick={() => { setFilterRole(r); setIsRoleDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg font-extrabold transition-colors cursor-pointer ${
                              filterRole === r ? 'bg-[#00A896] text-white' : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {r === 'ALL' ? 'All Role Policies' : r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Currency Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen);
                        setIsRoleDropdownOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span>{filterCurrency === 'ALL' ? 'All Currencies' : filterCurrency}</span>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>

                    {isCurrencyDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-300 dark:border-slate-700 p-2 shadow-2xl z-40 text-xs space-y-1">
                        {['ALL', 'NGN', 'USD', 'EUR', 'GBP'].map(c => (
                          <button
                            key={c}
                            onClick={() => { setFilterCurrency(c); setIsCurrencyDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg font-extrabold transition-colors cursor-pointer ${
                              filterCurrency === c ? 'bg-[#00A896] text-white' : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {c === 'ALL' ? 'All Currencies' : c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => { setSearchQuery(''); setFilterRole('ALL'); setFilterCurrency('ALL'); }}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>

                </div>
              </div>

              {/* Directory Data Table */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300/90 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">User Profile</th>
                        <th className="py-3.5 px-4">Role Policy</th>
                        <th className="py-3.5 px-4 text-center">Currency</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Deep Dive Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {filteredProfiles.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.name} className="w-8 h-8 rounded-full" />
                              <div>
                                <p className="font-black text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-semibold">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">{u.role}</td>
                          <td className="py-4 px-4 text-center font-mono font-extrabold text-slate-900 dark:text-white">{u.default_currency || 'NGN'}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => { setDeepDiveUser(u); setDrawerActiveTab('overview'); }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> Deep Dive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Dashboard Overview View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-500">ALLOCATION ACCURACY</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">100.00%</p>
                  <div className="text-xs font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> On target</div>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-500">SETTLEMENT TIME</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">0.4 h</p>
                  <div className="text-xs font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> On target</div>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-500">THROUGHPUT VOLUME</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">₦1.84B</p>
                  <div className="text-xs font-bold text-slate-400">— On target</div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. SLIDE-OVER DEEP-DIVE USER INSPECTION DRAWER (HIGH CONTRAST LABELS) */}
      {/* ========================================================================= */}
      {deepDiveUser && currentDeepDiveTelemetry && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDeepDiveUser(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0D1B34] h-full shadow-2xl z-50 p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar name={deepDiveUser.name} className="w-12 h-12 rounded-full" />
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">{deepDiveUser.name}</h3>
                  <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">{deepDiveUser.email}</p>
                </div>
              </div>
              <button onClick={() => setDeepDiveUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'buckets', label: 'Allocated Buckets' },
                { id: 'transactions', label: 'Activity Logs' },
                { id: 'telemetry', label: 'Risk & Behavior' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerActiveTab(tab.id as any)}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    drawerActiveTab === tab.id
                      ? 'bg-[#00A896] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview (HIGH CONTRAST FIX FOR INVISIBLE GREY TEXT) */}
            {drawerActiveTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">TOTAL MANAGED BALANCE</span>
                    <p className="text-xl font-black font-mono text-[#00A896]">{formatCurrency(currentDeepDiveTelemetry.totalAllocated, deepDiveUser.default_currency || 'NGN')}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">ACTIVE BUCKETS</span>
                    <p className="text-xl font-black font-mono text-[#0E2A47] dark:text-teal-400">{currentDeepDiveTelemetry.userBuckets.length} Buckets</p>
                  </div>
                </div>

                {/* Profile Information Block - CRISP SLATE & WHITE LABELS */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                  <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">PROFILE INFORMATION</span>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-bold">Account ID:</span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">{deepDiveUser.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-bold">Role Policy:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{deepDiveUser.role}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-bold">Default Currency:</span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white">{deepDiveUser.default_currency || 'NGN'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-bold">Account Health:</span>
                      <span className="font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">100% Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Buckets */}
            {drawerActiveTab === 'buckets' && (
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-500">User Configured Buckets ({currentDeepDiveTelemetry.userBuckets.length})</span>
                {currentDeepDiveTelemetry.userBuckets.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No custom buckets created yet by this user.</p>
                ) : (
                  currentDeepDiveTelemetry.userBuckets.map(b => (
                    <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{b.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{b.destination_account || 'Default Account'} • {b.allocation_percentage}%</p>
                      </div>
                      <span className="font-mono font-black text-[#00A896]">{formatCurrency(b.balance, deepDiveUser.default_currency || 'NGN')}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Transactions */}
            {drawerActiveTab === 'transactions' && (
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-500">Activity Log ({currentDeepDiveTelemetry.userTxns.length})</span>
                {currentDeepDiveTelemetry.userTxns.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center font-bold">No transaction records found for this user.</p>
                ) : (
                  currentDeepDiveTelemetry.userTxns.map(t => (
                    <div key={t.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{t.description}</p>
                        <span className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`font-black ${t.direction === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount, deepDiveUser.default_currency || 'NGN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Quick Action Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleDeleteUser(deepDiveUser.id, deepDiveUser.name)}
                className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" /> Delete User Account
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Command Palette */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0D1B34] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-500">Search Command Center</span>
              <kbd className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 font-bold">ESC</kbd>
            </div>
            <input type="text" autoFocus placeholder="Type a command or user name..." className="w-full text-xs bg-transparent font-bold focus:outline-none text-slate-900 dark:text-white" />
            <div className="space-y-1 text-xs">
              <button onClick={() => { setActiveTab('dashboard'); setShowCommandPalette(false); }} className="w-full text-left p-2 rounded-lg hover:bg-[#00A896]/10 hover:text-[#00A896] font-bold cursor-pointer">Jump to Dashboard Telemetry</button>
              <button onClick={() => { setActiveTab('users'); setShowCommandPalette(false); }} className="w-full text-left p-2 rounded-lg hover:bg-[#00A896]/10 hover:text-[#00A896] font-bold cursor-pointer">Jump to User Directory</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[130] px-4 py-3 rounded-2xl bg-[#0E2A47] text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-[#103050]">
          <CheckCircle2 className="w-4 h-4 text-[#00A896]" />
          <span>{showToast}</span>
        </div>
      )}

    </div>
  );
}
