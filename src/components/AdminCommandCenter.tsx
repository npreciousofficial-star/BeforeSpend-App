/**
 * AdminCommandCenter.tsx
 * Enterprise ERP Admin Command Center & Support Inquiries Module
 * Engineered with BeforeSpend Brand System (#0E2A47 Navy, #00A896 Electric Teal), High-Contrast Typography, & Support Ticket Workflows.
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
  Key, Clock, Zap, CreditCard, PieChart, Target, AlertCircle, Phone, MessageSquare, MessageCircle, MessageSquarePlus
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
  category: 'Billing & Allocations' | 'Bank Statement Parsers' | 'Account Access' | 'Security' | 'Feature Request';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Pending User' | 'Resolved' | 'Closed';
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('2026-06-14');
  const [dateTo, setDateTo] = useState('2026-07-13');

  // Support Module State
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketFilterStatus, setTicketFilterStatus] = useState('ALL');
  const [ticketFilterPriority, setTicketFilterPriority] = useState('ALL');
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form
  const [newTicketUserEmail, setNewTicketUserEmail] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'Billing & Allocations' | 'Bank Statement Parsers' | 'Account Access' | 'Security' | 'Feature Request'>('Billing & Allocations');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  // Dropdown Toggle States
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  // Database State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Load Database Telemetry
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
      console.error('Failed loading admin data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  // Support Reply Handler
  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText.trim()) return;

    const newMsg = {
      id: 'm_' + Date.now(),
      sender: 'agent' as const,
      senderName: userProfile.name || 'Support Specialist',
      text: ticketReplyText.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updated = {
      ...selectedTicket,
      status: 'In Progress' as const,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      messages: [...selectedTicket.messages, newMsg]
    };

    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setTicketReplyText('');
    triggerToast('Reply dispatched to user');
  };

  // Ticket Status Change
  const handleUpdateTicketStatus = (ticketId: string, newStatus: SupportTicket['status']) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) } : t));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
    }
    triggerToast(`Ticket status updated to ${newStatus}`);
  };

  // Create Ticket Handler
  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketUserEmail || !newTicketSubject || !newTicketMessage) return;

    const newT: SupportTicket = {
      id: 'TICK-' + Math.floor(1000 + Math.random() * 9000),
      userId: 'usr_new',
      userName: newTicketUserEmail.split('@')[0],
      userEmail: newTicketUserEmail.toLowerCase().trim(),
      subject: newTicketSubject.trim(),
      category: newTicketCategory,
      priority: newTicketPriority,
      status: 'Open',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      messages: [
        {
          id: 'm1',
          sender: 'user',
          senderName: newTicketUserEmail.split('@')[0],
          text: newTicketMessage.trim(),
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        }
      ]
    };

    setTickets([newT, ...tickets]);
    setShowNewTicketModal(false);
    setNewTicketUserEmail('');
    setNewTicketSubject('');
    setNewTicketMessage('');
    triggerToast(`Support ticket ${newT.id} created`);
  };

  // Filtered Tickets
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

  return (
    <div className={`fixed inset-0 z-[100] flex bg-[#0E1A2E] text-slate-100 font-sans ${isDarkMode ? 'dark' : ''} w-full max-w-full overflow-x-hidden`}>

      {/* Backdrop for custom popovers */}
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
      {/* 1. LEFT SIDEBAR */}
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
                {activeTab === 'support' && 'Support Inquiries & Helpdesk'}
                {activeTab === 'users' && 'User Directory'}
                {activeTab === 'roles' && 'Roles & Access Control'}
                {activeTab === 'dashboard' && 'Platform Overview'}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold max-w-2xl">
                {activeTab === 'support' && 'Manage user support inquiries, resolve allocation issues, and respond to account tickets.'}
                {activeTab !== 'support' && 'Platform operational management.'}
              </p>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SUPPORT INQUIRIES MODULE (END-TO-END IMPLEMENTATION) */}
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

              {/* Filters Toolbar */}
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

                  <select
                    value={ticketFilterStatus}
                    onChange={e => setTicketFilterStatus(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>

                  <select
                    value={ticketFilterPriority}
                    onChange={e => setTicketFilterPriority(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Support Inquiries Table */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
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

            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* TICKET RESPONDER DRAWER */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedTicket(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0D1B34] h-full shadow-2xl z-50 p-6 overflow-y-auto space-y-6 flex flex-col">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#00A896]">{selectedTicket.id}</span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedTicket.userName} ({selectedTicket.userEmail})</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Control Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-extrabold text-slate-600 dark:text-slate-400">Update Status:</span>
              <div className="flex gap-1">
                {(['Open', 'In Progress', 'Resolved', 'Closed'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                      selectedTicket.status === st ? 'bg-[#00A896] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {selectedTicket.messages.map(m => (
                <div key={m.id} className={`p-4 rounded-2xl text-xs space-y-1.5 ${
                  m.sender === 'agent' ? 'bg-[#00A896]/10 text-slate-900 dark:text-slate-100 border border-[#00A896]/20 ml-6' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mr-6'
                }`}>
                  <div className="flex justify-between font-black">
                    <span>{m.senderName}</span>
                    <span className="text-[10px] font-mono text-slate-500">{m.timestamp}</span>
                  </div>
                  <p className="font-medium leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendTicketReply} className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <textarea
                required
                rows={3}
                value={ticketReplyText}
                onChange={e => setTicketReplyText(e.target.value)}
                placeholder="Type resolution reply to user..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md">
                <Send className="w-4 h-4" /> Dispatch Resolution Reply
              </button>
            </form>

          </div>
        </div>
      )}

      {/* NEW TICKET MODAL */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleCreateTicketSubmit} className="bg-white dark:bg-[#0E1A2E] rounded-2xl border border-slate-300 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Log Support Inquiry Ticket</h3>
              <button type="button" onClick={() => setShowNewTicketModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User Email</label>
                <input type="email" required value={newTicketUserEmail} onChange={e => setNewTicketUserEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white" placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inquiry Subject</label>
                <input type="text" required value={newTicketSubject} onChange={e => setNewTicketSubject(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white" placeholder="Brief issue description..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inquiry Details</label>
                <textarea required rows={3} value={newTicketMessage} onChange={e => setNewTicketMessage(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white" placeholder="Full message details..." />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowNewTicketModal(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs shadow-md">Create Ticket</button>
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
