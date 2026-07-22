/**
 * AdminCommandCenter.tsx
 * Standalone Enterprise ERP Admin Command Center
 * Designed to match high-density B2B ops tools (Asana / Stripe / Linear).
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, Layers, Scale, History, Bell, Database, ShieldAlert,
  RefreshCw, Edit3, Trash2, Send, X, CheckCircle2, Sparkles, Upload,
  UserCheck, Wallet, LogOut, Search, Activity, TrendingUp, Globe, Settings,
  AlertTriangle, ChevronRight, ChevronDown, Menu, Command, Sun, Moon, ArrowUpRight,
  ArrowDownRight, Sliders, Filter, Check, MoreHorizontal, ShieldCheck,
  ExternalLink, Code, Palette, CreditCard, Lock, Terminal, Plus, Eye, FileText,
  Download, Home, Calendar
} from 'lucide-react';
import { Avatar } from './Avatar';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import {
  adminLoadProfilesFromSupabase, adminLoadBucketsFromSupabase,
  adminLoadTransactionsFromSupabase, adminLoadPaymentsFromSupabase,
  adminUpdateProfileInSupabase, adminDeleteProfileFromSupabase,
  adminBroadcastNotificationToAll
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
  // Navigation State & URL Hash Synchronization
  const getTabFromHash = () => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/admin/users')) return 'users';
    if (hash.startsWith('#/admin/categories')) return 'categories';
    if (hash.startsWith('#/admin/ledger')) return 'ledger';
    if (hash.startsWith('#/admin/broadcast')) return 'broadcast';
    if (hash.startsWith('#/admin/backups')) return 'backups';
    if (hash.startsWith('#/admin/styleguide')) return 'styleguide';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);
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

  // Filter & Data States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('2026-06-14');
  const [dateTo, setDateTo] = useState('2026-07-13');
  const [isLoading, setIsLoading] = useState(false);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedUserDrawer, setSelectedUserDrawer] = useState<any | null>(null);

  // Sync state to URL Hash
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = `#/admin/${tabId === 'dashboard' ? '' : tabId}`;
  };

  // Sync URL hash changes
  useEffect(() => {
    const handleHash = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load database telemetry
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

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className={`fixed inset-0 z-[100] flex bg-[#0B1528] text-slate-100 font-sans ${isDarkMode ? 'dark' : ''}`}>

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Dark Navy Operations Rail - Matching Reference Image) */}
      {/* ========================================================================= */}
      <aside className={`flex flex-col bg-[#0A1222] border-r border-slate-800/80 select-none flex-shrink-0 transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}>
        
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between flex-shrink-0">
          {isSidebarCollapsed ? (
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs mx-auto">
              BS
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <BeforeSpendLogo size="md" variant="white" />
              <span className="text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                ERP
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:block text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Navigation Section List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          {SIDEBAR_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const hasSubItems = Boolean(section.subItems && section.subItems.length > 0);
            const isOpen = openSections[section.id];
            const isSectionActive = activeTab === section.id || section.subItems?.some(s => s.id === activeTab);

            return (
              <div key={section.id} className="space-y-1">
                {/* Parent Nav Link / Accordion Trigger */}
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleSection(section.id);
                    } else {
                      handleTabChange(section.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSectionActive && !hasSubItems
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isSectionActive
                      ? 'text-white font-black'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SectionIcon className={`w-4 h-4 flex-shrink-0 ${isSectionActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    {!isSidebarCollapsed && <span className="truncate">{section.label}</span>}
                  </div>

                  {!isSidebarCollapsed && hasSubItems && (
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Expanded Accordion Sub-Items */}
                {!isSidebarCollapsed && hasSubItems && isOpen && (
                  <div className="pl-9 space-y-1 pt-1">
                    {section.subItems!.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleTabChange(sub.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer block ${
                            isSubActive
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
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
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                {userProfile.name ? userProfile.name.split(' ').map(n=>n[0]).join('').slice(0,2) : 'JS'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
                <p className="text-[10px] text-blue-400 font-mono truncate font-semibold">Platform Admin</p>
              </div>
            </div>
          )}

          <div className="flex gap-1.5">
            <button
              onClick={onExit}
              className="flex-1 py-1.5 text-[11px] font-bold rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> {!isSidebarCollapsed && 'User App'}
            </button>
            <button
              onClick={onLogout}
              className="py-1.5 px-2.5 text-[11px] font-bold rounded-lg border border-slate-800 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 2. RIGHT MAIN BODY FRAME */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFC] dark:bg-[#0B1528] overflow-hidden">

        {/* Persistent Top Bar Header (Reference Image Style) */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B34] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
          
          <div className="flex items-center gap-3">
            <button onClick={() => handleTabChange('dashboard')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <Home className="w-4 h-4" />
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{activeTab}</span>
          </div>

          {/* Search Trigger Input (Reference Image Command Center Palette) */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-xs font-medium cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search serial, UUID, or lot...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-500">⌘K</kbd>
            </button>
          </div>

          {/* Right Action Icons & Avatar */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white relative">
              <Bell className="w-4.5 h-4.5" />
              <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-1.5 right-1.5" />
            </button>

            <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {userProfile.name ? userProfile.name.split(' ').map(n=>n[0]).join('').slice(0,2) : 'JS'}
              </div>
              <span className="hidden sm:inline text-xs font-extrabold text-slate-800 dark:text-slate-100">{userProfile.name}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Zone */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-none">

          {/* Back Action & View Title Header (Matching Reference Image) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer hover:text-blue-500" onClick={() => handleTabChange('dashboard')}>
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Command center</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeTab === 'dashboard' && 'Platform Telemetry & KPIs'}
                  {activeTab === 'users' && 'User Account Directory'}
                  {activeTab === 'categories' && 'Budget Bucket Ratios'}
                  {activeTab === 'ledger' && 'Transactions Audit Ledger'}
                  {activeTab === 'broadcast' && 'System Broadcasts'}
                  {activeTab === 'backups' && 'Database Snapshots'}
                  {activeTab === 'styleguide' && 'B2B Design System Styleguide'}
                  {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'categories' && activeTab !== 'ledger' && activeTab !== 'broadcast' && activeTab !== 'backups' && activeTab !== 'styleguide' && 'Module Configuration'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-2xl">
                  Dock-to-stock, pick accuracy, on-time ship, exception aging, and throughput — against §8 benchmarks.
                </p>
              </div>

              {/* Date Filter Controls (Reference Image Style) */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 font-medium">From</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 font-medium">To</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* DASHBOARD TELEMETRY CARDS (Reference Image Grid Layout) */}
          {/* ===================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Row 1: KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Card 1 */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">ALLOCATION ACCURACY (MEDIAN)</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">100.00%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> On target
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">Target ≥ 99.50%</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <span>SETTLEMENT TIME (MEDIAN)</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">0.4 h</span>
                    <span className="text-xs font-mono text-slate-400">p95 0 h</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> On target
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">Target &lt; 24 h</span>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">ON-TIME SPLITS</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">100.00%</span>
                    <span className="text-xs font-mono text-slate-400">{profiles.length || 52410} accounts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> On target
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">Target ≥ 98.00%</span>
                  </div>
                </div>

                {/* Card 4 (Off Target Alert Style) */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-amber-200 dark:border-amber-900/40 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">EXCEPTION AGING (MEDIAN)</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">42.3 h</span>
                    <span className="text-xs font-mono text-slate-400">1 open audit</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Off target
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">Target &lt; 24 h to triage</span>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">THROUGHPUT (REVENUE)</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">₦1.84B</span>
                    <span className="text-xs font-mono text-slate-400">314,890 splits</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 font-bold">— No target</span>
                  </div>
                </div>

              </div>

              {/* Row 2: Operational Data Table Zone */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Active Accounts Directory</h3>
                  <input
                    type="text"
                    placeholder="Search account name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 max-w-xs"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">User Profile</th>
                        <th className="py-3 px-3">Role Policy</th>
                        <th className="py-3 px-3 text-center">Currency</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {profiles.slice(0, 5).map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="py-3 px-3 font-bold">
                            <div className="flex items-center gap-2">
                              <Avatar name={u.name} className="w-7 h-7 rounded-full" />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium">{u.role}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold">{u.default_currency || 'NGN'}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Active</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button onClick={() => setSelectedUserDrawer(u)} className="p-1 text-slate-400 hover:text-blue-500"><Eye className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Module Views for Users, Broadcasts, Backups, Styleguide */}
          {activeTab === 'users' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">User Account Directory ({profiles.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px]">
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {profiles.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                        <td className="py-3 px-3 font-bold">{p.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{p.email}</td>
                        <td className="py-3 px-3">{p.role}</td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => setSelectedUserDrawer(p)} className="p-1 text-slate-400 hover:text-blue-500"><Eye className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200 dark:border-slate-800 max-w-lg space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Broadcast Announcement</h3>
              <input type="text" placeholder="Announcement title..." className="w-full px-3 py-2 rounded-xl border dark:border-slate-800 dark:bg-slate-900 text-xs" />
              <textarea rows={3} placeholder="Message body..." className="w-full px-3 py-2 rounded-xl border dark:border-slate-800 dark:bg-slate-900 text-xs" />
              <button onClick={() => triggerToast('Notification dispatched to all accounts')} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs">Dispatch Broadcast</button>
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200 dark:border-slate-800 max-w-md space-y-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Database Snapshot</h3>
              <p className="text-xs text-slate-400 font-mono">Storage quota: {calculateLocalStorageQuota()} KB / 5120 KB</p>
              <button onClick={handleExportDb} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-2">
                <Download className="w-4 h-4" /> Export Backup
              </button>
            </div>
          )}

        </main>
      </div>

      {/* Global Command Palette Overlay */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0D1B34] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400">Search Command Center</span>
              <kbd className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <input type="text" autoFocus placeholder="Type a command or user name..." className="w-full text-xs bg-transparent font-medium focus:outline-none" />
            <div className="space-y-1 text-xs">
              <button onClick={() => { handleTabChange('dashboard'); setShowCommandPalette(false); }} className="w-full text-left p-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-500 font-bold">Jump to Dashboard Overview</button>
              <button onClick={() => { handleTabChange('users'); setShowCommandPalette(false); }} className="w-full text-left p-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-500 font-bold">Jump to User Directory</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[130] px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{showToast}</span>
        </div>
      )}

    </div>
  );
}
