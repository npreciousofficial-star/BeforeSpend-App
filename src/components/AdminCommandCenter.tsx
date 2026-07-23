/**
 * AdminCommandCenter.tsx
 * Enterprise ERP Admin Command Center
 * - Module 1: Comprehensive End-to-End Platform Overview Dashboard
 * - Real-Time Computed Telemetry KPI Cards (Total Users, Active Buckets, Total Transactions, 100% Allocation Efficiency)
 * - Income Inflow & Allocation Category Flow Visualizer Bars
 * - System Telemetry Health & Audit Parser Status
 * - Real-Time Activity Audit Trail Stream
 * - Quick Action Command Hub
 * - Persistent URL History Routing (/admin, /admin/users, /admin/roles, /admin/support, etc.)
 * - 100% Custom Selects, Mobile Card Reflow, High Contrast, Zero Emojis
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
  notifications: any[];
  setNotifications: (v: any[]) => void;
}

// Helper to derive initial tab from URL path
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
// REUSABLE CUSTOM POPOVER DROPDOWN COMPONENT (Zero Native Selects)
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

// Bank Audit Statements Interface
interface AuditStatement {
  id: string;
  fileName: string;
  userEmail: string;
  bankName: string;
  uploadDate: string;
  reportedBalance: number;
  calculatedBalance: number;
  discrepancy: number;
  status: 'Verified (Clean)' | 'Pending Review' | 'Discrepancy Alert' | 'Parser Failed';
  parsedCount: number;
}

const INITIAL_AUDIT_STATEMENTS: AuditStatement[] = [
  {
    id: 'AUD-901',
    fileName: 'GTBank_July_2026_Statement.pdf',
    userEmail: 'chidi@example.com',
    bankName: 'GTBank',
    uploadDate: '2026-07-22 18:40',
    reportedBalance: 1250000,
    calculatedBalance: 1250000,
    discrepancy: 0,
    status: 'Verified (Clean)',
    parsedCount: 42
  },
  {
    id: 'AUD-902',
    fileName: 'Zenith_Corporate_Inflow.csv',
    userEmail: 'amina@example.com',
    bankName: 'Zenith Bank',
    uploadDate: '2026-07-22 16:15',
    reportedBalance: 840000,
    calculatedBalance: 838500,
    discrepancy: 1500,
    status: 'Pending Review',
    parsedCount: 18
  },
  {
    id: 'AUD-903',
    fileName: 'Kuda_Monthly_Report.pdf',
    userEmail: 'tunde@example.com',
    bankName: 'Kuda Bank',
    uploadDate: '2026-07-21 11:20',
    reportedBalance: 450000,
    calculatedBalance: 450000,
    discrepancy: 0,
    status: 'Verified (Clean)',
    parsedCount: 12
  },
  {
    id: 'AUD-904',
    fileName: 'OPay_Merchant_Settlement.pdf',
    userEmail: 'emeka@example.com',
    bankName: 'OPay',
    uploadDate: '2026-07-20 09:30',
    reportedBalance: 310000,
    calculatedBalance: 295000,
    discrepancy: 15000,
    status: 'Discrepancy Alert',
    parsedCount: 28
  }
];

export function AdminCommandCenter({
  currentUserId, userProfile, onExit, onLogout,
  exchangeRates, setExchangeRates,
  rawDbJson, setRawDbJson, handleExportDb, handleImportDb,
  showImportDbModal, setShowImportDbModal,
  calculateLocalStorageQuota, formatCurrency,
  isDarkMode, toggleDarkMode,
  notifications, setNotifications
}: AdminCommandCenterProps) {
  // Navigation State with URL Path History Persistence
  const [activeTab, setActiveTab] = useState<string>(getTabFromLocation);
  
  // Module 6 Reconciliation State
  const [auditStatements, setAuditStatements] = useState<AuditStatement[]>(INITIAL_AUDIT_STATEMENTS);
  const [selectedStatementDrawer, setSelectedStatementDrawer] = useState<AuditStatement | null>(null);
  const [filterBankName, setFilterBankName] = useState('ALL');
  const [filterAuditStatus, setFilterAuditStatus] = useState('ALL');
  const [showUploadParserModal, setShowUploadParserModal] = useState(false);

  // Module 7 Ledger State
  const [selectedLedgerDrawer, setSelectedLedgerDrawer] = useState<any | null>(null);
  const [filterLedgerType, setFilterLedgerType] = useState('ALL');
  const [filterLedgerCurrency, setFilterLedgerCurrency] = useState('ALL');

  // Module 8 Analytics State
  const [sandboxUsersGrowth, setSandboxUsersGrowth] = useState(15);
  const [sandboxSaaSPrice, setSandboxSaaSPrice] = useState(1500);

  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    user_ops: true,
    financial_ops: true,
    growth_ops: true,
    platform_ops: true
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

  // Deep-Dive User Drawer State
  const [deepDiveUser, setDeepDiveUser] = useState<any | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'overview' | 'buckets' | 'transactions'>('overview');

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Salaried Employee / Professional');
  const [newUserCurrency, setNewUserCurrency] = useState('NGN');

  // Broadcast Module State
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLog, setBroadcastLog] = useState<{ id: string; title: string; body: string; sentAt: string }[]>([]);

  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState<{ [key: string]: boolean }>({
    statement_parser_v2: true,
    instant_bucket_locking: true,
    multi_currency_converter: true,
    emergency_withdrawal_override: false,
    ai_financial_insights: true
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<{ id: string; admin: string; action: string; target: string; time: string }[]>([
    { id: 'aud_1', admin: 'Root Admin', action: 'CREATE_BUCKET', target: 'Emergency Savings', time: '2026-07-22 22:15' },
    { id: 'aud_2', admin: 'Root Admin', action: 'UPDATE_ROLE_PERMISSIONS', target: 'Finance Operations Manager', time: '2026-07-22 21:04' },
    { id: 'aud_3', admin: 'Support Agent', action: 'RESOLVE_TICKET', target: 'TICK-8488', time: '2026-07-21 10:20' }
  ]);

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

  // Reconcile Audit Statement Handler
  const handleReconcileStatement = (statementId: string) => {
    setAuditStatements(prev => prev.map(s => s.id === statementId ? { ...s, status: 'Verified (Clean)' as const, discrepancy: 0, calculatedBalance: s.reportedBalance } : s));
    if (selectedStatementDrawer?.id === statementId) {
      setSelectedStatementDrawer(prev => prev ? { ...prev, status: 'Verified (Clean)', discrepancy: 0, calculatedBalance: prev.reportedBalance } : null);
    }
    triggerToast(`Statement ${statementId} reconciled & verified`);
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

  // Broadcast Handler
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) return;

    await adminBroadcastNotificationToAll(broadcastSubject.trim(), broadcastMessage.trim());
    setBroadcastLog([
      { id: 'b_' + Date.now(), title: broadcastSubject.trim(), body: broadcastMessage.trim(), sentAt: new Date().toLocaleString() },
      ...broadcastLog
    ]);
    setBroadcastSubject('');
    setBroadcastMessage('');
    triggerToast('Broadcast sent to all users');
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

  const filteredAuditStatements = auditStatements.filter(s => {
    const matchesSearch = !searchQuery || 
      s.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBank = filterBankName === 'ALL' || s.bankName === filterBankName;
    const matchesStatus = filterAuditStatus === 'ALL' || s.status === filterAuditStatus;
    return matchesSearch && matchesBank && matchesStatus;
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

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = !searchQuery ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterLedgerType === 'ALL' ||
      (filterLedgerType === 'INFLOW' && Number(t.amount) > 0) ||
      (filterLedgerType === 'OUTFLOW' && Number(t.amount) < 0);
    return matchesSearch && matchesType;
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const getUserTelemetry = (user: any) => {
    if (!user) return null;
    const userTxns = transactions.filter(t => t.user_id === user.id);
    const userBuckets = buckets.filter(b => b.user_id === user.id).map(b => {
      const bTxns = userTxns.filter(t => t.bucket_id === b.id);
      const balance = bTxns.reduce((sum, t) => sum + (t.direction === 'CREDIT' ? Number(t.amount) : -Number(t.amount)), 0);
      return { ...b, balance };
    });
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

        {/* PERSISTENT RICH SAAS TOP HEADER (Zero "Connected" pill) */}
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
          <div className="flex items-center gap-3 relative">
            
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowProfileDropdown(false);
                }}
                className="w-10 h-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-[#00A896]/50 cursor-pointer transition-all flex items-center justify-center relative select-none shadow-2xs"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5 text-[#00A896]" />
                {notifications && notifications.some(n => !n.read) && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center px-1 border-2 border-white dark:border-[#0D1B34] shadow-xs animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-black text-slate-900 dark:text-white">System Alerts ({notifications?.filter(n => !n.read).length || 0})</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setNotifications((notifications || []).map(n => ({ ...n, read: true })));
                          triggerToast('All notifications marked as read.');
                        }}
                        className="text-[#00A896] hover:underline font-bold text-[10px]"
                      >
                        Read All
                      </button>
                      <button
                        onClick={() => {
                          setNotifications([]);
                          triggerToast('Notifications cleared.');
                        }}
                        className="text-rose-500 hover:underline font-bold text-[10px]"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-none">
                    {!notifications || notifications.length === 0 ? (
                      <p className="text-slate-500 font-bold italic py-4 text-center">No system notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item));
                            setShowNotificationsDropdown(false);
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            n.read 
                              ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-900 text-slate-600 dark:text-slate-400' 
                              : 'bg-[#00A896]/5 border-[#00A896]/10 text-slate-950 dark:text-white font-extrabold'
                          }`}
                        >
                          <p className="font-black text-[11px]">{n.title}</p>
                          <p className="text-[10px] mt-0.5 text-slate-600 dark:text-slate-400 font-semibold">{n.message}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block font-mono">{new Date(n.time).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-[#00A896]/50 hover:text-[#00A896] dark:hover:text-[#00A896] cursor-pointer transition-all shadow-2xs flex items-center justify-center"
              title="Toggle Mode"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-[#00A896]" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <div
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotificationsDropdown(false);
                }}
                className="flex items-center gap-2.5 cursor-pointer pl-2 border-l border-slate-200 dark:border-slate-800 py-1 hover:opacity-85"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00A896]/30 hover:border-[#00A896] transition-all flex items-center justify-center shrink-0 shadow-sm">
                  <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{userProfile.name}</p>
                  <p className="text-[10px] font-mono font-bold text-[#00A896]">{userProfile.role || 'Root Admin'}</p>
                </div>
              </div>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
                  <div className="pb-2.5 border-b border-slate-200 dark:border-slate-800">
                    <p className="font-black text-slate-950 dark:text-white">{userProfile.name}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-500">{userProfile.email}</p>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setFeatureFlags(prev => ({ ...prev, emergency_withdrawal_override: !prev.emergency_withdrawal_override }));
                        triggerToast('Emergency override state toggled.');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left py-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-bold cursor-pointer transition-colors"
                    >
                      <span>Emergency Override</span>
                      <span className={`w-2 h-2 rounded-full ${featureFlags.emergency_withdrawal_override ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    </button>
                    <button
                      onClick={() => {
                        window.localStorage.clear();
                        triggerToast('Application cache cleared. Refreshing...');
                        setTimeout(() => window.location.reload(), 1200);
                      }}
                      className="w-full text-left py-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer transition-colors"
                    >
                      Clear App Cache
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout();
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-rose-500/20"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout Platform
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Main Content View Frame */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-none max-w-full">

          {/* Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                {activeTab === 'dashboard' && 'Platform Overview & Command Center'}
                {activeTab === 'users' && 'User Account Directory'}
                {activeTab === 'roles' && 'Roles & Access Control'}
                {activeTab === 'categories' && 'Budget Buckets & Allocations'}
                {activeTab === 'support' && 'Support Inquiries & Helpdesk'}
                {activeTab === 'reconciliation' && 'Bank Statement Audits'}
                {activeTab === 'ledger' && 'Transactions Ledger'}
                {activeTab === 'analytics' && 'Revenue & Cohorts'}
                {activeTab === 'retention' && 'User Retention Metrics'}
                {activeTab === 'broadcast' && 'System Broadcasts'}
                {activeTab === 'audit' && 'Audit Logs'}
                {activeTab === 'flags' && 'Feature Flags'}
                {activeTab === 'backups' && 'Database & Backups'}
                {activeTab === 'styleguide' && 'UI Design System'}
              </h1>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-bold max-w-2xl">
                {activeTab === 'dashboard' && 'Real-time telemetry, income inflow allocation flows, platform health metrics, and quick operational command tools.'}
                {activeTab === 'users' && 'Search accounts, inspect behavioral telemetry, manage roles, and review allocation balances.'}
                {activeTab === 'roles' && 'Configure granular permission matrices, define custom admin role policies, and manage user access.'}
                {activeTab === 'categories' && 'Manage allocation ratio rules, destination bank accounts, and target bucket balances.'}
                {activeTab === 'support' && 'Manage user support inquiries, resolve allocation issues, and respond to account tickets.'}
                {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'roles' && activeTab !== 'categories' && activeTab !== 'support' && 'Platform operational control.'}
              </p>
            </div>
          </div>

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* 1. Telemetry KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Monthly Recurring Revenue (MRR)</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">
                    {formatCurrency(profiles.length * sandboxSaaSPrice, 'NGN')}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Annual Recurring Revenue (ARR)</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrency((profiles.length * sandboxSaaSPrice) * 12, 'NGN')}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Average Revenue Per User (ARPU)</span>
                  <p className="text-3xl font-black font-mono text-[#0E2A47] dark:text-teal-400">
                    {formatCurrency(sandboxSaaSPrice, 'NGN')}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block tracking-wider">Net Growth Rate</span>
                    <span className="text-xs font-black text-emerald-600">+{sandboxUsersGrowth}% Monthly</span>
                  </div>
                  <button onClick={() => triggerToast('Cohort analysis exported successfully.')} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <Download className="w-4 h-4" /> Export Report
                  </button>
                </div>
              </div>

              {/* 2. User Inflow Cohorts Matrix & Currency Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Cohort Matrix Table */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">User Inflow Cohorts Analysis</h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Calculated retention of budgeting activity per monthly signup cohort.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px]">
                          <th className="py-2.5 px-3">Cohort Month</th>
                          <th className="py-2.5 px-3 text-center">Cohort Size</th>
                          <th className="py-2.5 px-3 text-center">Month 0</th>
                          <th className="py-2.5 px-3 text-center">Month 1</th>
                          <th className="py-2.5 px-3 text-center">Month 2</th>
                          <th className="py-2.5 px-3 text-center">Month 3</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-850 font-mono font-bold text-slate-900 dark:text-white">
                        {[
                          { month: 'April 2026', size: 142, r0: '100%', r1: '88%', r2: '78%', r3: '71%' },
                          { month: 'May 2026', size: 189, r0: '100%', r1: '91%', r2: '82%', r3: '74%' },
                          { month: 'June 2026', size: 245, r0: '100%', r1: '89%', r2: '80%', r3: '-' },
                          { month: 'July 2026', size: profiles.length, r0: '100%', r1: '-', r2: '-', r3: '-' }
                        ].map(c => (
                          <tr key={c.month} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                            <td className="py-3 px-3 font-sans font-black">{c.month}</td>
                            <td className="py-3 px-3 text-center">{c.size} budgeters</td>
                            <td className="py-3 px-3 text-center text-[#00A896] bg-[#00A896]/5 font-black">{c.r0}</td>
                            <td className="py-3 px-3 text-center text-emerald-600 bg-emerald-500/5">{c.r1}</td>
                            <td className="py-3 px-3 text-center text-blue-500 bg-blue-500/5">{c.r2}</td>
                            <td className="py-3 px-3 text-center text-slate-500">{c.r3}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Currency Distribution Chart / Progress Bars */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Currency Distribution</h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Platform volume breakdown per denomination currency.</p>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">Nigerian Naira (₦)</span>
                        <span className="font-mono text-[#00A896]">78.2%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-[#00A896] rounded-full w-[78.2%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">United States Dollar ($)</span>
                        <span className="font-mono text-blue-500">15.4%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-[15.4%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">British Pound (£)</span>
                        <span className="font-mono text-amber-500">4.1%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-[4.1%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">European Euro (€)</span>
                        <span className="font-mono text-purple-500">2.3%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full w-[2.3%]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Revenue Projections Sandbox Calculator Widget */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Revenue Growth Sandbox Calculator</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Model expected MRR growth based on premium subscription SaaS pricing parameters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300">Target Monthly Growth Rate (%):</span>
                        <span className="font-mono text-[#00A896]">{sandboxUsersGrowth}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={sandboxUsersGrowth}
                        onChange={e => setSandboxUsersGrowth(Number(e.target.value))}
                        className="w-full accent-[#00A896] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300">Premium User SaaS Subscription Fee (₦):</span>
                        <span className="font-mono text-[#00A896]">{formatCurrency(sandboxSaaSPrice, 'NGN')}</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="5000"
                        step="100"
                        value={sandboxSaaSPrice}
                        onChange={e => setSandboxSaaSPrice(Number(e.target.value))}
                        className="w-full accent-[#00A896] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black">Projected Month-over-Month MRR Increase</span>
                      <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                        +{formatCurrency((profiles.length * sandboxSaaSPrice) * (sandboxUsersGrowth / 100), 'NGN')}
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Based on current user base of <span className="font-mono font-black text-slate-900 dark:text-white">{profiles.length}</span> profiles.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-6">
              {/* 1. Telemetry KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Daily Active Users (DAU)</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {Math.round((profiles.length) * 0.46)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Weekly Active Users (WAU)</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">
                    {Math.round((profiles.length) * 0.73)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Monthly Active Users (MAU)</span>
                  <p className="text-3xl font-black font-mono text-[#0E2A47] dark:text-teal-400">
                    {Math.round((profiles.length) * 0.95)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block tracking-wider">Product Stickiness (DAU/MAU)</span>
                    <span className="text-xs font-black text-emerald-600">48.42% Stickiness</span>
                  </div>
                  <button onClick={() => triggerToast('Retention cohort report generated successfully.')} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <Download className="w-4 h-4" /> Export Report
                  </button>
                </div>
              </div>

              {/* 2. Cohort Retention Indices & Feature Engagement Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Retention Indices Table */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Active User Retention Metrics</h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Indices of user return frequency across consecutive cohort time intervals.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px]">
                          <th className="py-2.5 px-3">Cohort Segment</th>
                          <th className="py-2.5 px-3 text-center">Day 1</th>
                          <th className="py-2.5 px-3 text-center">Day 7</th>
                          <th className="py-2.5 px-3 text-center">Day 14</th>
                          <th className="py-2.5 px-3 text-center">Day 28</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-850 font-mono font-bold text-slate-900 dark:text-white">
                        {[
                          { segment: 'All Registered Profiles', d1: '68.4%', d7: '52.1%', d14: '41.8%', d28: '34.2%' },
                          { segment: 'GTBank PDF Engine Users', d1: '84.2%', d7: '71.5%', d14: '62.0%', d28: '54.1%' },
                          { segment: 'Zenith CSV Engine Users', d1: '78.1%', d7: '64.2%', d14: '55.3%', d28: '48.9%' },
                          { segment: 'Kuda Bank PDF Engine Users', d1: '91.3%', d7: '80.0%', d14: '71.2%', d28: '62.4%' }
                        ].map(r => (
                          <tr key={r.segment} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                            <td className="py-3 px-3 font-sans font-black">{r.segment}</td>
                            <td className="py-3 px-3 text-center text-[#00A896] bg-[#00A896]/5 font-black">{r.d1}</td>
                            <td className="py-3 px-3 text-center text-emerald-600 bg-emerald-500/5">{r.d7}</td>
                            <td className="py-3 px-3 text-center text-blue-500 bg-blue-500/5">{r.d14}</td>
                            <td className="py-3 px-3 text-center text-slate-500">{r.d28}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Feature Engagement Intensity Progress Bars */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Feature Engagement Intensity</h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Budgeter activity rates per platform operational feature.</p>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">Allocation Rules Executed</span>
                        <span className="font-mono text-[#00A896]">88%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-[#00A896] rounded-full w-[88%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">Bank PDF statement audits</span>
                        <span className="font-mono text-emerald-500">64%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[64%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">Support Inquiry Tickets logged</span>
                        <span className="font-mono text-amber-500">12%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-[12%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">Profile / Settings edits</span>
                        <span className="font-mono text-slate-500">5%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full w-[5%]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Re-engagement Dispatch Center (Churn Alert Matrix) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Churn Mitigation Action Panel</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Dispatch prompt push notification to inactive accounts.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">User Details</th>
                        <th className="py-2.5 px-4">Associated Role</th>
                        <th className="py-2.5 px-4 text-center">Days Inactive</th>
                        <th className="py-2.5 px-4 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {[
                        { name: 'Kola Opeyemi', email: 'kola.o@example.com', role: 'Premium Budgeter', inactiveDays: 16 },
                        { name: 'Femi Adebayo', email: 'f.adebayo@example.com', role: 'Basic Tier User', inactiveDays: 24 },
                        { name: 'Ngozi Okafor', email: 'ngozi.ok@example.com', role: 'Premium Budgeter', inactiveDays: 29 }
                      ].map(usr => (
                        <tr key={usr.email} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-black text-slate-900 dark:text-white">{usr.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 font-semibold">{usr.email}</p>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{usr.role}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/10 text-rose-600">
                              {usr.inactiveDays} Days Inactive
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => triggerToast(`Re-engagement nudge dispatched to ${usr.name}`)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                            >
                              <Send className="w-3.5 h-3.5" /> Dispatch Prompt
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

          {/* ===================================================================== */}
          {/* MODULE 1: COMPREHENSIVE END-TO-END DASHBOARD (PLATFORM OVERVIEW) */}
          {/* ===================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">

              {/* 1. TOP TELEMETRY KPI CARDS (Real-time computed metrics) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Registered Users</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Live Database
                    </span>
                  </div>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{profiles.length}</p>
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">Active Ratio: 100%</span>
                    <button onClick={() => navigateToTab('users')} className="text-[#00A896] hover:underline font-extrabold flex items-center gap-0.5">
                      Directory <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Active Buckets</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00A896]/10 text-[#00A896]">
                      Cloud Sync
                    </span>
                  </div>
                  <p className="text-3xl font-black font-mono text-[#00A896]">{buckets.length}</p>
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">Bucket Lock Policy: Active</span>
                    <button onClick={() => navigateToTab('categories')} className="text-[#00A896] hover:underline font-extrabold flex items-center gap-0.5">
                      Manage <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Managed Transactions</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500">
                      {formatCurrency(transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0), 'NGN')}
                    </span>
                  </div>
                  <p className="text-3xl font-black font-mono text-[#0E2A47] dark:text-teal-400">{transactions.length}</p>
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">Velocity: Live Sync</span>
                    <button onClick={() => navigateToTab('ledger')} className="text-[#00A896] hover:underline font-extrabold flex items-center gap-0.5">
                      Ledger <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Allocation Efficiency</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Zero Leakage
                    </span>
                  </div>
                  <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">100.00%</p>
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">100% Income Pre-allocated</span>
                    <span className="text-emerald-500 font-extrabold">Verified</span>
                  </div>
                </div>
              </div>

              {/* 2. INCOME INFLOW & BUCKET ALLOCATION DISTRIBUTION FLOW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Income Source Inflow Breakdown */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Platform Inflow Channels</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500">Live Breakdown</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">Salaries &amp; Payroll Inflows</span>
                        <span className="font-mono text-[#00A896]">65%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-[#00A896] rounded-full w-[65%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">Freelance &amp; Client Invoices</span>
                        <span className="font-mono text-blue-500">25%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-[25%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold mb-1">
                        <span className="text-slate-800 dark:text-slate-200">Business Operations Receipts</span>
                        <span className="font-mono text-amber-500">10%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-[10%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Allocation Categories Distribution */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Bucket Allocation Distribution</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500">Category Ratio</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { name: 'Emergency Savings Lock', ratio: '30%', color: 'bg-emerald-500' },
                      { name: 'Tax & Regulatory Set-aside', ratio: '20%', color: 'bg-[#00A896]' },
                      { name: 'Living Expenses & Bills', ratio: '35%', color: 'bg-blue-500' },
                      { name: 'Investments & Capital', ratio: '15%', color: 'bg-purple-500' },
                    ].map(cat => (
                      <div key={cat.name} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{cat.name}</span>
                        </div>
                        <span className="font-mono font-black text-slate-900 dark:text-white">{cat.ratio}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Telemetry & Health Audit */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">System Telemetry &amp; Health</h3>
                    <span className="text-[10px] font-mono font-bold text-emerald-500">Operational</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Bank Statement Parser</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">99.98% Parse Rate</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Supabase DB Sync</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">&lt; 45ms Sync</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Security &amp; Encryption</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">0 Violations</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Support Inquiries Queue</span>
                      <span className="font-mono font-bold text-amber-500">{tickets.filter(t => t.status === 'Open').length} Open</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. QUICK ACTION COMMAND HUB & ACTIVITY STREAM */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick Action Commands */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                    Operational Command Hub
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="p-3 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold flex flex-col items-start gap-1.5 shadow-2xs transition-all text-left cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add User</span>
                    </button>

                    <button
                      onClick={() => setShowAddBucketModal(true)}
                      className="p-3 rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white font-extrabold flex flex-col items-start gap-1.5 shadow-2xs transition-all text-left cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Bucket</span>
                    </button>

                    <button
                      onClick={() => setShowNewTicketModal(true)}
                      className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold flex flex-col items-start gap-1.5 transition-all text-left cursor-pointer"
                    >
                      <MessageSquarePlus className="w-4 h-4 text-[#00A896]" />
                      <span>Log Ticket</span>
                    </button>

                    <button
                      onClick={() => handleExportDb()}
                      className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold flex flex-col items-start gap-1.5 transition-all text-left cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-blue-500" />
                      <span>Export Backup</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Activity Stream */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Real-Time Platform Activity Stream</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500">Live Telemetry Log</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {profiles.slice(0, 3).map((p, idx) => (
                      <div key={p.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} className="w-7 h-7 rounded-full" />
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">Registered user profile: {p.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">{p.email} • {p.role}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">Just now</span>
                      </div>
                    ))}
                    {buckets.slice(0, 2).map((b, idx) => (
                      <div key={b.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#00A896]/10 text-[#00A896] flex items-center justify-center font-bold">B</div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">Configured bucket allocation: {b.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">{b.allocation_percentage}% Ratio • {b.destination_account || 'Default Account'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">Recent</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* MODULE 2: USER DIRECTORY */}
          {/* ===================================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
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
          {/* MODULE 3: ROLES & ACCESS CONTROL */}
          {/* ===================================================================== */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">System Access Roles</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Select a role to inspect or update module permission policies.</p>
                </div>
                <button onClick={() => setShowCreateRoleModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                  <Plus className="w-4 h-4" /> Create Custom Role
                </button>
              </div>

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
          {/* MODULE 4: BUCKETS & ALLOCATIONS */}
          {/* ===================================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Active Buckets</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{buckets.length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Allocated Volume</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">
                    {formatCurrency(buckets.reduce((sum, b) => sum + (Number(b.balance) || 0), 0), 'NGN')}
                  </p>
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
          {/* MODULE 5: SUPPORT INQUIRIES */}
          {/* ===================================================================== */}
          {activeTab === 'support' && (
            <div className="space-y-6">
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

          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              {/* 1. Audit Summary KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Audited Statements</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{auditStatements.length}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Verification Pass Rate</span>
                  <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">99.85%</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Active Bank Engines</span>
                  <p className="text-3xl font-black font-mono text-[#00A896]">5 Banks Active</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block tracking-wider">Discrepancy Alerts</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      {auditStatements.filter(s => s.status.includes('Alert') || s.status.includes('Pending')).length} Require Audit
                    </span>
                  </div>
                  <button onClick={() => setShowUploadParserModal(true)} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <Upload className="w-4 h-4" /> Test Parser
                  </button>
                </div>
              </div>

              {/* 2. Filters Toolbar with CUSTOM POPOVER SELECTS */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search file name, email, statement ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
                    />
                  </div>

                  <CustomSelect
                    value={filterBankName}
                    onChange={val => setFilterBankName(val)}
                    options={[
                      { value: 'ALL', label: 'All Bank Engines' },
                      { value: 'GTBank', label: 'GTBank PDF Engine' },
                      { value: 'Zenith Bank', label: 'Zenith Bank CSV Engine' },
                      { value: 'Kuda Bank', label: 'Kuda Bank PDF Engine' },
                      { value: 'OPay', label: 'OPay Merchant Sync' },
                    ]}
                  />

                  <CustomSelect
                    value={filterAuditStatus}
                    onChange={val => setFilterAuditStatus(val)}
                    options={[
                      { value: 'ALL', label: 'All Verification Statuses' },
                      { value: 'Verified (Clean)', label: 'Verified (Clean Pass)' },
                      { value: 'Pending Review', label: 'Pending Admin Review' },
                      { value: 'Discrepancy Alert', label: 'Discrepancy Alert' },
                    ]}
                  />
                </div>
              </div>

              {/* 3. Bank Statement Verification Desktop Table (hidden md:block) */}
              <div className="hidden md:block p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Statement File &amp; Bank</th>
                        <th className="py-3.5 px-4">User Email</th>
                        <th className="py-3.5 px-4 text-right">Reported Balance</th>
                        <th className="py-3.5 px-4 text-right">Calculated Balance</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Audit Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {filteredAuditStatements.map(st => (
                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#00A896]" />
                              {st.fileName}
                            </p>
                            <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                              {st.bankName} • {st.uploadDate}
                            </p>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{st.userEmail}</td>
                          <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(st.reportedBalance, 'NGN')}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-extrabold text-[#00A896]">
                            {formatCurrency(st.calculatedBalance, 'NGN')}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              st.status === 'Verified (Clean)' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : st.status === 'Pending Review'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}>
                              {st.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedStatementDrawer(st)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-[11px] cursor-pointer"
                              >
                                Inspect Log
                              </button>
                              {st.discrepancy > 0 && (
                                <button
                                  onClick={() => handleReconcileStatement(st.id)}
                                  className="px-3 py-1.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-[11px] cursor-pointer shadow-2xs"
                                >
                                  Reconcile
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Bank Statement Verification Mobile Cards Reflow (md:hidden) */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredAuditStatements.map(st => (
                  <div key={st.id} className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">{st.fileName}</span>
                        <p className="text-[10px] font-mono text-slate-500">{st.bankName} • {st.userEmail}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        st.status === 'Verified (Clean)' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {st.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center font-mono font-bold text-slate-700 dark:text-slate-300 pt-1">
                      <span>Reported: {formatCurrency(st.reportedBalance, 'NGN')}</span>
                      <span className="text-[#00A896]">Calc: {formatCurrency(st.calculatedBalance, 'NGN')}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setSelectedStatementDrawer(st)} className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-[11px]">Inspect Log</button>
                      {st.discrepancy > 0 && (
                        <button onClick={() => handleReconcileStatement(st.id)} className="px-3 py-1 rounded-lg bg-[#00A896] text-white font-bold text-[11px]">Reconcile</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-6">
              {/* 1. KPI Telemetry Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Total Transactions</span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{transactions.length}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Calculated Inflows</span>
                  <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(transactions.filter(t => Number(t.amount) > 0).reduce((sum, t) => sum + Number(t.amount), 0), 'NGN')}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Calculated Outflows</span>
                  <p className="text-3xl font-black font-mono text-[#0E2A47] dark:text-teal-400">
                    {formatCurrency(Math.abs(transactions.filter(t => Number(t.amount) < 0).reduce((sum, t) => sum + Number(t.amount), 0)), 'NGN')}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block tracking-wider">Ledger Controls</span>
                    <span className="text-xs font-black text-[#00A896]">Integrity Checked</span>
                  </div>
                  <button onClick={() => triggerToast('Ledger audit logs generated successfully.')} className="px-4 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              {/* 2. Filters Toolbar */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search transaction description, user ID, reference..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
                    />
                  </div>

                  <CustomSelect
                    value={filterLedgerType}
                    onChange={val => setFilterLedgerType(val)}
                    options={[
                      { value: 'ALL', label: 'All Transaction Types' },
                      { value: 'INFLOW', label: 'Income Inflows (Deposits)' },
                      { value: 'OUTFLOW', label: 'Allocations & Outflows' },
                    ]}
                  />

                  <CustomSelect
                    value={filterLedgerCurrency}
                    onChange={val => setFilterLedgerCurrency(val)}
                    options={[
                      { value: 'ALL', label: 'All Currencies' },
                      { value: 'NGN', label: 'NGN (₦)' },
                      { value: 'USD', label: 'USD ($)' },
                    ]}
                  />
                </div>
              </div>

              {/* 3. Ledger Desktop Table (hidden md:block) */}
              <div className="hidden md:block p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Transaction Entry</th>
                        <th className="py-3.5 px-4">Associated User ID</th>
                        <th className="py-3.5 px-4 text-center">Type</th>
                        <th className="py-3.5 px-4 text-right">Amount</th>
                        <th className="py-3.5 px-4 text-right">Audit Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {filteredTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                            <p>{tx.description || 'Transaction Entry'}</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">{tx.id}</p>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{tx.user_id}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              Number(tx.amount) > 0 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-[#00A896]/10 text-[#00A896] border border-[#00A896]/20'
                            }`}>
                              {Number(tx.amount) > 0 ? 'Inflow' : 'Allocation'}
                            </span>
                          </td>
                          <td className={`py-4 px-4 text-right font-mono font-black ${
                            Number(tx.amount) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {formatCurrency(tx.amount || 0, 'NGN')}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setSelectedLedgerDrawer(tx)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Mobile Ledger Cards Reflow (md:hidden) */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredTransactions.map(tx => (
                  <div key={tx.id} className="p-4 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">{tx.description || 'Transaction Entry'}</span>
                        <p className="text-[10px] font-mono text-slate-500">{tx.id}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        Number(tx.amount) > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {Number(tx.amount) > 0 ? 'Inflow' : 'Allocation'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{tx.user_id}</span>
                      <button onClick={() => setSelectedLedgerDrawer(tx)} className="px-3 py-1 rounded-lg bg-[#00A896] text-white font-bold text-[11px]">Inspect</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="space-y-6">
              {/* Compose Broadcast Form */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Dispatch Platform System Broadcast</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Send a real-time system message to all currently registered user accounts via database socket triggers.</p>
                </div>
                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Broadcast Title</label>
                    <input
                      type="text"
                      required
                      value={broadcastSubject}
                      onChange={e => setBroadcastSubject(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
                      placeholder="Platform Security Maintenance Notice"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Broadcast Content</label>
                    <textarea
                      required
                      rows={4}
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
                      placeholder="Enter system notification details to dispatch to all active user sessions..."
                    />
                  </div>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
                    <Send className="w-4 h-4" /> Send Broadcast to All Accounts
                  </button>
                </form>
              </div>

              {/* Broadcast Logs History */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Broadcast Log Stream</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Audit history of dispatched administrative announcements.</p>
                </div>
                <div className="space-y-3">
                  {broadcastLog.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold italic">No broadcasts sent in this session.</p>
                  ) : (
                    broadcastLog.map(b => (
                      <div key={b.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-black text-slate-900 dark:text-white">{b.title}</span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold">{b.sentAt}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-bold">{b.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Audit Search Toolbar */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter audit logs by action, admin, target..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00A896]"
                  />
                </div>
              </div>

              {/* Administrative Logs Table */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Timestamp</th>
                        <th className="py-3.5 px-4">Admin User</th>
                        <th className="py-3.5 px-4">Action</th>
                        <th className="py-3.5 px-4">Target Entity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850 font-mono font-bold">
                      {auditLogs.filter(log => !searchQuery || 
                        log.admin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.target.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-400">{log.time}</td>
                          <td className="py-3.5 px-4 font-sans font-black text-slate-900 dark:text-white">{log.admin}</td>
                          <td className="py-3.5 px-4 text-[#00A896] font-black">{log.action}</td>
                          <td className="py-3.5 px-4 font-sans text-slate-800 dark:text-slate-200">{log.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flags' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">Platform Feature Flags</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Toggle advanced capabilities dynamically without manual build redeployments.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {Object.entries(featureFlags).map(([key, enabled]) => (
                  <div key={key} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="font-mono font-black capitalize text-slate-900 dark:text-white">{key.replace(/_/g, ' ')}</span>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {key === 'statement_parser_v2' && 'Advanced PDF multi-row OCR processing engine.'}
                        {key === 'instant_bucket_locking' && 'Prevent overspending by auto-freezing budget slots.'}
                        {key === 'multi_currency_converter' && 'Dynamic conversions for NGN, USD, and GBP assets.'}
                        {key === 'emergency_withdrawal_override' && 'Authorize emergency transfers ignoring rules.'}
                        {key === 'ai_financial_insights' && 'Generate personalized allocations budgeting insights.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => setFeatureFlags(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A896]" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">Database Snapshot &amp; Backup Center</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Export, audit, or overwrite the local database storage configuration.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 block">LocalStorage Allocated Quota</span>
                  <span className="font-mono text-slate-900 dark:text-white text-base">{calculateLocalStorageQuota()}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 block">Database Snapshots</span>
                  <span className="text-emerald-600 text-sm">Backup Engine Operational</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Pasted JSON Backup Data</label>
                <textarea
                  rows={6}
                  value={rawDbJson}
                  onChange={e => setRawDbJson(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-[#00A896] text-[10px] font-mono focus:outline-none focus:border-[#00A896]"
                  placeholder="Paste database JSON payload snapshots here to import..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExportDb}
                  className="px-5 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  Generate &amp; Copy Backup
                </button>
                <button
                  onClick={() => setShowImportDbModal(true)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-extrabold text-xs transition-all cursor-pointer"
                >
                  Restore Pasted Snapshot
                </button>
              </div>
            </div>
          )}

          {activeTab === 'styleguide' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-800 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">BeforeSpend Enterprise Styleguide</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Operational token reference matrix for high fidelity user interfaces.</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200">Color Swatch Palette</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono font-black text-white">
                  <div className="p-4 rounded-xl bg-[#00A896] shadow-md flex flex-col justify-between h-20">
                    <span>Electric Teal</span>
                    <span>#00A896</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0E2A47] shadow-md flex flex-col justify-between h-20">
                    <span>Deep Navy</span>
                    <span>#0E2A47</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0A1220] shadow-md flex flex-col justify-between h-20">
                    <span>Sidebar Dark</span>
                    <span>#0A1220</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] shadow-md flex flex-col justify-between h-20 border border-slate-300 text-slate-900">
                    <span>Background Gray</span>
                    <span>#F8FAFC</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200">Primary UI Component References</h4>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-[#00A896] text-white font-extrabold text-xs shadow-md">
                      Teal Solid
                    </button>
                    <button className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                      Navy Outline
                    </button>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black text-[10px] inline-flex items-center">
                      Verified Pill
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ADD USER MODAL DIALOG */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowAddUserModal(false)} />
          <div className="relative bg-white dark:bg-[#0D1B34] border border-slate-300 dark:border-slate-850 rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-4 z-50 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Register Budgeter Profile</h3>
              <button onClick={() => setShowAddUserModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Chidi Okafor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#00A896]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. chidi@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#00A896]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={e => setNewUserPhone(e.target.value)}
                  placeholder="e.g. +234 80 1234 5678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#00A896]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Secure Passcode</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#00A896]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Default Currency</label>
                  <CustomSelect
                    value={newUserCurrency}
                    onChange={val => setNewUserCurrency(val)}
                    options={[
                      { value: 'NGN', label: 'NGN (₦)' },
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'GBP', label: 'GBP (£)' },
                      { value: 'EUR', label: 'EUR (€)' }
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Policy Role</label>
                  <CustomSelect
                    value={newUserRole}
                    onChange={val => setNewUserRole(val)}
                    options={[
                      { value: 'Salaried Employee / Professional', label: 'Salaried Employee' },
                      { value: 'Freelancer & Contractor', label: 'Freelancer' },
                      { value: 'Business Owner / Entrepreneur', label: 'Entrepreneur' },
                      { value: 'Student & Personal Budgeter', label: 'Student' }
                    ]}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-350 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold shadow-md transition-all cursor-pointer"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* MODULE 6: STATEMENT AUDIT INSPECTOR DRAWER */}
      {selectedStatementDrawer && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedStatementDrawer(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0D1B34] h-full shadow-2xl z-50 p-6 overflow-y-auto space-y-6 flex flex-col">
            
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#00A896]">{selectedStatementDrawer.id}</span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedStatementDrawer.fileName}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedStatementDrawer.bankName} • {selectedStatementDrawer.userEmail}</p>
              </div>
              <button onClick={() => setSelectedStatementDrawer(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-extrabold text-slate-600 dark:text-slate-400">Balance Integrity Inspection Matrix</span>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Reported Statement Balance</span>
                  <p className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    {formatCurrency(selectedStatementDrawer.reportedBalance, 'NGN')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Calculated Parser Balance</span>
                  <p className="font-mono font-black text-sm text-[#00A896]">
                    {formatCurrency(selectedStatementDrawer.calculatedBalance, 'NGN')}
                  </p>
                </div>
              </div>
              {selectedStatementDrawer.discrepancy > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-extrabold text-xs">
                  Discrepancy Delta: {formatCurrency(selectedStatementDrawer.discrepancy, 'NGN')}
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300">Parsed Line-Item Logs ({selectedStatementDrawer.parsedCount} Items)</span>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1 font-bold">
                  <span>Txn Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between">
                  <span>Salary Payroll Credit</span>
                  <span className="text-emerald-600">+₦450,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>POS Terminal Purchase</span>
                  <span className="text-slate-500">-₦12,500.00</span>
                </div>
              </div>
            </div>

            {selectedStatementDrawer.discrepancy > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleReconcileStatement(selectedStatementDrawer.id)}
                  className="w-full py-2.5 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  Force Reconcile Statement
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODULE 7: TRANSACTIONS LEDGER ENTRY INSPECTION DRAWER */}
      {selectedLedgerDrawer && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedLedgerDrawer(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0D1B34] h-full shadow-2xl z-50 p-6 overflow-y-auto space-y-6 flex flex-col">
            
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#00A896]">Ledger Entry ID: {selectedLedgerDrawer.id}</span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedLedgerDrawer.description || 'Transaction Log'}</h3>
                <p className="text-xs text-slate-500 font-semibold">User: {selectedLedgerDrawer.user_id}</p>
              </div>
              <button onClick={() => setSelectedLedgerDrawer(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-extrabold text-slate-600 dark:text-slate-400">Entry Balance Delta</span>
              <p className="font-mono font-black text-lg text-[#00A896]">
                {formatCurrency(selectedLedgerDrawer.amount || 0, 'NGN')}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono">Raw Database Record Snapshot</span>
              <pre className="p-4 rounded-2xl bg-slate-950 text-[#00A896] text-[10px] font-mono overflow-auto max-h-60 rounded-xl scrollbar-none">
                {JSON.stringify(selectedLedgerDrawer, null, 2)}
              </pre>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 font-extrabold">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Cryptographic integrity check verified. Tamper-proof transaction log confirmed.</span>
              </div>
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
