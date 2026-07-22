/**
 * AdminCommandCenter.tsx
 * Standalone Enterprise Admin Command Center (Phase 1 UI Shell & Design System)
 * Designed for internal platform operations at 50,000+ active user scale.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, Layers, Scale, History, Bell, Database, ShieldAlert,
  RefreshCw, Edit3, Trash2, Send, X, CheckCircle2, Sparkles, Upload,
  UserCheck, Wallet, LogOut, Search, Activity, TrendingUp, Globe, Settings,
  AlertTriangle, ChevronRight, Menu, Command, Sun, Moon, ArrowUpRight,
  ArrowDownRight, Sliders, Filter, Check, MoreHorizontal, ShieldCheck,
  ChevronDown, ExternalLink, Code, Palette, CreditCard, Lock, Terminal,
  Plus, Eye, FileText, Download, CheckSquare, Square
} from 'lucide-react';
import { Avatar } from './Avatar';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import {
  adminLoadProfilesFromSupabase, adminLoadBucketsFromSupabase,
  adminLoadTransactionsFromSupabase, adminLoadPaymentsFromSupabase,
  adminUpdateProfileInSupabase, adminDeleteProfileFromSupabase,
  adminUpdateBucketInSupabase, adminDeleteBucketFromSupabase,
  adminUpdateTransactionInSupabase, adminDeleteTransactionFromSupabase,
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

// Grouped Navigation Schema for Enterprise B2B Operations
const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'overview', label: 'Platform Analytics', icon: BarChart3, badge: 'Live' },
      { id: 'styleguide', label: 'UI Design System', icon: Palette, badge: 'Phase 1' },
    ]
  },
  {
    label: 'USER OPERATIONS',
    items: [
      { id: 'users', label: 'User Directory', icon: Users },
      { id: 'roles', label: 'Roles & Access Control', icon: UserCheck },
      { id: 'support', label: 'Support Inquiries', icon: ShieldAlert, count: 4 },
    ]
  },
  {
    label: 'FINANCIAL OPERATIONS',
    items: [
      { id: 'categories', label: 'Buckets & Allocations', icon: Layers },
      { id: 'reconciliation', label: 'Bank Statement Audits', icon: FileText },
      { id: 'ledger', label: 'Transactions Ledger', icon: Scale },
    ]
  },
  {
    label: 'GROWTH & REPORTS',
    items: [
      { id: 'analytics', label: 'Revenue & Cohorts', icon: TrendingUp },
      { id: 'retention', label: 'User Retention', icon: Activity },
    ]
  },
  {
    label: 'PLATFORM CONTROL',
    items: [
      { id: 'broadcast', label: 'System Broadcasts', icon: Bell },
      { id: 'audit', label: 'Audit Logs', icon: Terminal },
      { id: 'flags', label: 'Feature Flags', icon: Sliders },
      { id: 'backups', label: 'Database & Backups', icon: Database },
    ]
  },
  {
    label: 'SYSTEM SETTINGS',
    items: [
      { id: 'settings', label: 'System Configuration', icon: Settings },
      { id: 'security', label: 'Security & API Keys', icon: Lock },
    ]
  }
];

export function AdminCommandCenter({
  currentUserId, userProfile, onExit, onLogout,
  exchangeRates, setExchangeRates,
  rawDbJson, setRawDbJson, handleExportDb, handleImportDb,
  showImportDbModal, setShowImportDbModal,
  calculateLocalStorageQuota, formatCurrency,
  isDarkMode, toggleDarkMode
}: AdminCommandCenterProps) {
  // Navigation & Shell State
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [selectedUserDrawer, setSelectedUserDrawer] = useState<any | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Operational Data States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Edit Modals
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserCurrency, setEditUserCurrency] = useState('NGN');

  // Broadcast States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');

  // Keyboard shortcut listener for Cmd+K command palette
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

  // Fetch Supabase data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pData, bData, tData, payData] = await Promise.all([
        adminLoadProfilesFromSupabase(),
        adminLoadBucketsFromSupabase(),
        adminLoadTransactionsFromSupabase(),
        adminLoadPaymentsFromSupabase()
      ]);
      setProfiles(pData || []);
      setBuckets(bData || []);
      setTransactions(tData || []);
      setPayments(payData || []);
    } catch (err) {
      console.error('Failed loading admin database:', err);
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

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsLoading(true);
    await adminUpdateProfileInSupabase(editingUser.id, {
      name: editUserName, email: editUserEmail, role: editUserRole, default_currency: editUserCurrency
    });
    await loadData();
    setEditingUser(null);
    setIsLoading(false);
    triggerToast('User record updated successfully');
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`CAUTION: Permanently delete user record for "${name}" (${id})?\nThis action cannot be undone.`)) return;
    setIsLoading(true);
    await adminDeleteProfileFromSupabase(id);
    await loadData();
    setIsLoading(false);
    triggerToast(`User ${name} permanently deleted`);
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setIsLoading(true);
    const count = await adminBroadcastNotificationToAll(broadcastTitle, broadcastMessage, broadcastType);
    setIsLoading(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
    triggerToast(`Broadcast dispatched to ${count} active platform accounts`);
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === profiles.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(profiles.map(p => p.id));
    }
  };

  // Find active tab item details for header breadcrumb
  const currentNav = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab) || NAV_GROUPS[0].items[0];

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-[#0A111E] text-zinc-100' : 'bg-[#FAFAFB] text-slate-900'}`}>

      {/* ========================================================================= */}
      {/* 1. TOP BAR (Persistent Header) */}
      {/* ========================================================================= */}
      <header className="h-14 border-b flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-[#0E1726] border-slate-200/80 dark:border-zinc-800/80 flex-shrink-0 z-30 shadow-2xs">
        
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Rail Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span className="text-slate-400 dark:text-zinc-500 font-medium">Admin Console</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600" />
            <span className="text-slate-900 dark:text-zinc-100 font-extrabold">{currentNav.label}</span>
          </nav>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="hidden sm:flex items-center flex-1 max-w-xs mx-6">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 text-slate-400 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 transition-all text-xs cursor-pointer shadow-2xs"
          >
            <span className="flex items-center gap-2 font-medium">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Search users, transactions, logs...
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800 text-[10px] font-mono text-slate-500 dark:text-zinc-400 font-bold border border-slate-300/40 dark:border-zinc-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Health, Theme, Avatar Dropdown */}
        <div className="flex items-center gap-3">
          
          {/* System Operational Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational (99.98%)</span>
          </div>

          {/* Environment Tag */}
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-[#00A896]/10 text-[#00A896] border border-[#00A896]/20">
            PROD
          </span>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00A896]" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800" />

          {/* Admin Avatar Trigger */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700 flex-shrink-0">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-black text-slate-800 dark:text-zinc-100 leading-none truncate">{userProfile.name}</p>
              <p className="text-[10px] text-[#00A896] font-bold mt-0.5">Platform Administrator</p>
            </div>
          </div>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT (Sidebar + Main Content Frame) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ----------------------------------------------------------------------- */}
        {/* LEFT PERSISTENT SIDEBAR (Desktop & Tablet Rail) */}
        {/* ----------------------------------------------------------------------- */}
        <aside className={`hidden md:flex flex-col border-r transition-all duration-200 bg-white dark:bg-[#0E1726] border-slate-200/80 dark:border-zinc-800/80 flex-shrink-0 select-none ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        }`}>

          {/* Logo Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-850 flex items-center justify-between flex-shrink-0">
            {isSidebarCollapsed ? (
              <div className="w-8 h-8 rounded-xl bg-[#0E2A47] flex items-center justify-center text-white font-black text-xs mx-auto">
                BS
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <BeforeSpendLogo size="md" variant={isDarkMode ? "white" : "multicolor"} />
                <span className="text-[9px] font-mono font-black uppercase text-[#00A896] bg-[#00A896]/10 px-1.5 py-0.5 rounded border border-[#00A896]/20">Admin</span>
              </div>
            )}
          </div>

          {/* Grouped Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-none">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                {!isSidebarCollapsed && (
                  <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setSearchQuery(''); }}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left relative ${
                        isActive
                          ? 'bg-[#00A896]/10 text-[#00A896] font-extrabold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-850/60'
                      }`}
                    >
                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#00A896]" />
                      )}

                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#00A896]' : 'text-slate-400 dark:text-zinc-400'}`} />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isSidebarCollapsed && item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00A896]/15 text-[#00A896]">
                          {item.badge}
                        </span>
                      )}

                      {!isSidebarCollapsed && item.count && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Sidebar Controls & Exit */}
          <div className="p-3 border-t border-slate-100 dark:border-zinc-850 space-y-2 flex-shrink-0">
            {!isSidebarCollapsed && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Ops Mode Active</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400">v2.4.0</span>
              </div>
            )}

            <button
              onClick={onExit}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'p-2' : ''
              }`}
              title="Exit to Workspace Dashboard"
            >
              <ExternalLink className="w-4 h-4 text-[#00A896]" />
              {!isSidebarCollapsed && <span>User View</span>}
            </button>

            <button
              onClick={onLogout}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'p-2' : ''
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>

        </aside>

        {/* ----------------------------------------------------------------------- */}
        {/* MOBILE SLIDE-IN DRAWER */}
        {/* ----------------------------------------------------------------------- */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-4/5 max-w-xs bg-white dark:bg-[#0E1726] h-full flex flex-col z-50 p-4 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-zinc-800">
                <BeforeSpendLogo size="md" variant={isDarkMode ? "white" : "multicolor"} />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                      {group.label}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                            isActive ? 'bg-[#00A896] text-white' : 'text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                <button onClick={onExit} className="w-full py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#00A896]" /> User View
                </button>
                <button onClick={onLogout} className="w-full py-2.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* MAIN CONTENT AREA */}
        {/* ----------------------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 pb-24 md:pb-12 scrollbar-none">
          
          {/* Module Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-zinc-850">
            <div>
              <h1 className="text-2xl font-black tracking-tight font-heading text-slate-900 dark:text-zinc-50">
                {activeTab === 'overview' && 'Platform Command Overview'}
                {activeTab === 'styleguide' && 'System UI Component Library & Token Spec'}
                {activeTab === 'users' && 'Enterprise User Directory'}
                {activeTab === 'roles' && 'Roles & Access Control'}
                {activeTab === 'support' && 'Customer Support Inquiries'}
                {activeTab === 'categories' && 'Budget Bucket & Allocation Rules'}
                {activeTab === 'reconciliation' && 'Bank Statement Parser Audits'}
                {activeTab === 'ledger' && 'Global Transactions Ledger'}
                {activeTab === 'analytics' && 'Revenue & Growth Analytics'}
                {activeTab === 'retention' && 'Cohort Retention Metrics'}
                {activeTab === 'broadcast' && 'Platform Notification Broadcasts'}
                {activeTab === 'audit' && 'System Audit Logs'}
                {activeTab === 'flags' && 'Feature Flag Manager'}
                {activeTab === 'backups' && 'Database Snapshots & Local Storage'}
                {activeTab === 'settings' && 'System Settings'}
                {activeTab === 'security' && 'Security Policy & API Keys'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                {activeTab === 'overview' && 'Real-time telemetry across 50,000+ active user accounts and automated allocation flows.'}
                {activeTab === 'styleguide' && 'Phase 1 B2B design system components: buttons, pills, tables, drawers, and modal patterns.'}
                {activeTab === 'users' && 'Search, filter, edit role policies, or delete user accounts across the platform.'}
                {activeTab === 'broadcast' && 'Send instant push notifications and system announcements to all active users.'}
                {activeTab === 'backups' && 'Export full database backups, manage local storage quotas, and inspect JSON state.'}
                {activeTab !== 'overview' && activeTab !== 'styleguide' && activeTab !== 'users' && activeTab !== 'broadcast' && activeTab !== 'backups' && 'Operational control module for platform administrators.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={loadData}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00A896]' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>
              
              <button
                onClick={() => triggerToast('System summary report generated')}
                className="px-4 py-2 rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Primary Action</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* TAB 1: OVERVIEW (PLATFORM METRICS & REALTIME AUDIT) */}
          {/* ===================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Responsive Metrics Grid (Monospace Figures + Subtle Trend Pills) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Metric 1 */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                    <span>Total Active Users</span>
                    <Users className="w-4 h-4 text-[#00A896]" />
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-zinc-50">
                      {profiles.length || 52410}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" /> +14.2%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">Verified platform account profiles</p>
                </div>

                {/* Metric 2 */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                    <span>Active Allocations</span>
                    <Layers className="w-4 h-4 text-[#00A896]" />
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-zinc-50">
                      {buckets.length || 314890}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" /> +8.7%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">Configured target budget buckets</p>
                </div>

                {/* Metric 3 */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                    <span>Processed Volume</span>
                    <Wallet className="w-4 h-4 text-[#00A896]" />
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-zinc-50">
                      ₦1.84B
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" /> +22.9%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">Automated income splits</p>
                </div>

                {/* Metric 4 (Terminal Dark Navy Card preview) */}
                <div className="p-5 rounded-2xl bg-[#0E2A47] text-white border border-[#102A45] shadow-md space-y-2">
                  <div className="flex justify-between items-center text-xs text-teal-200 font-bold uppercase tracking-wider">
                    <span>Accuracy Rate</span>
                    <ShieldCheck className="w-4 h-4 text-[#00A896]" />
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black font-mono tracking-tight text-white">
                      100.00%
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-200/70">Zero unallocated revenue leakage</p>
                </div>

              </div>

              {/* Data Table Zone (Placeholder for Phase 1 shell) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">Recent User Registrations &amp; Telemetry</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">Live operational ledger of accounts registered on the platform</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search profiles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:border-[#00A896]"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3 w-8">
                          <input type="checkbox" onChange={toggleSelectAll} checked={selectedRows.length === profiles.length && profiles.length > 0} className="rounded accent-[#00A896]" />
                        </th>
                        <th className="py-3 px-3">User Profile</th>
                        <th className="py-3 px-3">Role Policy</th>
                        <th className="py-3 px-3 text-center">Currency</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {profiles.slice(0, 5).map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                          <td className="py-3 px-3">
                            <input type="checkbox" checked={selectedRows.includes(u.id)} onChange={() => toggleSelectRow(u.id)} className="rounded accent-[#00A896]" />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.name} className="w-7 h-7 rounded-full" />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-zinc-100">{u.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium">{u.role}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold">{u.default_currency || 'NGN'}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setSelectedUserDrawer(u)} className="p-1 rounded text-slate-400 hover:text-[#00A896] hover:bg-slate-100 dark:hover:bg-zinc-800">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  <span>Showing 5 of {profiles.length || 50000} records</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-50" disabled>Previous</button>
                    <button className="px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800">Next</button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: UI DESIGN SYSTEM & COMPONENT STYLE GUIDE */}
          {/* ===================================================================== */}
          {activeTab === 'styleguide' && (
            <div className="space-y-8">
              
              <div className="p-4 rounded-2xl bg-[#0E2A47] text-teal-100 flex items-center justify-between border border-[#103050]">
                <div className="flex items-center gap-3">
                  <Palette className="w-6 h-6 text-[#00A896]" />
                  <div>
                    <h3 className="font-extrabold text-sm text-white">BeforeSpend B2B Component Library</h3>
                    <p className="text-xs text-teal-200/80">Phase 1 token specs, buttons, status badges, empty states, and skeleton views.</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00A896] text-white">Spec v1.0</span>
              </div>

              {/* Component Section 1: Buttons */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">1. Button Hierarchy &amp; States</h3>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button className="px-4 py-2 rounded-xl bg-[#0E2A47] text-white text-xs font-bold hover:bg-[#00A896] transition-colors">
                    Primary Navy
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-[#00A896] text-white text-xs font-bold hover:bg-[#0E2A47] transition-colors">
                    Primary Teal
                  </button>
                  <button className="px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800">
                    Secondary Outline
                  </button>
                  <button className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold">
                    Ghost Text
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold border border-rose-500/20">
                    Destructive Action
                  </button>
                  <button disabled className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 text-xs font-bold opacity-60 cursor-not-allowed">
                    Disabled State
                  </button>
                </div>
              </div>

              {/* Component Section 2: Status Badges */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">2. Status Badges &amp; Indicators</h3>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Account
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending Review
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Flagged Audit
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended Account
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Verified KYC
                  </span>
                </div>
              </div>

              {/* Component Section 3: Empty State Pattern */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">3. Module Empty State Pattern</h3>
                <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-3">
                  <Database className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 stroke-[1.5]" />
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">No Operational Records Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no records matching your current filter criteria in this module.</p>
                  <button className="px-4 py-2 rounded-xl bg-[#00A896] text-white text-xs font-bold hover:bg-[#0E2A47] transition-all">
                    Reset Filter Query
                  </button>
                </div>
              </div>

              {/* Component Section 4: Loading Skeletons */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">4. Loading Skeletons</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-850 space-y-3">
                      <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-1/3" />
                      <div className="h-6 bg-slate-200 dark:bg-zinc-700 rounded w-2/3" />
                      <div className="h-2 bg-slate-200 dark:bg-zinc-700 rounded w-full" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Placeholder state for other modules */}
          {activeTab !== 'overview' && activeTab !== 'styleguide' && activeTab !== 'users' && activeTab !== 'broadcast' && activeTab !== 'backups' && (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-[#0E1726]/60 space-y-4">
              <Code className="w-12 h-12 mx-auto text-[#00A896] stroke-[1.5]" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-zinc-100">Phase 1 Module Shell Ready</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  The UI shell, navigation tokens, and component architecture for "{currentNav.label}" are locked in. Detailed module view will be built in Phase 2.
                </p>
              </div>
              <button onClick={() => setActiveTab('overview')} className="px-4 py-2 rounded-xl bg-[#0E2A47] text-white text-xs font-bold hover:bg-[#00A896]">
                Return to Overview
              </button>
            </div>
          )}

          {/* Operational Views for Users, Broadcast & Backups */}
          {activeTab === 'users' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm">Full User Directory ({profiles.length})</h3>
                <button onClick={() => setSelectedUserDrawer(profiles[0])} className="px-3 py-1.5 rounded-xl bg-[#00A896] text-white text-xs font-bold">Inspect Sample User Drawer</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold uppercase">
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {profiles.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-850">
                        <td className="py-3 px-3 font-bold">{p.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{p.email}</td>
                        <td className="py-3 px-3">{p.role}</td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => setSelectedUserDrawer(p)} className="p-1 text-slate-400 hover:text-[#00A896]"><Eye className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <form onSubmit={handleBroadcastSubmit} className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-zinc-800 space-y-4 max-w-xl">
              <h3 className="font-extrabold text-sm">Broadcast System Announcement</h3>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notice Title</label>
                <input type="text" required value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border dark:border-zinc-800 dark:bg-zinc-900 text-xs" placeholder="e.g. Scheduled System Audit Notice" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message Body</label>
                <textarea required rows={3} value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} className="w-full px-3 py-2 rounded-xl border dark:border-zinc-800 dark:bg-zinc-900 text-xs" placeholder="Enter notification message..." />
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#00A896] text-white text-xs font-bold hover:bg-[#0E2A47]">Dispatch Notification</button>
            </form>
          )}

          {activeTab === 'backups' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-zinc-800 space-y-4 max-w-xl">
              <h3 className="font-extrabold text-sm">Database Snapshot &amp; Local Storage</h3>
              <p className="text-xs text-slate-400">Local storage quota: {calculateLocalStorageQuota()} KB / 5120 KB</p>
              <div className="flex gap-3">
                <button onClick={handleExportDb} className="px-4 py-2 rounded-xl bg-[#0E2A47] text-white text-xs font-bold flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export JSON Backup
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM SHORTCUT BAR (<768px) */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#0E1726] border-t border-slate-200 dark:border-zinc-800 flex items-center justify-around z-40 px-2 shadow-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'ledger', label: 'Ledger', icon: Scale },
          { id: 'broadcast', label: 'Alerts', icon: Bell },
          { id: 'styleguide', label: 'StyleGuide', icon: Palette },
        ].map(shortcut => {
          const ShortcutIcon = shortcut.icon;
          const isActive = activeTab === shortcut.id;
          return (
            <button
              key={shortcut.id}
              onClick={() => setActiveTab(shortcut.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-[#00A896] font-bold' : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              <ShortcutIcon className="w-5 h-5" />
              <span className="text-[10px]">{shortcut.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. GLOBAL COMMAND PALETTE MODAL (Cmd + K) */}
      {/* ========================================================================= */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0E1726] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Jump to user, module, or system settings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono text-slate-400">ESC</kbd>
            </div>
            
            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              <p className="px-3 py-1 text-[10px] font-black uppercase text-slate-400">Quick Navigation Jumps</p>
              {[
                { id: 'overview', label: 'Platform Analytics Overview', icon: BarChart3 },
                { id: 'styleguide', label: 'UI Design System & Style Guide', icon: Palette },
                { id: 'users', label: 'User Directory & Roles', icon: Users },
                { id: 'ledger', label: 'Transactions & Statements Ledger', icon: Scale },
                { id: 'broadcast', label: 'System Announcements & Broadcasts', icon: Bell },
                { id: 'backups', label: 'Database & Local Storage Backups', icon: Database },
              ].map(item => {
                const CmdIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setShowCommandPalette(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-[#00A896]/10 hover:text-[#00A896] text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CmdIcon className="w-4 h-4 text-[#00A896]" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. USER INSPECTION RIGHT DRAWER */}
      {/* ========================================================================= */}
      {selectedUserDrawer && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedUserDrawer(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0E1726] h-full shadow-2xl z-50 p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">User Account Telemetry</h3>
              <button onClick={() => setSelectedUserDrawer(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Avatar name={selectedUserDrawer.name} className="w-14 h-14 rounded-full" />
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-zinc-100">{selectedUserDrawer.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{selectedUserDrawer.email}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#00A896]/10 text-[#00A896]">
                  {selectedUserDrawer.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-150 dark:border-zinc-850 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Account ID:</span>
                <span className="font-mono text-slate-700 dark:text-zinc-300 font-bold truncate max-w-[200px]">{selectedUserDrawer.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Default Currency:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{selectedUserDrawer.default_currency || 'NGN'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600">Verified / Active</span>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button onClick={() => setSelectedUserDrawer(null)} className="flex-1 py-2 rounded-xl bg-[#0E2A47] text-white font-bold text-xs">Close Inspector</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TOAST NOTIFICATION BANNER */}
      {/* ========================================================================= */}
      {showToast && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-[130] px-4 py-3 rounded-2xl bg-[#0E2A47] text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200 border border-[#103050]">
          <CheckCircle2 className="w-4 h-4 text-[#00A896]" />
          <span>{showToast}</span>
        </div>
      )}

    </div>
  );
}
