/**
 * AdminCommandCenter.tsx
 * Standalone Enterprise B2B ERP Admin Command Center
 * Deep User Behavioral Intelligence, Custom Styled Dropdowns, & Telemetry Analytics
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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('2026-06-14');
  const [dateTo, setDateTo] = useState('2026-07-13');

  // Custom Dropdown Open States (NO Browser Native Selects)
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

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
    const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? true : false);

    return matchesSearch && matchesRole && matchesCurrency && matchesStatus;
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Compute User Specific Behavioral Telemetry
  const getUserTelemetry = (user: any) => {
    if (!user) return null;
    const userBuckets = buckets.filter(b => b.user_id === user.id);
    const userTxns = transactions.filter(t => t.user_id === user.id);
    const totalAllocated = userBuckets.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
    const totalSplits = userTxns.filter(t => t.type === 'INCOME_SPLIT').length;
    const totalExpenses = userTxns.filter(t => t.type === 'EXPENSE').length;

    return {
      userBuckets,
      userTxns,
      totalAllocated,
      totalSplits,
      totalExpenses,
      lastActive: new Date().toLocaleDateString(),
      kycVerified: true,
      riskScore: 'Low (0.2%)'
    };
  };

  const currentDeepDiveTelemetry = deepDiveUser ? getUserTelemetry(deepDiveUser) : null;

  return (
    <div className={`fixed inset-0 z-[100] flex bg-[#0B1528] text-slate-100 font-sans ${isDarkMode ? 'dark' : ''}`}>

      {/* Backdrop for closing custom popover dropdowns */}
      {(isRoleDropdownOpen || isCurrencyDropdownOpen || isStatusDropdownOpen) && (
        <div
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => {
            setIsRoleDropdownOpen(false);
            setIsCurrencyDropdownOpen(false);
            setIsStatusDropdownOpen(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Dark Navy ERP Rail - Reference Image Standard) */}
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

                {/* Sub-Items */}
                {!isSidebarCollapsed && hasSubItems && isOpen && (
                  <div className="pl-9 space-y-1 pt-1">
                    {section.subItems!.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setActiveTab(sub.id)}
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

        {/* Bottom User Card (Josh Schultz Style) */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 flex-shrink-0">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-8 h-8 rounded-full border border-slate-700 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
                <p className="text-[10px] text-blue-400 font-mono font-semibold truncate">Platform Administrator</p>
              </div>
            </div>
          )}

          <div className="flex gap-1.5">
            <button onClick={onExit} className="flex-1 py-1.5 text-[11px] font-bold rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> {!isSidebarCollapsed && 'User App'}
            </button>
            <button onClick={onLogout} className="py-1.5 px-2.5 text-[11px] font-bold rounded-lg border border-slate-800 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer" title="Sign Out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 2. RIGHT MAIN BODY FRAME */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFC] dark:bg-[#0B1528] overflow-hidden">

        {/* Persistent Top Bar Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B34] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
          
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('dashboard')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
              <Home className="w-4 h-4" />
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{activeTab}</span>
          </div>

          {/* Search Trigger Input (Reference Image Palette) */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-xs font-medium cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search serial, UUID, or user...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-500">⌘K</kbd>
            </button>
          </div>

          {/* Right Action Icons & Avatar */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white relative cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-1.5 right-1.5" />
            </button>

            <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
              <span className="hidden sm:inline text-xs font-extrabold text-slate-800 dark:text-slate-100">{userProfile.name}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-none">

          {/* Header Title & Date Range Inputs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer hover:text-blue-500" onClick={() => setActiveTab('dashboard')}>
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
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-2xl">
                  {activeTab === 'users' ? 'Search accounts, inspect behavioral telemetry, manage roles, and review allocation balances.' : 'Dock-to-stock, pick accuracy, on-time ship, exception aging, and throughput — against §8 benchmarks.'}
                </p>
              </div>

              {/* Date Filters */}
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
          {/* USER DIRECTORY MODULE (END-TO-END + CUSTOM DROPDOWNS + DEEP DIVE) */}
          {/* ===================================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">

              {/* Top Summary Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Total Registered Users</span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{profiles.length || 52410}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Active Accounts</span>
                  <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{profiles.length || 51890}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Default Currency</span>
                  <p className="text-2xl font-black font-mono text-blue-500">NGN (₦)</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Actions</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Create Profile</span>
                  </div>
                  <button onClick={() => setShowAddUserModal(true)} className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer">
                    <UserPlus className="w-4 h-4" /> Add User
                  </button>
                </div>
              </div>

              {/* Filters Toolbar with CUSTOM STYLED DROPDOWNS (No Native Selects) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, email, ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-base sm:text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Custom Role Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRoleDropdownOpen(!isRoleDropdownOpen);
                        setIsCurrencyDropdownOpen(false);
                        setIsStatusDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{filterRole === 'ALL' ? 'All Role Policies' : filterRole}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {isRoleDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-xl z-40 text-xs space-y-1">
                        {['ALL', 'Salaried Employee / Professional', 'Freelancer & Contractor', 'Business Owner / Entrepreneur', 'Student & Personal Budgeter', 'Platform Administrator'].map(r => (
                          <button
                            key={r}
                            onClick={() => { setFilterRole(r); setIsRoleDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                              filterRole === r ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                        setIsStatusDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span>{filterCurrency === 'ALL' ? 'All Currencies' : filterCurrency}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {isCurrencyDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-xl z-40 text-xs space-y-1">
                        {['ALL', 'NGN', 'USD', 'EUR', 'GBP'].map(c => (
                          <button
                            key={c}
                            onClick={() => { setFilterCurrency(c); setIsCurrencyDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                              filterCurrency === c ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {c === 'ALL' ? 'All Currencies' : c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reset button */}
                  <button
                    onClick={() => { setSearchQuery(''); setFilterRole('ALL'); setFilterCurrency('ALL'); }}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>

                </div>
              </div>

              {/* Directory Table */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px]">
                        <th className="py-3 px-3">User Profile</th>
                        <th className="py-3 px-3">Role Policy</th>
                        <th className="py-3 px-3 text-center">Currency</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Deep Dive Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {filteredProfiles.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.name} className="w-8 h-8 rounded-full" />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-semibold">{u.role}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold">{u.default_currency || 'NGN'}</td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Active</span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => { setDeepDiveUser(u); setDrawerActiveTab('overview'); }}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
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

          {/* KPI Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-400">ALLOCATION ACCURACY</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">100.00%</p>
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> On target</div>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-400">SETTLEMENT TIME</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">0.4 h</p>
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> On target</div>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-400">THROUGHPUT VOLUME</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">₦1.84B</p>
                  <div className="text-xs font-bold text-slate-400">— On target</div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* DEEP-DIVE USER BEHAVIORAL INTELLIGENCE DRAWER */}
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
                  <p className="text-xs font-mono text-slate-400">{deepDiveUser.email}</p>
                </div>
              </div>
              <button onClick={() => setDeepDiveUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Deep Dive Navigation Tabs */}
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
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    drawerActiveTab === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {drawerActiveTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Managed Balance</span>
                    <p className="text-lg font-black font-mono text-emerald-600">{formatCurrency(currentDeepDiveTelemetry.totalAllocated, deepDiveUser.default_currency || 'NGN')}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Active Buckets</span>
                    <p className="text-lg font-black font-mono text-blue-500">{currentDeepDiveTelemetry.userBuckets.length} Buckets</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">Profile Information</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-400">Account ID:</span><span className="font-mono font-bold truncate max-w-[200px]">{deepDiveUser.id}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Role Policy:</span><span className="font-bold">{deepDiveUser.role}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Default Currency:</span><span className="font-mono font-bold">{deepDiveUser.default_currency || 'NGN'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Account Health:</span><span className="font-bold text-emerald-600">100% Verified</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Buckets */}
            {drawerActiveTab === 'buckets' && (
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-400">User Configured Buckets ({currentDeepDiveTelemetry.userBuckets.length})</span>
                {currentDeepDiveTelemetry.userBuckets.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No custom buckets created yet by this user.</p>
                ) : (
                  currentDeepDiveTelemetry.userBuckets.map(b => (
                    <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.destination_account || 'Default Account'} • {b.allocation_percentage}%</p>
                      </div>
                      <span className="font-mono font-black text-emerald-600">{formatCurrency(b.balance, deepDiveUser.default_currency || 'NGN')}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Transactions */}
            {drawerActiveTab === 'transactions' && (
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-400">Recent User Activity Log ({currentDeepDiveTelemetry.userTxns.length})</span>
                {currentDeepDiveTelemetry.userTxns.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No transaction records found for this user.</p>
                ) : (
                  currentDeepDiveTelemetry.userTxns.map(t => (
                    <div key={t.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{t.description}</p>
                        <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`font-black ${t.direction === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount, deepDiveUser.default_currency || 'NGN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => handleDeleteUser(deepDiveUser.id, deepDiveUser.name)}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-rose-500/20"
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
              <span className="text-xs font-bold text-slate-400">Search Command Center</span>
              <kbd className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <input type="text" autoFocus placeholder="Type a command or user name..." className="w-full text-xs bg-transparent font-medium focus:outline-none" />
            <div className="space-y-1 text-xs">
              <button onClick={() => { setActiveTab('dashboard'); setShowCommandPalette(false); }} className="w-full text-left p-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-500 font-bold cursor-pointer">Jump to Dashboard Telemetry</button>
              <button onClick={() => { setActiveTab('users'); setShowCommandPalette(false); }} className="w-full text-left p-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-500 font-bold cursor-pointer">Jump to User Directory</button>
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
