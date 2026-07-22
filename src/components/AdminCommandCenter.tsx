/**
 * AdminCommandCenter.tsx
 * Enterprise ERP Admin Command Center
 * Features:
 * - Persistent URL History Routing (Refreshing stays on active tab: /admin/users, /admin/roles, /admin/support, etc.)
 * - Rich SaaS Top Header (Mobile toggle, sidebar collapse button, Cmd+K search trigger, Notification bell, Dark Mode toggle, user details)
 * - Mobile Sidebar Accordion Sub-Menus (Expandable/collapsible sub-items on mobile drawer)
 * - High-Contrast Text System (Zero low-contrast text in light or dark mode)
 * - 100% Custom Popover Selects & Mobile Card Reflow
 * - Comprehensive End-to-End User Directory, Roles, Buckets & Support Inquiries Modules
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

// Helper to determine initial active tab from URL path
const getTabFromLocation = (): string => {
  if (typeof window === 'undefined') return 'dashboard';
  const path = window.location.pathname;
  if (path.includes('/admin/users')) return 'users';
  if (path.includes('/admin/roles')) return 'roles';
  if (path.includes('/admin/support')) return 'support';
  if (path.includes('/admin/categories')) return 'categories';
  if (path.includes('/admin/reconciliation')) return 'reconciliation';
  if (path.includes('/admin/ledger')) return 'ledger';
  if (path.includes('/admin/analytics')) return 'analytics';
  if (path.includes('/admin/retention')) return 'retention';
  if (path.includes('/admin/broadcast')) return 'broadcast';
  if (path.includes('/admin/audit')) return 'audit';
  if (path.includes('/admin/flags')) return 'flags';
  if (path.includes('/admin/backups')) return 'backups';
  if (path.includes('/admin/styleguide')) return 'styleguide';
  return 'dashboard';
};

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

interface SystemRole {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: { [key: string]: { create: boolean; read: boolean; update: boolean; delete: boolean } };
}

const INITIAL_ROLES: SystemRole[] = [
  {
    id: 'admin',
    name: 'Platform Administrator',
    description: 'Full root access to all financial telemetry, audit logs, system configurations, and user accounts.',
    userCount: 1,
    permissions: {
      users: { create: true, read: true, update: true, delete: true },
      buckets: { create: true, read: true, update: true, delete: true },
      ledger: { create: true, read: true, update: true, delete: true },
      broadcasts: { create: true, read: true, update: true, delete: true },
      audit: { create: true, read: true, update: true, delete: true },
      settings: { create: true, read: true, update: true, delete: true },
    }
  },
  {
    id: 'fin_lead',
    name: 'Finance Operations Manager',
    description: 'Manages allocation bucket rules, reconciliation audit parsers, and financial statement verification.',
    userCount: 3,
    permissions: {
      users: { create: false, read: true, update: true, delete: false },
      buckets: { create: true, read: true, update: true, delete: true },
      ledger: { create: true, read: true, update: true, delete: false },
      broadcasts: { create: false, read: true, update: false, delete: false },
      audit: { create: false, read: true, update: false, delete: false },
      settings: { create: false, read: true, update: false, delete: false },
    }
  },
  {
    id: 'support_lead',
    name: 'Compliance & Support Specialist',
    description: 'Handles support inquiries, user account verification, direct broadcasts, and profile inspects.',
    userCount: 5,
    permissions: {
      users: { create: false, read: true, update: true, delete: false },
      buckets: { create: false, read: true, update: false, delete: false },
      ledger: { create: false, read: false, update: false, delete: false },
      broadcasts: { create: true, read: true, update: true, delete: false },
      audit: { create: false, read: true, update: false, delete: false },
      settings: { create: false, read: true, update: false, delete: false },
    }
  },
  {
    id: 'employee',
    name: 'Salaried Employee / Professional',
    description: 'Standard end-user profile with automated income allocation and bucket locking features.',
    userCount: 1420,
    permissions: {
      users: { create: false, read: false, update: false, delete: false },
      buckets: { create: true, read: true, update: true, delete: false },
      ledger: { create: false, read: true, update: false, delete: false },
      broadcasts: { create: false, read: true, update: false, delete: false },
      audit: { create: false, read: false, update: false, delete: false },
      settings: { create: false, read: false, update: false, delete: false },
    }
  },
  {
    id: 'freelancer',
    name: 'Freelancer & Contractor',
    description: 'Multi-currency profile tailored for variable invoice inflows and tax set-aside buckets.',
    userCount: 890,
    permissions: {
      users: { create: false, read: false, update: false, delete: false },
      buckets: { create: true, read: true, update: true, delete: false },
      ledger: { create: false, read: true, update: false, delete: false },
      broadcasts: { create: false, read: true, update: false, delete: false },
      audit: { create: false, read: false, update: false, delete: false },
      settings: { create: false, read: false, update: false, delete: false },
    }
  }
];

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
  // Navigation State with URL Path History Persistence
  const [activeTab, setActiveTab] = useState<string>(getTabFromLocation);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    user_ops: true,
    financial_ops: true,
    platform_ops: false,
    growth_ops: false
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Sync tab changes with browser history URL path
  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    const targetPath = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');

  // Roles Module State
  const [roles, setRoles] = useState<SystemRole[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<SystemRole>(INITIAL_ROLES[0]);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Support Inquiries Module State
  const [ticketFilterStatus, setTicketFilterStatus] = useState('ALL');
  const [ticketFilterPriority, setTicketFilterPriority] = useState('ALL');
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form
  const [newTicketUserEmail, setNewTicketUserEmail] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Billing & Allocations');
  const [newTicketPriority, setNewTicketPriority] = useState('Medium');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  // Buckets Module State
  const [selectedBucketDrawer, setSelectedBucketDrawer] = useState<any | null>(null);
  const [showAddBucketModal, setShowAddBucketModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketPercentage, setNewBucketPercentage] = useState(20);
  const [newBucketAccount, setNewBucketAccount] = useState('GTBank Salary Account');

  // Deep-Dive User Behavioral Intelligence Drawer State
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

  // Toggle Role Permission Matrix
  const togglePermission = (roleId: string, moduleKey: string, permType: 'create' | 'read' | 'update' | 'delete') => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const modPerms = r.permissions[moduleKey] || { create: false, read: false, update: false, delete: false };
      return {
        ...r,
        permissions: {
          ...r.permissions,
          [moduleKey]: {
            ...modPerms,
            [permType]: !modPerms[permType]
          }
        }
      };
    }));
    triggerToast('Role permission updated');
  };

  // Create Custom Role Handler
  const handleCreateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;

    const newR: SystemRole = {
      id: 'role_' + Date.now(),
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Custom platform access role policy.',
      userCount: 0,
      permissions: {
        users: { create: false, read: true, update: false, delete: false },
        buckets: { create: false, read: true, update: false, delete: false },
        ledger: { create: false, read: true, update: false, delete: false },
        broadcasts: { create: false, read: false, update: false, delete: false },
        audit: { create: false, read: false, update: false, delete: false },
        settings: { create: false, read: false, update: false, delete: false },
      }
    };

    setRoles([...roles, newR]);
    setSelectedRole(newR);
    setShowCreateRoleModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
    triggerToast(`Custom role "${newR.name}" created`);
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

  // Update Ticket Status
  const handleUpdateTicketStatus = (ticketId: string, newStatus: string) => {
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

  // Filtered Lists
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'ALL' || p.role === filterRole;
    const matchesCurrency = filterCurrency === 'ALL' || p.default_currency === filterCurrency;
    return matchesSearch && matchesRole && matchesCurrency;
  });

  const filteredBuckets = buckets.filter(b => {
    return !searchQuery || 
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.destination_account?.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      {/* 1. LEFT SIDEBAR */}
      {/* ========================================================================= */}
      <aside className={`hidden md:flex flex-col bg-[#0A1220] border-r border-slate-800/80 select-none flex-shrink-0 transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}>
        
        {/* Brand Header (Zero "Admin" badge) */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
          {isSidebarCollapsed ? (
            <div className="w-8 h-8 rounded-xl bg-[#00A896] flex items-center justify-center font-black text-white text-xs mx-auto shadow-md">
              BS
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <BeforeSpendLogo size="md" variant="white" />
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
                      navigateToTab(section.id);
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
                          onClick={() => navigateToTab(sub.id)}
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

      {/* Mobile Drawer with Accordion Expandable Sub-Menus */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-xs bg-[#0A1220] text-white h-full flex flex-col z-50 p-4 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <BeforeSpendLogo size="md" variant="white" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
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
                          navigateToTab(section.id);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold ${
                        isSectionActive ? 'bg-[#00A896] text-white' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon className="w-4 h-4 text-slate-400" />
                        <span>{section.label}</span>
                      </div>
                      {hasSubItems && (
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {hasSubItems && isOpen && (
                      <div className="pl-8 space-y-1 pt-1">
                        {section.subItems!.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              navigateToTab(sub.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                              activeTab === sub.id ? 'bg-[#00A896] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RIGHT MAIN CONTENT FRAME */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#0B1528] overflow-x-hidden">

        {/* PERSISTENT RICH SAAS TOP HEADER */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B34] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-2xs">
          
          {/* Left Controls & Title Breadcrumb */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:flex p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="Toggle Sidebar">
              <Sliders className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Command Center</span>
              <span className="text-slate-400 dark:text-slate-600">/</span>
              <span className="text-xs font-black text-slate-900 dark:text-white capitalize">{activeTab.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Center Search Trigger */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-6">
            <div className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                Quick Search Command...
              </span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">Ctrl+K</kbd>
            </div>
          </div>

          {/* Right Action Icons & User Telemetry */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer" title="Notifications">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00A896] ring-2 ring-white dark:ring-[#0D1B34]" />
            </button>

            <button onClick={toggleDarkMode} className="p-2 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer" title="Toggle Mode">
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </div>

            <div className="flex items-center gap-2.5 cursor-pointer pl-2 border-l border-slate-200 dark:border-slate-800">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700" />
              <div className="hidden xl:block text-left">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{userProfile.name}</p>
                <p className="text-[10px] font-mono font-bold text-[#00A896]">Root Admin</p>
              </div>
            </div>
          </div>

        </header>

        {/* Main Content View Frame */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-none max-w-full">

          {/* Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                {activeTab === 'users' && 'User Account Directory'}
                {activeTab === 'roles' && 'Roles & Access Control'}
                {activeTab === 'categories' && 'Budget Buckets & Allocations'}
                {activeTab === 'support' && 'Support Inquiries & Helpdesk'}
                {activeTab === 'dashboard' && 'Platform Overview'}
              </h1>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-bold max-w-2xl">
                {activeTab === 'users' && 'Search accounts, inspect behavioral telemetry, manage roles, and review allocation balances.'}
                {activeTab === 'roles' && 'Configure granular permission matrices, define custom admin role policies, and manage user access.'}
                {activeTab === 'categories' && 'Manage allocation ratio rules, destination bank accounts, and target bucket balances.'}
                {activeTab === 'support' && 'Manage user support inquiries, resolve allocation issues, and respond to account tickets.'}
                {activeTab === 'dashboard' && 'Platform operational summary.'}
              </p>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* MODULE 1: USER DIRECTORY */}
          {/* ===================================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Registered Users</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{profiles.length || 52410}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Active Accounts</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">{profiles.length || 51890}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Default Currency</span>
                  <p className="text-3xl font-black font-mono text-[#0E2A47] dark:text-teal-400">NGN (₦)</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block tracking-wider">Quick Action</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">Create Profile</span>
                  </div>
                  <button onClick={() => setShowAddUserModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <UserPlus className="w-4 h-4" /> Add User
                  </button>
                </div>
              </div>

              {/* Filters Toolbar with CUSTOM POPOVER SELECTS */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search name, email, or user ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
                    />
                  </div>

                  <CustomSelect
                    value={filterRole}
                    onChange={val => setFilterRole(val)}
                    options={[
                      { value: 'ALL', label: 'All Roles' },
                      { value: 'Salaried Employee / Professional', label: 'Salaried Employee' },
                      { value: 'Freelancer & Contractor', label: 'Freelancer & Contractor' },
                      { value: 'Business Owner / Entrepreneur', label: 'Business Owner' },
                      { value: 'Student & Personal Budgeter', label: 'Student Budgeter' },
                    ]}
                  />

                  <CustomSelect
                    value={filterCurrency}
                    onChange={val => setFilterCurrency(val)}
                    options={[
                      { value: 'ALL', label: 'All Currencies' },
                      { value: 'NGN', label: 'NGN (₦)' },
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'GBP', label: 'GBP (£)' },
                      { value: 'EUR', label: 'EUR (€)' },
                    ]}
                  />
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px]">
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
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">{u.role}</td>
                          <td className="py-4 px-4 text-center font-mono font-extrabold text-slate-900 dark:text-white">{u.default_currency || 'NGN'}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setDeepDiveUser(u)}
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

              {/* Mobile Card Reflow */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredProfiles.map(u => (
                  <div key={u.id} className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">{u.email}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs">{u.default_currency || 'NGN'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{u.role}</span>
                      <button onClick={() => setDeepDiveUser(u)} className="px-3 py-1 rounded-lg bg-[#00A896] text-white font-bold text-[11px]">Deep Dive</button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* MODULE 2: ROLES & ACCESS CONTROL */}
          {/* ===================================================================== */}
          {activeTab === 'roles' && (
            <div className="space-y-6">

              {/* Header Action Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">System Access Roles</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Select a role to inspect or update module permission policies.</p>
                </div>
                <button onClick={() => setShowCreateRoleModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                  <Plus className="w-4 h-4" /> Create Custom Role
                </button>
              </div>

              {/* Role Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roles.map(r => {
                  const isSelected = selectedRole.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-white dark:bg-[#0D1B34] border-[#00A896] ring-2 ring-[#00A896]/20 shadow-md'
                          : 'bg-white dark:bg-[#0D1B34] border-slate-300 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-9 h-9 rounded-xl bg-[#00A896]/10 flex items-center justify-center text-[#00A896]">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {r.userCount} users
                        </span>
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{r.name}</h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1 line-clamp-2">{r.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Granular Permission Matrix Table */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">Permission Matrix: {selectedRole.name}</h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Toggle capabilities for this role policy.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#00A896] bg-[#00A896]/10 px-2.5 py-1 rounded-full border border-[#00A896]/20">
                    Policy Active
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">System Module</th>
                        <th className="py-3 px-4 text-center">Create</th>
                        <th className="py-3 px-4 text-center">Read / View</th>
                        <th className="py-3 px-4 text-center">Update / Edit</th>
                        <th className="py-3 px-4 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {[
                        { key: 'users', name: 'User Directory & Profiles' },
                        { key: 'buckets', name: 'Budget Buckets & Ratios' },
                        { key: 'ledger', name: 'Transactions Ledger & Audits' },
                        { key: 'broadcasts', name: 'System Broadcast Notifications' },
                        { key: 'audit', name: 'System Audit Logs' },
                        { key: 'settings', name: 'Platform Settings & API Keys' },
                      ].map(mod => {
                        const perm = selectedRole.permissions[mod.key] || { create: false, read: false, update: false, delete: false };
                        return (
                          <tr key={mod.key} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">{mod.name}</td>
                            {(['create', 'read', 'update', 'delete'] as const).map(type => (
                              <td key={type} className="py-3.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm[type]}
                                  onChange={() => togglePermission(selectedRole.id, mod.key, type)}
                                  className="w-4 h-4 rounded accent-[#00A896] cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* MODULE 3: BUCKETS & ALLOCATIONS */}
          {/* ===================================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">

              {/* Bucket Metrics Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Active Buckets</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{buckets.length || 314890}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Allocated Volume</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">₦1.84B</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Allocation Efficiency</span>
                  <p className="text-3xl font-black font-mono text-[#0E2A47] dark:text-teal-400">100.00%</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block tracking-wider">Quick Action</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">Create Bucket</span>
                  </div>
                  <button onClick={() => setShowAddBucketModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <Plus className="w-4 h-4" /> Add Bucket
                  </button>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider">
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

              {/* Mobile Card Reflow */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredBuckets.map(b => (
                  <div key={b.id} className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{b.name}</span>
                      <span className="font-mono font-black text-[#00A896]">{formatCurrency(b.balance || 0, 'NGN')}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-bold">{b.destination_account || 'Default Account'}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Ratio: {b.allocation_percentage}%</span>
                      <button onClick={() => setSelectedBucketDrawer(b)} className="px-3 py-1 rounded-lg bg-[#00A896] text-white font-bold text-[11px]">Inspect Bucket</button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* MODULE 4: SUPPORT INQUIRIES */}
          {/* ===================================================================== */}
          {activeTab === 'support' && (
            <div className="space-y-6">

              {/* Support Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Support Tickets</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{tickets.length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Open Tickets</span>
                  <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{tickets.filter(t => t.status === 'Open').length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Resolved Tickets</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">{tickets.filter(t => t.status === 'Resolved').length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block tracking-wider">Quick Action</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">Log Ticket</span>
                  </div>
                  <button onClick={() => setShowNewTicketModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <MessageSquarePlus className="w-4 h-4" /> New Ticket
                  </button>
                </div>
              </div>

              {/* Support Desktop Table View */}
              <div className="hidden md:block p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider">
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
                            <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">{t.id} • {t.createdAt}</p>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{t.userEmail}</td>
                          <td className="py-4 px-4 font-bold">{t.category}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              t.priority === 'High' || t.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
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

              {/* Support Mobile Card Reflow */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredTickets.map(t => (
                  <div key={t.id} className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{t.subject}</span>
                      <span className="font-mono font-bold text-[10px] text-[#00A896] bg-[#00A896]/10 px-2 py-0.5 rounded">{t.id}</span>
                    </div>
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{t.userEmail}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{t.category}</span>
                      <button onClick={() => setSelectedTicket(t)} className="px-3 py-1 rounded-lg bg-[#00A896] text-white font-bold text-[11px]">Respond</button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* MODULE 5: DASHBOARD */}
          {/* ===================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">ALLOCATION ACCURACY</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">100.00%</p>
                  <div className="text-xs font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> On target</div>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">SETTLEMENT TIME</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">0.4 h</p>
                  <div className="text-xs font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> On target</div>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">THROUGHPUT VOLUME</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">₦1.84B</p>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400">— On target</div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* DEEP-DIVE USER BEHAVIORAL INTELLIGENCE DRAWER */}
      {deepDiveUser && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDeepDiveUser(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0D1B34] h-full shadow-2xl z-50 p-6 overflow-y-auto space-y-6 flex flex-col">
            
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar name={deepDiveUser.name} className="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700" />
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">{deepDiveUser.name}</h3>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 font-bold">{deepDiveUser.email}</p>
                </div>
              </div>
              <button onClick={() => setDeepDiveUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-extrabold gap-4">
              <button
                onClick={() => setDrawerActiveTab('overview')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  drawerActiveTab === 'overview' ? 'border-[#00A896] text-[#00A896]' : 'border-transparent text-slate-600 dark:text-slate-400'
                }`}
              >
                Overview &amp; Managed Balance
              </button>
            </div>

            {drawerActiveTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">Total Allocated Balance</span>
                  <p className="text-2xl font-black font-mono text-[#00A896]">
                    {formatCurrency(currentDeepDiveTelemetry?.totalAllocated || 0, deepDiveUser.default_currency || 'NGN')}
                  </p>
                </div>
              </div>
            )}

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
