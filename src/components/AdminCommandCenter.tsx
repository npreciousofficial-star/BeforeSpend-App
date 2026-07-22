/**
 * AdminCommandCenter.tsx
 * Standalone full-screen Admin Command Center dashboard
 * Completely isolated from the regular user app — admins only
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, Layers, Scale, History, Bell, Database, ShieldAlert,
  RefreshCw, Edit3, Trash2, Send, X, CheckCircle2, Sparkles, Upload,
  UserCheck, Wallet, LogOut, Search, Activity, TrendingUp, Globe, Settings,
  AlertTriangle, ChevronRight
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

const SUB_TABS = [
  { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
  { id: 'users', label: 'User Directory', icon: Users },
  { id: 'categories', label: 'Categories & Buckets', icon: Layers },
  { id: 'ledger', label: 'Transactions Ledger', icon: Scale },
  { id: 'payments', label: 'Payment Splits', icon: History },
  { id: 'broadcast', label: 'System Broadcast', icon: Bell },
  { id: 'backups', label: 'Backups & System', icon: Database },
];

export function AdminCommandCenter({
  currentUserId, userProfile, onExit, onLogout,
  exchangeRates, setExchangeRates,
  rawDbJson, setRawDbJson, handleExportDb, handleImportDb,
  showImportDbModal, setShowImportDbModal,
  calculateLocalStorageQuota, formatCurrency,
  isDarkMode, toggleDarkMode
}: AdminCommandCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [profiles, setProfiles] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Edit modal states
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserCurrency, setEditUserCurrency] = useState('NGN');

  const [editingBucket, setEditingBucket] = useState<any | null>(null);
  const [editBucketName, setEditBucketName] = useState('');
  const [editBucketPercentage, setEditBucketPercentage] = useState(0);
  const [editBucketAccount, setEditBucketAccount] = useState('');
  const [editBucketBank, setEditBucketBank] = useState('');
  const [editBucketColor, setEditBucketColor] = useState('emerald');
  const [editBucketNote, setEditBucketNote] = useState('');

  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [editTxnDesc, setEditTxnDesc] = useState('');
  const [editTxnAmount, setEditTxnAmount] = useState(0);
  const [editTxnType, setEditTxnType] = useState('EXPENSE');
  const [editTxnDirection, setEditTxnDirection] = useState('DEBIT');

  // Broadcast states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [p, b, t, pay] = await Promise.all([
        adminLoadProfilesFromSupabase(),
        adminLoadBucketsFromSupabase(),
        adminLoadTransactionsFromSupabase(),
        adminLoadPaymentsFromSupabase(),
      ]);
      if (p) setProfiles(p);
      if (b) setBuckets(b);
      if (t) setTransactions(t);
      if (pay) setPayments(pay);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    setIsLoading(true);
    await adminDeleteProfileFromSupabase(id);
    await loadData();
    setIsLoading(false);
  };

  const handleSaveBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBucket) return;
    setIsLoading(true);
    await adminUpdateBucketInSupabase(editingBucket.id, {
      name: editBucketName, allocation_percentage: editBucketPercentage,
      destination_account: editBucketAccount, target_bank: editBucketBank,
      color: editBucketColor, note: editBucketNote
    });
    await loadData();
    setEditingBucket(null);
    setIsLoading(false);
  };

  const handleDeleteBucket = async (id: string) => {
    if (!confirm('Delete this bucket permanently?')) return;
    setIsLoading(true);
    await adminDeleteBucketFromSupabase(id);
    await loadData();
    setIsLoading(false);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    setIsLoading(true);
    await adminUpdateTransactionInSupabase(editingTransaction.id, {
      description: editTxnDesc, amount: editTxnAmount, type: editTxnType, direction: editTxnDirection
    });
    await loadData();
    setEditingTransaction(null);
    setIsLoading(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction permanently?')) return;
    setIsLoading(true);
    await adminDeleteTransactionFromSupabase(id);
    await loadData();
    setIsLoading(false);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsLoading(true);
    await adminBroadcastNotificationToAll(broadcastTitle, broadcastMessage, broadcastType);
    setIsLoading(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
    alert('Broadcast sent to all users!');
  };

  const filteredProfiles = profiles.filter(p =>
    !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredBuckets = buckets.filter(b =>
    !searchQuery || b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || b.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTransactions = transactions.filter(t =>
    !searchQuery || t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || t.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPayments = payments.filter(p =>
    !searchQuery || p.note?.toLowerCase().includes(searchQuery.toLowerCase()) || p.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgAllocation = buckets.length
    ? (buckets.reduce((sum, b) => sum + Number(b.allocation_percentage || 0), 0) / buckets.length).toFixed(1)
    : '0.0';

  const ROLES = [
    'Salaried Employee / Professional',
    'Freelancer & Contractor',
    'Business Owner / Entrepreneur',
    'Student & Personal Budgeter',
    'Platform Administrator',
  ];

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#0A1628] overflow-hidden font-sans">

      {/* === LEFT SIDEBAR === */}
      <aside className="w-[220px] flex-shrink-0 bg-[#0D1F3C] border-r border-white/5 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <BeforeSpendLogo size="md" variant="white" />
          <span className="text-[#00A896] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#00A896]/10 border border-[#00A896]/20">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {SUB_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveSubTab(tab.id); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#00A896] text-white shadow-lg shadow-[#00A896]/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin Profile */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
              <Avatar avatar={userProfile.avatar} name={userProfile.name} className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
              <p className="text-[9px] text-[#00A896] font-black truncate">Platform Admin</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Admin Console</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer mt-0.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0D1F3C]/50 backdrop-blur-sm flex-shrink-0">
          <div>
            <h1 className="text-lg font-black text-white leading-none">
              {activeSubTab === 'overview' && 'System Overview'}
              {activeSubTab === 'users' && 'User Directory'}
              {activeSubTab === 'categories' && 'Categories & Buckets'}
              {activeSubTab === 'ledger' && 'Transactions Ledger'}
              {activeSubTab === 'payments' && 'Payment Splits'}
              {activeSubTab === 'broadcast' && 'System Broadcast'}
              {activeSubTab === 'backups' && 'Backups & System'}
            </h1>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {activeSubTab === 'overview' && 'Platform-wide KPIs, user distributions, and live activity feed'}
              {activeSubTab === 'users' && 'Manage all registered accounts — edit roles, currencies, and access'}
              {activeSubTab === 'categories' && 'View and audit all user budget categories and allocation targets'}
              {activeSubTab === 'ledger' && 'Full double-entry ledger audit across all user accounts'}
              {activeSubTab === 'payments' && 'Inflow payment history and multi-bucket split records'}
              {activeSubTab === 'broadcast' && 'Send instant priority notifications to all active platform members'}
              {activeSubTab === 'backups' && 'Exchange rate config, storage quota, and database backup tools'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {['users', 'categories', 'ledger', 'payments'].includes(activeSubTab) && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#00A896] w-52"
                />
              </div>
            )}
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00A896] hover:bg-[#00A896]/90 text-white text-xs font-bold disabled:opacity-50 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <RefreshCw className="w-8 h-8 text-[#00A896] animate-spin" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading platform data...</p>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {!isLoading && activeSubTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  { label: 'Total Members', value: profiles.length, sub: 'Active Profiles', color: '#00A896', icon: Users },
                  { label: 'Active Buckets', value: buckets.length, sub: 'Configured', color: '#6366F1', icon: Layers },
                  { label: 'System Transactions', value: transactions.length, sub: 'Ledger Entries', color: '#F59E0B', icon: Scale },
                  { label: 'Avg. Allocation', value: `${avgAllocation}%`, sub: 'Per Bucket', color: '#10B981', icon: TrendingUp },
                  { label: 'Payment Splits', value: payments.length, sub: 'Inflow Records', color: '#EC4899', icon: Wallet },
                ].map(kpi => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.label} className="bg-[#0D1F3C] rounded-2xl border border-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{kpi.label}</p>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}20` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                        </div>
                      </div>
                      <p className="text-2xl font-black text-white">{kpi.value}</p>
                      <span className="text-[10px] font-bold" style={{ color: kpi.color }}>{kpi.sub}</span>
                    </div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Recent Ledger */}
                <div className="lg:col-span-8 bg-[#0D1F3C] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-black text-sm">Recent Platform Activity</h3>
                    <button onClick={() => setActiveSubTab('ledger')} className="text-[#00A896] text-xs font-bold hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-white/3">
                        <tr>
                          <th className="py-3 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Description</th>
                          <th className="py-3 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                          <th className="py-3 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Type</th>
                          <th className="py-3 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Dir.</th>
                          <th className="py-3 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/3">
                        {transactions.slice(0, 7).map(txn => (
                          <tr key={txn.id} className="hover:bg-white/3 transition-colors">
                            <td className="py-3 px-4 text-slate-200 font-semibold truncate max-w-[200px]">{txn.description}</td>
                            <td className="py-3 px-4 text-white font-black">{formatCurrency(txn.amount, userProfile.defaultCurrency)}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/5 text-slate-300">{txn.type}</span>
                            </td>
                            <td className="py-3 px-4 font-black">
                              <span className={txn.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}>{txn.direction}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[10px]">{new Date(txn.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {transactions.length === 0 && (
                          <tr><td colSpan={5} className="py-10 text-center text-slate-500 text-xs">No transactions yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Role Distribution */}
                <div className="lg:col-span-4 bg-[#0D1F3C] rounded-2xl border border-white/5 p-5 space-y-4">
                  <h3 className="text-white font-black text-sm">User Role Breakdown</h3>
                  <div className="space-y-3.5">
                    {ROLES.map(roleName => {
                      const count = profiles.filter(p => p.role === roleName).length;
                      const pct = profiles.length ? Math.round((count / profiles.length) * 100) : 0;
                      return (
                        <div key={roleName} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 truncate max-w-[140px]">{roleName}</span>
                            <span className="text-white font-black">{count} · {pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00A896] rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {!isLoading && activeSubTab === 'users' && (
            <div className="bg-[#0D1F3C] rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-white/5">
                  <tr>
                    {['Avatar', 'Name', 'Email', 'Role', 'Currency', 'Actions'].map(h => (
                      <th key={h} className="py-3.5 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {filteredProfiles.map(profile => (
                    <tr key={profile.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10">
                          <Avatar avatar={profile.avatar} name={profile.name} className="w-full h-full" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white font-bold">{profile.name}</td>
                      <td className="py-3 px-4 text-slate-400">{profile.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-lg text-[9px] font-black bg-[#00A896]/10 text-[#00A896] border border-[#00A896]/20">{profile.role}</span>
                      </td>
                      <td className="py-3 px-4 text-white font-black text-xs">{profile.default_currency}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(profile);
                              setEditUserName(profile.name);
                              setEditUserEmail(profile.email);
                              setEditUserRole(profile.role || ROLES[0]);
                              setEditUserCurrency(profile.default_currency || 'NGN');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#00A896]/10 hover:bg-[#00A896]/20 border border-[#00A896]/20 text-[#00A896] font-bold text-[10px] cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          {profile.email !== userProfile.email && (
                            <button
                              onClick={() => handleDeleteUser(profile.id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-[10px] cursor-pointer flex items-center gap-1 transition-all"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-xs">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {!isLoading && activeSubTab === 'categories' && (
            <div className="bg-[#0D1F3C] rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-white/5">
                  <tr>
                    {['User ID', 'Bucket Name', '%', 'Account', 'Bank', 'Color', 'Actions'].map(h => (
                      <th key={h} className="py-3.5 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {filteredBuckets.map(bucket => (
                    <tr key={bucket.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4 font-mono text-[9px] text-slate-500 max-w-[80px] truncate">{bucket.user_id?.substring(0, 8)}...</td>
                      <td className="py-3 px-4 text-white font-bold">{bucket.name}</td>
                      <td className="py-3 px-4 text-white font-black">{bucket.allocation_percentage}%</td>
                      <td className="py-3 px-4 text-slate-400">{bucket.destination_account}</td>
                      <td className="py-3 px-4 text-slate-400">{bucket.target_bank}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase" style={{
                          backgroundColor: bucket.color === 'emerald' ? '#10B98130' : bucket.color === 'indigo' ? '#6366F130' : bucket.color === 'rose' ? '#EF444430' : '#64748B30',
                          color: bucket.color === 'emerald' ? '#10B981' : bucket.color === 'indigo' ? '#6366F1' : bucket.color === 'rose' ? '#EF4444' : '#94A3B8'
                        }}>{bucket.color}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setEditingBucket(bucket);
                            setEditBucketName(bucket.name);
                            setEditBucketPercentage(Number(bucket.allocation_percentage));
                            setEditBucketAccount(bucket.destination_account);
                            setEditBucketBank(bucket.target_bank || 'Default Bank');
                            setEditBucketColor(bucket.color || 'emerald');
                            setEditBucketNote(bucket.note || '');
                          }} className="px-3 py-1.5 rounded-lg bg-[#00A896]/10 hover:bg-[#00A896]/20 border border-[#00A896]/20 text-[#00A896] font-bold text-[10px] cursor-pointer flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleDeleteBucket(bucket.id)} className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-[10px] cursor-pointer flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBuckets.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-500 text-xs">No buckets found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── LEDGER ── */}
          {!isLoading && activeSubTab === 'ledger' && (
            <div className="bg-[#0D1F3C] rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-white/5">
                  <tr>
                    {['User ID', 'Description', 'Amount', 'Type', 'Direction', 'Date', 'Actions'].map(h => (
                      <th key={h} className="py-3.5 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {filteredTransactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4 font-mono text-[9px] text-slate-500">{txn.user_id?.substring(0, 8)}...</td>
                      <td className="py-3 px-4 text-slate-200 font-semibold max-w-[180px] truncate">{txn.description}</td>
                      <td className="py-3 px-4 text-white font-black">{formatCurrency(txn.amount, userProfile.defaultCurrency)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/5 text-slate-300">{txn.type}</span>
                      </td>
                      <td className="py-3 px-4 font-black">
                        <span className={txn.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}>{txn.direction}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[10px]">{new Date(txn.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setEditingTransaction(txn);
                            setEditTxnDesc(txn.description);
                            setEditTxnAmount(Number(txn.amount));
                            setEditTxnType(txn.type || 'EXPENSE');
                            setEditTxnDirection(txn.direction || 'DEBIT');
                          }} className="px-3 py-1.5 rounded-lg bg-[#00A896]/10 hover:bg-[#00A896]/20 border border-[#00A896]/20 text-[#00A896] font-bold text-[10px] cursor-pointer flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleDeleteTransaction(txn.id)} className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-[10px] cursor-pointer flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-500 text-xs">No transactions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {!isLoading && activeSubTab === 'payments' && (
            <div className="bg-[#0D1F3C] rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-white/5">
                  <tr>
                    {['Date', 'User ID', 'Amount', 'NGN Converted', 'Splits', 'Note', 'Receipt'].map(h => (
                      <th key={h} className="py-3.5 px-4 text-left text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {filteredPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4 text-slate-400 text-[10px]">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-mono text-[9px] text-slate-500">{payment.user_id?.substring(0, 8)}...</td>
                      <td className="py-3 px-4 text-white font-bold">{payment.amount} {payment.currency}</td>
                      <td className="py-3 px-4 font-black text-[#00A896]">₦{Number(payment.converted_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {payment.splits?.slice(0, 2).map((s: any, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[8px] bg-[#00A896]/10 border border-[#00A896]/20 text-[#00A896] font-bold">
                              {s.bucketName}: {s.percentage}%
                            </span>
                          ))}
                          {payment.splits?.length > 2 && <span className="text-slate-500 text-[8px]">+{payment.splits.length - 2}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">{payment.note || '—'}</td>
                      <td className="py-3 px-4">
                        {payment.receipt_image
                          ? <a href={payment.receipt_image} target="_blank" rel="noreferrer" className="text-[#00A896] hover:underline font-bold text-[10px]">View</a>
                          : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-500 text-xs">No payment records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── BROADCAST ── */}
          {!isLoading && activeSubTab === 'broadcast' && (
            <div className="max-w-xl">
              <form onSubmit={handleBroadcast} className="bg-[#0D1F3C] rounded-2xl border border-white/5 p-6 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-white font-black text-sm">Send Platform-Wide Notification</h3>
                  <p className="text-slate-400 text-[11px]">Broadcasts to all registered user notification feeds immediately.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Notification Title</label>
                  <input
                    type="text" required value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Scheduled Maintenance at 2AM"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#00A896]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Notification Type</label>
                  <select
                    value={broadcastType} onChange={e => setBroadcastType(e.target.value as any)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896] cursor-pointer"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="alert">Alert (Red)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Message Body</label>
                  <textarea
                    required value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)}
                    placeholder="Compose the notification body here..."
                    className="w-full h-32 px-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#00A896] resize-none"
                  />
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full py-3 px-5 rounded-xl bg-[#00A896] hover:bg-[#00A896]/90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-lg shadow-[#00A896]/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Global Broadcast
                </button>
              </form>
            </div>
          )}

          {/* ── BACKUPS ── */}
          {!isLoading && activeSubTab === 'backups' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-5">
                {/* Storage */}
                <div className="bg-[#0D1F3C] rounded-2xl border border-white/5 p-5 space-y-3">
                  <h3 className="text-white font-black text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00A896]" /> Local Storage Quota
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Used:</span>
                      <span className="font-black text-white">{calculateLocalStorageQuota()} KB / 5120 KB</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00A896] rounded-full" style={{ width: `${Math.min(100, (parseFloat(calculateLocalStorageQuota()) / 5120) * 100)}%` }} />
                    </div>
                    <p className="text-slate-500 text-[10px]">App data synced to Supabase in real-time.</p>
                  </div>
                </div>

                {/* Exchange Rates */}
                <div className="bg-[#0D1F3C] rounded-2xl border border-white/5 p-5 space-y-3">
                  <h3 className="text-white font-black text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00A896]" /> Exchange Rates (₦)
                  </h3>
                  <p className="text-slate-400 text-[11px]">Set global Naira equivalents for freelance payment conversions.</p>
                  <div className="space-y-2.5">
                    {Object.keys(exchangeRates).filter(k => k !== 'NGN').map(code => (
                      <div key={code} className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-bold">1 {code} = ₦</span>
                        <input
                          type="number" value={exchangeRates[code]}
                          onChange={e => setExchangeRates({ ...exchangeRates, [code]: parseFloat(e.target.value) || 1 })}
                          className="w-28 px-3 py-1.5 text-xs text-right rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-[#0D1F3C] rounded-2xl border border-white/5 p-5 space-y-4 h-full">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-black text-sm">Data Backup & Restore</h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">Export a full JSON snapshot or restore from backup.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleExportDb} className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer flex items-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5" /> Export
                      </button>
                      <button onClick={() => setShowImportDbModal(true)} className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#00A896]/10 hover:bg-[#00A896]/20 border border-[#00A896]/20 text-[#00A896] cursor-pointer flex items-center gap-1.5 transition-all">
                        <UserCheck className="w-3.5 h-3.5" /> Restore
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={rawDbJson} onChange={e => setRawDbJson(e.target.value)}
                    placeholder='Click "Export" to inspect the raw JSON backup or paste a snapshot here to restore...'
                    className="w-full h-72 px-4 py-3 text-[11px] font-mono rounded-xl bg-white/3 border border-white/8 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#00A896]/50 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* === EDIT MODALS === */}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleSaveUser} className="bg-[#0D1F3C] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-white font-black">Edit User Profile</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              {[
                { label: 'Full Name', value: editUserName, set: setEditUserName, type: 'text' },
                { label: 'Email Address', value: editUserEmail, set: setEditUserEmail, type: 'email' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{f.label}</label>
                  <input type={f.type} required value={f.value} onChange={e => f.set(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]" />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Role</label>
                <select value={editUserRole} onChange={e => setEditUserRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896] cursor-pointer">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Currency</label>
                <select value={editUserCurrency} onChange={e => setEditUserCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896] cursor-pointer">
                  {['NGN', 'USD', 'EUR', 'GBP', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A896] hover:bg-[#00A896]/90 text-white text-xs font-bold cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Bucket Modal */}
      {editingBucket && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleSaveBucket} className="bg-[#0D1F3C] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-white font-black">Edit Budget Bucket</h3>
              <button type="button" onClick={() => setEditingBucket(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Bucket Name</label>
                <input type="text" required value={editBucketName} onChange={e => setEditBucketName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Allocation %</label>
                <input type="number" required min="0" max="100" value={editBucketPercentage} onChange={e => setEditBucketPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Destination Account</label>
                <input type="text" required value={editBucketAccount} onChange={e => setEditBucketAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Target Bank</label>
                <input type="text" value={editBucketBank} onChange={e => setEditBucketBank(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Color</label>
                <select value={editBucketColor} onChange={e => setEditBucketColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896] cursor-pointer">
                  {['emerald', 'indigo', 'rose', 'amber', 'slate'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Note</label>
                <input type="text" value={editBucketNote} onChange={e => setEditBucketNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditingBucket(null)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A896] hover:bg-[#00A896]/90 text-white text-xs font-bold cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleSaveTransaction} className="bg-[#0D1F3C] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-white font-black">Audit Transaction</h3>
              <button type="button" onClick={() => setEditingTransaction(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Description</label>
                <input type="text" required value={editTxnDesc} onChange={e => setEditTxnDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Amount</label>
                <input type="number" required min="0" step="any" value={editTxnAmount} onChange={e => setEditTxnAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Type</label>
                <select value={editTxnType} onChange={e => setEditTxnType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896] cursor-pointer">
                  {['INCOME_SPLIT', 'EXPENSE', 'MANUAL_ADJUSTMENT', 'TRANSFER'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Direction</label>
                <select value={editTxnDirection} onChange={e => setEditTxnDirection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#00A896] cursor-pointer">
                  <option value="CREDIT">CREDIT (Inflow)</option>
                  <option value="DEBIT">DEBIT (Outflow)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditingTransaction(null)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A896] hover:bg-[#00A896]/90 text-white text-xs font-bold cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
