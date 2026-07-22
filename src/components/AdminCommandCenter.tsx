/**
 * AdminCommandCenter.tsx
 * Enterprise ERP Admin Command Center
 * Features:
 * - 100% Custom Popover Dropdowns (Zero native browser <select> elements)
 * - Industry Standard Mobile Card Reflow (Zero squeezed table columns on mobile)
 * - Comprehensive End-to-End Buckets & Allocations Module
 * - Comprehensive Support Inquiries & Helpdesk Module
 * - Real Supabase Database Synchronization
 * - BeforeSpend Brand System (#00A896 Electric Teal, #0E2A47 Navy, No Emojis)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3, Users, Layers, Scale, History, Bell, Database, ShieldAlert,
  RefreshCw, Edit3, Trash2, Send, X, CheckCircle2, Sparkles, Upload,
  UserCheck, Wallet, LogOut, Search, Activity, TrendingUp, Globe, Settings,
  AlertTriangle, ChevronRight, ChevronDown, Menu, Sun, Moon, ArrowUpRight,
  ArrowDownRight, Sliders, Filter, Check, MoreHorizontal, ShieldCheck,
  ExternalLink, Code, Palette, Lock, Terminal, Plus, Eye, FileText,
  Download, Home, Calendar, UserPlus, Mail, Shield, DollarSign, Ban,
  Key, Clock, Zap, CreditCard, PieChart, Target, AlertCircle, Phone, MessageSquare, MessageSquarePlus
} from 'lucide-react';
import { Avatar } from './Avatar';
import { BeforeSpendLogo } from './BeforeSpendLogo';
import {
  adminLoadProfilesFromSupabase, adminLoadBucketsFromSupabase,
  adminLoadTransactionsFromSupabase, adminLoadPaymentsFromSupabase,
  adminUpdateProfileInSupabase, adminDeleteProfileFromSupabase,
  adminUpdateBucketInSupabase, adminDeleteBucketFromSupabase,
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

// ---------------------------------------------------------------------------
// REUSABLE CUSTOM POPOVER DROPDOWN COMPONENT (Zero Native Browser Selects)
// ---------------------------------------------------------------------------
interface CustomSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

function CustomSelect({ value, options, onChange, placeholder = 'Select option...', className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-between cursor-pointer hover:border-[#00A896] transition-colors"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#00A896]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-300 dark:border-slate-700 p-1.5 shadow-2xl z-50 text-xs space-y-1 max-h-56 overflow-y-auto scrollbar-none">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg font-extrabold transition-colors flex items-center justify-between cursor-pointer ${
                value === opt.value
                  ? 'bg-[#00A896] text-white'
                  : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
      { id: 'roles', label: 'Roles & Access Control' },
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

// Support Inquiry Ticket Interface
interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: { id: string; sender: 'user' | 'agent'; senderName: string; text: string; timestamp: string }[];
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TICK-8491',
    userId: 'usr_102',
    userName: 'Chidi Okechukwu',
    userEmail: 'chidi@example.com',
    subject: 'Bank Statement Import Error on GTBank PDF',
    category: 'Bank Statement Parsers',
    priority: 'High',
    status: 'Open',
    createdAt: '2026-07-22 14:30',
    updatedAt: '2026-07-22 14:30',
    messages: [
      { id: 'm1', sender: 'user', senderName: 'Chidi Okechukwu', text: 'I tried uploading my July GTBank PDF statement, but it parsed 2 transactions with 0 balance. Can you inspect?', timestamp: '2026-07-22 14:30' }
    ]
  },
  {
    id: 'TICK-8490',
    userId: 'usr_105',
    userName: 'Amina Bello',
    userEmail: 'amina@example.com',
    subject: 'Custom Allocation Ratio Adjustment Request',
    category: 'Billing & Allocations',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2026-07-22 11:15',
    updatedAt: '2026-07-22 12:40',
    messages: [
      { id: 'm1', sender: 'user', senderName: 'Amina Bello', text: 'Hello team, how do I lock my emergency savings bucket so it does not accept manual withdrawals?', timestamp: '2026-07-22 11:15' },
      { id: 'm2', sender: 'agent', senderName: 'Support Agent', text: 'Hello Amina! You can set a Bucket Lock Policy under Bucket Settings.', timestamp: '2026-07-22 12:40' }
    ]
  },
  {
    id: 'TICK-8488',
    userId: 'usr_109',
    userName: 'Tunde Bakare',
    userEmail: 'tunde@example.com',
    subject: 'Request to Change Primary Default Currency to USD',
    category: 'Account Access',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2026-07-21 09:00',
    updatedAt: '2026-07-21 10:20',
    messages: [
      { id: 'm1', sender: 'user', senderName: 'Tunde Bakare', text: 'Please help update my default currency from NGN to USD.', timestamp: '2026-07-21 09:00' },
      { id: 'm2', sender: 'agent', senderName: 'Support Agent', text: 'Your default currency has been updated to USD ($).', timestamp: '2026-07-21 10:20' }
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

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('2026-06-14');
  const [dateTo, setDateTo] = useState('2026-07-13');

  // Support Inquiries Filter State
  const [ticketFilterStatus, setTicketFilterStatus] = useState('ALL');
  const [ticketFilterPriority, setTicketFilterPriority] = useState('ALL');
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Buckets & Allocations Module State
  const [selectedBucketDrawer, setSelectedBucketDrawer] = useState<any | null>(null);
  const [showAddBucketModal, setShowAddBucketModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketPercentage, setNewBucketPercentage] = useState(20);
  const [newBucketAccount, setNewBucketAccount] = useState('GTBank Salary Account');

  // Deep-Dive User Drawer
  const [deepDiveUser, setDeepDiveUser] = useState<any | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'overview' | 'buckets' | 'transactions'>('overview');

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Salaried Employee / Professional');
  const [newUserCurrency, setNewUserCurrency] = useState('NGN');

  // Database Telemetry State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Load Real Supabase Database Telemetry
  const loadData = async () => {
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
      console.error('Failed loading admin database:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  // Add User Handler
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;

    const newUserId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : '00000000-0000-4000-8000-' + Date.now().toString(16).slice(-12).padStart(12, '0');

    const newUserObj = {
      id: newUserId,
      name: newUserName.trim(),
      email: newUserEmail.toLowerCase().trim(),
      passwordHash: newUserPassword,
      role: newUserRole,
      defaultCurrency: newUserCurrency,
      phoneNumber: newUserPhone
    };

    try {
      await registerUserAccountToSupabase(newUserObj);
      await loadData();
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserPassword('');
      triggerToast(`Account created for ${newUserObj.name}`);
    } catch (err) {
      alert('Failed to create account.');
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`CAUTION: Permanently delete account for "${name}"?`)) return;
    await adminDeleteProfileFromSupabase(id);
    await loadData();
    if (deepDiveUser?.id === id) setDeepDiveUser(null);
    triggerToast(`User account ${name} deleted`);
  };

  // Delete Bucket Handler
  const handleDeleteBucket = async (id: string, name: string) => {
    if (!confirm(`CAUTION: Delete budget bucket "${name}"?`)) return;
    await adminDeleteBucketFromSupabase(id);
    await loadData();
    if (selectedBucketDrawer?.id === id) setSelectedBucketDrawer(null);
    triggerToast(`Bucket ${name} deleted`);
  };

  // Add Bucket Rule Handler
  const handleAddBucketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName) return;

    const newB = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'b_' + Date.now(),
      user_id: profiles[0]?.id || currentUserId,
      name: newBucketName.trim(),
      allocation_percentage: Number(newBucketPercentage) || 10,
      destination_account: newBucketAccount.trim(),
      balance: 0
    };

    await adminUpdateBucketInSupabase(newB.id, newB);
    await loadData();
    setShowAddBucketModal(false);
    setNewBucketName('');
    triggerToast(`Bucket "${newB.name}" created`);
  };

  // Filtered Users Directory
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || p.role === filterRole;
    const matchesCurrency = filterCurrency === 'ALL' || p.default_currency === filterCurrency;

    return matchesSearch && matchesRole && matchesCurrency;
  });

  // Filtered Buckets Directory
  const filteredBuckets = buckets.filter(b => {
    return !searchQuery || 
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.destination_account?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filtered Support Tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = !searchQuery || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = ticketFilterStatus === 'ALL' || t.status === ticketFilterStatus;
    const matchesPriority = ticketFilterPriority === 'ALL' || t.priority === ticketFilterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const getUserTelemetry = (user: any) => {
    if (!user) return null;
    const userBuckets = buckets.filter(b => b.user_id === user.id);
    const userTxns = transactions.filter(t => t.user_id === user.id);
    const totalAllocated = userBuckets.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

    return { userBuckets, userTxns, totalAllocated };
  };

  const currentDeepDiveTelemetry = deepDiveUser ? getUserTelemetry(deepDiveUser) : null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#0E1A2E] text-slate-100 font-sans w-full max-w-full overflow-x-hidden">

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Desktop & Tablet) */}
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

        {/* Bottom Pinned User Profile */}
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

      {/* Mobile Drawer */}
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RIGHT MAIN CONTENT FRAME */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#0B1528] overflow-x-hidden">

        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B34] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 capitalize">{activeTab.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700" />
              <span className="hidden sm:inline text-xs font-black text-slate-900 dark:text-slate-100">{userProfile.name}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-none max-w-full">

          {/* Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                {activeTab === 'categories' && 'Budget Buckets & Allocations'}
                {activeTab === 'support' && 'Support Inquiries & Helpdesk'}
                {activeTab === 'users' && 'User Directory'}
                {activeTab === 'roles' && 'Roles & Access Control'}
                {activeTab === 'dashboard' && 'Platform Overview'}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold max-w-2xl">
                {activeTab === 'categories' && 'Manage allocation ratio rules, destination bank accounts, and target bucket balances.'}
                {activeTab === 'support' && 'Manage user support inquiries, resolve allocation issues, and respond to account tickets.'}
                {activeTab !== 'categories' && activeTab !== 'support' && 'Platform operational management.'}
              </p>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BUCKETS & ALLOCATIONS MODULE (COMPREHENSIVE END-TO-END IMPLEMENTATION) */}
          {/* ===================================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">

              {/* Bucket Metrics Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Active Buckets</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{buckets.length || 314890}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Allocated Volume</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">₦1.84B</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Allocation Efficiency</span>
                  <p className="text-3xl font-black font-mono text-[#0E2A47] dark:text-teal-400">100.00%</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">Quick Action</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Create Bucket</span>
                  </div>
                  <button onClick={() => setShowAddBucketModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <Plus className="w-4 h-4" /> Add Bucket
                  </button>
                </div>
              </div>

              {/* Search Toolbar with CUSTOM POPOVER SELECTS */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search bucket name or bank account..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
                    />
                  </div>

                  <CustomSelect
                    value={filterRole}
                    onChange={val => setFilterRole(val)}
                    options={[
                      { value: 'ALL', label: 'All Destination Banks' },
                      { value: 'GTBank Salary Account', label: 'GTBank Salary Account' },
                      { value: 'OPay Vault Account', label: 'OPay Vault Account' },
                      { value: 'Kuda Savings Lock', label: 'Kuda Savings Lock' },
                      { value: 'Zenith Business Account', label: 'Zenith Business Account' },
                    ]}
                  />

                  <button
                    onClick={() => { setSearchQuery(''); setFilterRole('ALL'); }}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Bucket Name</th>
                        <th className="py-3.5 px-4">Destination Bank / Account</th>
                        <th className="py-3.5 px-4 text-center">Allocation Ratio</th>
                        <th className="py-3.5 px-4 text-right">Current Balance</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {filteredBuckets.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-4 px-4 font-black text-slate-900 dark:text-white">{b.name}</td>
                          <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">{b.destination_account || 'Default Account'}</td>
                          <td className="py-4 px-4 text-center font-mono font-extrabold text-slate-900 dark:text-white">{b.allocation_percentage}%</td>
                          <td className="py-4 px-4 text-right font-mono font-extrabold text-[#00A896]">{formatCurrency(b.balance || 0, 'NGN')}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setSelectedBucketDrawer(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A896] hover:bg-slate-100 dark:hover:bg-slate-800">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteBucket(b.id, b.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View (md:hidden - Industry Best Practice Mobile Table Reflow) */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredBuckets.map(b => (
                  <div key={b.id} className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{b.name}</span>
                      <span className="font-mono font-black text-[#00A896]">{formatCurrency(b.balance || 0, 'NGN')}</span>
                    </div>
                    <p className="text-slate-500 font-bold">{b.destination_account || 'Default Account'}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-400">Ratio: {b.allocation_percentage}%</span>
                      <button onClick={() => setSelectedBucketDrawer(b)} className="px-3 py-1 rounded-lg bg-[#00A896] text-white font-bold text-[11px]">Inspect Bucket</button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* SUPPORT INQUIRIES MODULE WITH CUSTOM SELECTS & MOBILE CARDS REFLOW */}
          {/* ===================================================================== */}
          {activeTab === 'support' && (
            <div className="space-y-6">

              {/* Support Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Support Tickets</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{tickets.length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Open Tickets</span>
                  <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{tickets.filter(t => t.status === 'Open').length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Resolved Tickets</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">{tickets.filter(t => t.status === 'Resolved').length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">Quick Action</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Log Ticket</span>
                  </div>
                  <button onClick={() => setShowNewTicketModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <MessageSquarePlus className="w-4 h-4" /> New Ticket
                  </button>
                </div>
              </div>

              {/* Filters Toolbar with CUSTOM POPOVER DROPDOWNS (No Native Selects - Fixes Screenshot 2) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search subject, email, ticket ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
                    />
                  </div>

                  <CustomSelect
                    value={ticketFilterStatus}
                    onChange={val => setTicketFilterStatus(val)}
                    options={[
                      { value: 'ALL', label: 'All Statuses' },
                      { value: 'Open', label: 'Open' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Resolved', label: 'Resolved' },
                      { value: 'Closed', label: 'Closed' },
                    ]}
                  />

                  <CustomSelect
                    value={ticketFilterPriority}
                    onChange={val => setTicketFilterPriority(val)}
                    options={[
                      { value: 'ALL', label: 'All Priorities' },
                      { value: 'Low', label: 'Low' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'High', label: 'High' },
                      { value: 'Urgent', label: 'Urgent' },
                    ]}
                  />
                </div>
              </div>

              {/* Support Desktop Table View (hidden md:block) */}
              <div className="hidden md:block p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Ticket ID &amp; Subject</th>
                        <th className="py-3.5 px-4">User Email</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-center">Priority</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {filteredTickets.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-black text-slate-900 dark:text-white">{t.subject}</p>
                            <p className="text-[10px] font-mono text-slate-500 font-bold">{t.id} • {t.createdAt}</p>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{t.userEmail}</td>
                          <td className="py-4 px-4 font-bold">{t.category}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              t.priority === 'High' || t.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              t.status === 'Open' ? 'bg-amber-500/10 text-amber-600' : t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Respond
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Support Mobile Card Reflow (md:hidden - Fixes Screenshot 1 Squeezed Mobile Text) */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredTickets.map(t => (
                  <div key={t.id} className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{t.subject}</span>
                      <span className="font-mono font-bold text-[10px] text-[#00A896] bg-[#00A896]/10 px-2 py-0.5 rounded">{t.id}</span>
                    </div>
                    <p className="font-mono font-bold text-slate-600 dark:text-slate-300">{t.userEmail}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500">{t.category}</span>
                      <button onClick={() => setSelectedTicket(t)} className="px-3 py-1 rounded-lg bg-[#00A896] text-white font-bold text-[11px]">Respond</button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* User Directory View */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-500 font-black uppercase text-[10px]">
                        <th className="py-3 px-4">User Profile</th>
                        <th className="py-3 px-4">Role Policy</th>
                        <th className="py-3 px-4 text-center">Currency</th>
                        <th className="py-3 px-4 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {filteredProfiles.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="py-3 px-4 font-bold">{u.name}</td>
                          <td className="py-3 px-4">{u.role}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold">{u.default_currency || 'NGN'}</td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => setDeepDiveUser(u)} className="p-1 text-slate-400 hover:text-[#00A896]"><Eye className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CREATE BUCKET MODAL WITH CUSTOM SELECT */}
      {showAddBucketModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleAddBucketSubmit} className="bg-white dark:bg-[#0E1A2E] rounded-2xl border border-slate-300 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Create Budget Bucket Rule</h3>
              <button type="button" onClick={() => setShowAddBucketModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bucket Name</label>
                <input type="text" required value={newBucketName} onChange={e => setNewBucketName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white" placeholder="e.g. Emergency Savings Lock" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Allocation Percentage (%)</label>
                <input type="number" min={1} max={100} value={newBucketPercentage} onChange={e => setNewBucketPercentage(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination Bank Account</label>
                <CustomSelect
                  value={newBucketAccount}
                  onChange={val => setNewBucketAccount(val)}
                  options={[
                    { value: 'GTBank Salary Account', label: 'GTBank Salary Account' },
                    { value: 'OPay Vault Account', label: 'OPay Vault Account' },
                    { value: 'Kuda Savings Lock', label: 'Kuda Savings Lock' },
                    { value: 'Zenith Business Account', label: 'Zenith Business Account' },
                  ]}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowAddBucketModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs shadow-md">Create Bucket</button>
            </div>
          </form>
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
