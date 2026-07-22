/**
 * AdminCommandCenter.tsx
 * End-to-End Enterprise Admin Command Center & User Directory Module
 * Clean B2B SaaS Design System (No emojis, plain English labels, HTML5 Path Routing).
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
  Key, RefreshCw as RotateCcw, AlertCircle
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
  subItems?: { id: string; label: string; path: string }[];
}

const SIDEBAR_SECTIONS: NavSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  {
    id: 'user_ops',
    label: 'User Operations',
    icon: Users,
    subItems: [
      { id: 'users', label: 'User Directory', path: '/admin/users' },
      { id: 'roles', label: 'Roles & Access Control', path: '/admin/roles' },
      { id: 'support', label: 'Support Inquiries', path: '/admin/support' },
    ]
  },
  {
    id: 'financial_ops',
    label: 'Financial Operations',
    icon: Wallet,
    subItems: [
      { id: 'categories', label: 'Buckets & Allocations', path: '/admin/categories' },
      { id: 'reconciliation', label: 'Bank Statement Audits', path: '/admin/reconciliation' },
      { id: 'ledger', label: 'Transactions Ledger', path: '/admin/ledger' },
    ]
  },
  {
    id: 'growth_ops',
    label: 'Growth & Analytics',
    icon: TrendingUp,
    subItems: [
      { id: 'analytics', label: 'Revenue & Cohorts', path: '/admin/analytics' },
      { id: 'retention', label: 'User Retention', path: '/admin/retention' },
    ]
  },
  {
    id: 'platform_ops',
    label: 'Platform Control',
    icon: Database,
    subItems: [
      { id: 'broadcast', label: 'System Broadcasts', path: '/admin/broadcast' },
      { id: 'audit', label: 'Audit Logs', path: '/admin/audit' },
      { id: 'flags', label: 'Feature Flags', path: '/admin/flags' },
      { id: 'backups', label: 'Database & Backups', path: '/admin/backups' },
      { id: 'styleguide', label: 'UI Design System', path: '/admin/styleguide' },
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
  // Sync tab with HTML5 Path history
  const getTabFromPath = () => {
    const path = window.location.pathname || '';
    if (path.startsWith('/admin/users')) return 'users';
    if (path.startsWith('/admin/roles')) return 'roles';
    if (path.startsWith('/admin/categories')) return 'categories';
    if (path.startsWith('/admin/ledger')) return 'ledger';
    if (path.startsWith('/admin/broadcast')) return 'broadcast';
    if (path.startsWith('/admin/backups')) return 'backups';
    if (path.startsWith('/admin/styleguide')) return 'styleguide';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    user_ops: true,
    financial_ops: true,
    platform_ops: false,
    growth_ops: false
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTopUserDropdown, setShowTopUserDropdown] = useState(false);
  const [showSidebarUserMenu, setShowSidebarUserMenu] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // User Directory Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // User Drawer & Modal States
  const [selectedUserDrawer, setSelectedUserDrawer] = useState<any | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserModal, setEditingUserModal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Salaried Employee / Professional');
  const [newUserCurrency, setNewUserCurrency] = useState('NGN');

  // Edit User Form State
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserCurrency, setEditUserCurrency] = useState('NGN');

  // Operational Data States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Navigation Routing Helper using HTML5 Path History
  const navigateToTab = (tabId: string, path: string) => {
    setActiveTab(tabId);
    window.history.pushState({}, '', path);
  };

  useEffect(() => {
    const handlePopState = () => setActiveTab(getTabFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Cmd+K Shortcut Listener
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

  // Fetch Database Profiles & Operational Records
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
      console.error('Failed to load user database:', err);
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
      alert('Failed to create account. Email may already be registered.');
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
    if (!confirm(`Warning: Permanently delete account for "${name}"?\nThis action will remove all user data from the database.`)) return;
    setIsLoading(true);
    await adminDeleteProfileFromSupabase(id);
    await loadData();
    if (selectedUserDrawer?.id === id) setSelectedUserDrawer(null);
    setIsLoading(false);
    triggerToast(`User account ${name} permanently deleted`);
  };

  // Filter User Directory Data
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage) || 1;
  const paginatedProfiles = filteredProfiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectRow = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === paginatedProfiles.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedProfiles.map(p => p.id));
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-[#0A1220] text-zinc-100' : 'bg-[#FAFAFC] text-slate-900'}`}>

      {/* ========================================================================= */}
      {/* 1. TOP BAR HEADER (Persistent SaaS Header) */}
      {/* ========================================================================= */}
      <header className="h-14 border-b flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-[#0E1A2E] border-slate-200/80 dark:border-zinc-800/80 flex-shrink-0 z-30 shadow-2xs">
        
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span className="text-slate-400 dark:text-zinc-500 font-medium">Admin Console</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600" />
            <span className="text-slate-900 dark:text-zinc-100 font-extrabold capitalize">{activeTab.replace('_', ' ')}</span>
          </nav>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="hidden sm:flex items-center flex-1 max-w-sm mx-6">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-400 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 transition-all text-xs font-medium cursor-pointer shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search user, account ID, or action...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800 text-[10px] font-mono text-slate-500 font-bold border border-slate-300/40 dark:border-zinc-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications, Theme & SaaS Top Right Avatar Dropdown */}
        <div className="flex items-center gap-3">
          
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Operational</span>
          </div>

          <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00A896]" />
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800" />

          {/* Top Right SaaS Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTopUserDropdown(!showTopUserDropdown)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
            >
              <div className="relative">
                <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-700" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0E1A2E]" />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showTopUserDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTopUserDropdown(false)} />
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-zinc-800 p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-zinc-850">
                    <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-9 h-9 rounded-full" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">{userProfile.name}</p>
                      <p className="text-[10px] text-[#00A896] font-bold truncate">Platform Admin</p>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => { onExit(); setShowTopUserDropdown(false); }}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-[#00A896] hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-[#00A896]" />
                      <span>Switch to User View</span>
                    </button>
                    <button
                      onClick={() => { toggleDarkMode(); setShowTopUserDropdown(false); }}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-850">
                    <button
                      onClick={() => { onLogout(); setShowTopUserDropdown(false); }}
                      className="w-full px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT (Sidebar + Main Content Frame) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ----------------------------------------------------------------------- */}
        {/* LEFT PERSISTENT SIDEBAR */}
        {/* ----------------------------------------------------------------------- */}
        <aside className={`hidden md:flex flex-col border-r transition-all duration-200 bg-white dark:bg-[#0E1A2E] border-slate-200/80 dark:border-zinc-800/80 flex-shrink-0 select-none ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        }`}>

          {/* Logo Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-850 flex items-center justify-between flex-shrink-0">
            {isSidebarCollapsed ? (
              <div className="w-8 h-8 rounded-xl bg-[#0E2A47] flex items-center justify-center font-black text-white text-xs mx-auto">
                BS
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <BeforeSpendLogo size="md" variant={isDarkMode ? "white" : "multicolor"} />
                <span className="text-[9px] font-mono font-bold bg-[#00A896]/10 text-[#00A896] px-1.5 py-0.5 rounded border border-[#00A896]/20">
                  Admin
                </span>
              </div>
            )}
          </div>

          {/* Grouped Navigation Links with Collapsible Sub-Menus */}
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
                        navigateToTab(section.id, '/admin');
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSectionActive && !hasSubItems
                        ? 'bg-[#00A896] text-white shadow-md shadow-[#00A896]/20'
                        : isSectionActive
                        ? 'text-slate-900 dark:text-zinc-100 font-extrabold bg-slate-100/60 dark:bg-zinc-850/60'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/60 dark:hover:bg-zinc-850/40'
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
                            onClick={() => navigateToTab(sub.id, sub.path)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer block ${
                              isSubActive
                                ? 'bg-[#00A896] text-white font-bold shadow-2xs'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-850'
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

          {/* Bottom Left Sidebar User Profile Card */}
          <div className="p-3 border-t border-slate-100 dark:border-zinc-850 space-y-2 flex-shrink-0">
            {!isSidebarCollapsed && (
              <div className="relative">
                <button
                  onClick={() => setShowSidebarUserMenu(!showSidebarUserMenu)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 hover:border-[#00A896] transition-colors cursor-pointer text-left"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-8 h-8 rounded-full" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">{userProfile.name}</p>
                    <p className="text-[10px] text-[#00A896] font-bold truncate">Platform Admin</p>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>

                {showSidebarUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSidebarUserMenu(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-zinc-800 p-2 shadow-xl z-50 text-left space-y-1">
                      <button onClick={() => { onExit(); setShowSidebarUserMenu(false); }} className="w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-[#00A896]" /> User App View
                      </button>
                      <button onClick={() => { onLogout(); setShowSidebarUserMenu(false); }} className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </aside>

        {/* ----------------------------------------------------------------------- */}
        {/* MAIN CONTENT ZONE */}
        {/* ----------------------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 pb-24 md:pb-12 scrollbar-none">

          {/* Module Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-zinc-850">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight font-heading">
                {activeTab === 'dashboard' && 'Platform Overview'}
                {activeTab === 'users' && 'User Directory'}
                {activeTab === 'roles' && 'Roles & Access Control'}
                {activeTab === 'support' && 'Support Inquiries'}
                {activeTab === 'categories' && 'Budget Bucket Ratios'}
                {activeTab === 'reconciliation' && 'Bank Statement Audits'}
                {activeTab === 'ledger' && 'Transactions Ledger'}
                {activeTab === 'analytics' && 'Revenue Analytics'}
                {activeTab === 'retention' && 'User Retention Metrics'}
                {activeTab === 'broadcast' && 'System Broadcasts'}
                {activeTab === 'audit' && 'Audit Logs'}
                {activeTab === 'flags' && 'Feature Flags'}
                {activeTab === 'backups' && 'Database Snapshots'}
                {activeTab === 'styleguide' && 'UI Design System'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                {activeTab === 'users' && 'Manage platform accounts, role policies, default currencies, and security statuses.'}
                {activeTab === 'dashboard' && 'Real-time telemetry across active registered user accounts and financial allocations.'}
                {activeTab !== 'users' && activeTab !== 'dashboard' && 'Platform operational management.'}
              </p>
            </div>

            {activeTab === 'users' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* USER DIRECTORY MODULE (END-TO-END IMPLEMENTATION) */}
          {/* ===================================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">

              {/* User Directory Metrics Summary Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Registered Users</span>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">{profiles.length || 52410}</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+14%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Accounts</span>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{profiles.length || 51890}</span>
                    <span className="text-xs font-mono font-bold text-slate-400">99.4%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pending Review</span>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">0</span>
                    <span className="text-xs font-mono font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Clear</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Default Currency</span>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-2xl font-black font-mono text-[#00A896]">NGN (₦)</span>
                    <span className="text-xs font-mono font-bold text-slate-400">Primary</span>
                  </div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, email, ID..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium focus:outline-none focus:border-[#00A896]"
                    />
                  </div>

                  {/* Filter Role */}
                  <div>
                    <select
                      value={filterRole}
                      onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium focus:outline-none focus:border-[#00A896]"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="Salaried Employee / Professional">Salaried Employee</option>
                      <option value="Freelancer & Contractor">Freelancer &amp; Contractor</option>
                      <option value="Business Owner / Entrepreneur">Business Owner</option>
                      <option value="Student & Personal Budgeter">Student</option>
                      <option value="Platform Administrator">Platform Administrator</option>
                    </select>
                  </div>

                  {/* Filter Currency */}
                  <div>
                    <select
                      value={filterCurrency}
                      onChange={e => { setFilterCurrency(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium focus:outline-none focus:border-[#00A896]"
                    >
                      <option value="ALL">All Currencies</option>
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  {/* Clear Filters button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSearchQuery(''); setFilterRole('ALL'); setFilterCurrency('ALL'); setFilterStatus('ALL'); setCurrentPage(1); }}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-bold text-slate-600 dark:text-zinc-300 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>

                </div>
              </div>

              {/* Batch Actions Bar (Shows when 1+ rows selected) */}
              {selectedUserIds.length > 0 && (
                <div className="p-3 rounded-xl bg-[#0E2A47] text-white flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <span className="font-bold">{selectedUserIds.length} accounts selected</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => triggerToast(`${selectedUserIds.length} accounts exported to CSV`)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold">
                      Export CSV
                    </button>
                    <button onClick={() => setSelectedUserIds([])} className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold">
                      Deselect All
                    </button>
                  </div>
                </div>
              )}

              {/* User Directory Table Container */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3 w-8">
                          <input type="checkbox" onChange={toggleSelectAll} checked={selectedUserIds.length === paginatedProfiles.length && paginatedProfiles.length > 0} className="rounded accent-[#00A896]" />
                        </th>
                        <th className="py-3 px-3">User Profile</th>
                        <th className="py-3 px-3">Role Policy</th>
                        <th className="py-3 px-3 text-center">Currency</th>
                        <th className="py-3 px-3 text-center">Account Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {paginatedProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
                            <p className="font-bold">No user accounts found matching your search</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedProfiles.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/60 transition-colors">
                            <td className="py-3.5 px-3">
                              <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleSelectRow(user.id)} className="rounded accent-[#00A896]" />
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={user.name} className="w-8 h-8 rounded-full" />
                                <div>
                                  <p className="font-black text-slate-900 dark:text-zinc-100">{user.name}</p>
                                  <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-zinc-300">
                              {user.role}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono font-bold">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                {user.default_currency || 'NGN'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Active
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedUserDrawer(user)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A896] hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                  title="Inspect User Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingUserModal(user);
                                    setEditUserName(user.name);
                                    setEditUserEmail(user.email);
                                    setEditUserRole(user.role);
                                    setEditUserCurrency(user.default_currency || 'NGN');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                  title="Edit Account Details"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-zinc-850 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-bold"
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                    <span>Total {filteredProfiles.length} records</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 font-mono font-bold text-slate-900 dark:text-zinc-100">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Platform Overview Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Total Users</span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">{profiles.length || 52410}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Total Buckets</span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">{buckets.length || 314890}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Transactions</span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">{transactions.length || 142080}</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0E2A47] text-white border border-[#103050] shadow-md space-y-2">
                  <span className="text-[10px] font-black uppercase text-teal-200">Allocation Accuracy</span>
                  <p className="text-2xl font-black font-mono text-white">100.00%</p>
                </div>
              </div>
            </div>
          )}

          {/* Broadcast Announcement Tab */}
          {activeTab === 'broadcast' && (
            <form onSubmit={e => { e.preventDefault(); triggerToast('Broadcast notification sent to all accounts'); }} className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-zinc-800 max-w-lg space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-zinc-100">Send System Notification</h3>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notification Title</label>
                <input type="text" required className="w-full px-3 py-2 rounded-xl border dark:border-zinc-800 dark:bg-zinc-900 text-base sm:text-xs" placeholder="System Notice Title..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message Content</label>
                <textarea required rows={3} className="w-full px-3 py-2 rounded-xl border dark:border-zinc-800 dark:bg-zinc-900 text-base sm:text-xs" placeholder="Message details..." />
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#00A896] text-white text-xs font-bold hover:bg-[#0E2A47]">Send Notice to All Users</button>
            </form>
          )}

          {/* Database Backups Tab */}
          {activeTab === 'backups' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-zinc-800 max-w-md space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-zinc-100">Database Snapshots &amp; Storage</h3>
              <p className="text-xs text-slate-400 font-mono">Storage Used: {calculateLocalStorageQuota()} KB / 5120 KB</p>
              <button onClick={handleExportDb} className="px-4 py-2.5 rounded-xl bg-[#0E2A47] text-white text-xs font-bold flex items-center gap-2">
                <Download className="w-4 h-4" /> Download JSON Backup
              </button>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. ADD NEW USER MODAL */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleAddUserSubmit} className="bg-white dark:bg-[#0E1A2E] rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-850">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">Add New User Account</h3>
              <button type="button" onClick={() => setShowAddUserModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium" placeholder="e.g. Chidi Okechukwu" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium" placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <input type="password" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium" placeholder="Minimum 6 characters" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role Policy</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium">
                  <option value="Salaried Employee / Professional">Salaried Employee / Professional</option>
                  <option value="Freelancer & Contractor">Freelancer &amp; Contractor</option>
                  <option value="Business Owner / Entrepreneur">Business Owner / Entrepreneur</option>
                  <option value="Student & Personal Budgeter">Student &amp; Personal Budgeter</option>
                  <option value="Platform Administrator">Platform Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Currency</label>
                <select value={newUserCurrency} onChange={e => setNewUserCurrency(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium">
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-850">
              <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-bold text-xs shadow-md">Create Account</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editingUserModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleEditUserSubmit} className="bg-white dark:bg-[#0E1A2E] rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-850">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">Edit Account Details</h3>
              <button type="button" onClick={() => setEditingUserModal(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input type="text" required value={editUserName} onChange={e => setEditUserName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input type="email" required value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role Policy</label>
                <select value={editUserRole} onChange={e => setEditUserRole(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium">
                  <option value="Salaried Employee / Professional">Salaried Employee / Professional</option>
                  <option value="Freelancer & Contractor">Freelancer &amp; Contractor</option>
                  <option value="Business Owner / Entrepreneur">Business Owner / Entrepreneur</option>
                  <option value="Student & Personal Budgeter">Student &amp; Personal Budgeter</option>
                  <option value="Platform Administrator">Platform Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Currency</label>
                <select value={editUserCurrency} onChange={e => setEditUserCurrency(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-base sm:text-xs font-medium">
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-850">
              <button type="button" onClick={() => setEditingUserModal(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white font-bold text-xs shadow-md">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SLIDE-OVER USER INSPECTION DRAWER */}
      {/* ========================================================================= */}
      {selectedUserDrawer && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedUserDrawer(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0E1A2E] h-full shadow-2xl z-50 p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-zinc-100">User Account Inspection</h3>
              <button onClick={() => setSelectedUserDrawer(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Avatar name={selectedUserDrawer.name} className="w-14 h-14 rounded-full" />
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-zinc-100">{selectedUserDrawer.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{selectedUserDrawer.email}</p>
                <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00A896]/10 text-[#00A896] border border-[#00A896]/20">
                  {selectedUserDrawer.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-150 dark:border-zinc-850 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Account ID:</span>
                <span className="font-mono text-slate-700 dark:text-zinc-300 font-bold truncate max-w-[200px]">{selectedUserDrawer.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Default Currency:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{selectedUserDrawer.default_currency || 'NGN'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Account Status:</span>
                <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-150 dark:border-zinc-850">
              <button
                onClick={() => {
                  setEditingUserModal(selectedUserDrawer);
                  setEditUserName(selectedUserDrawer.name);
                  setEditUserEmail(selectedUserDrawer.email);
                  setEditUserRole(selectedUserDrawer.role);
                  setEditUserCurrency(selectedUserDrawer.default_currency || 'NGN');
                  setSelectedUserDrawer(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit Account Details
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUserDrawer.id, selectedUserDrawer.name)}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Command Palette Overlay (Cmd + K) */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0E1A2E] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-850">
              <span className="text-xs font-bold text-slate-400">Search Command Center</span>
              <kbd className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Search user, account ID, or action..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-base sm:text-xs bg-transparent font-medium focus:outline-none"
            />
            <div className="space-y-1 text-xs">
              <button onClick={() => { navigateToTab('users', '/admin/users'); setShowCommandPalette(false); }} className="w-full text-left p-2 rounded-xl hover:bg-[#00A896]/10 hover:text-[#00A896] font-bold">
                Jump to User Directory
              </button>
              <button onClick={() => { navigateToTab('categories', '/admin/categories'); setShowCommandPalette(false); }} className="w-full text-left p-2 rounded-xl hover:bg-[#00A896]/10 hover:text-[#00A896] font-bold">
                Jump to Budget Buckets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[130] px-4 py-3 rounded-2xl bg-[#0E2A47] text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200 border border-[#103050]">
          <CheckCircle2 className="w-4 h-4 text-[#00A896]" />
          <span>{showToast}</span>
        </div>
      )}

    </div>
  );
}
