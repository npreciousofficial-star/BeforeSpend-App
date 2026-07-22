import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  X, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink 
} from 'lucide-react';
import { AppNotification } from '../types';
import { deleteNotificationFromSupabase, clearAllNotificationsFromSupabase } from '../lib/supabase';

interface NotificationBellProps {
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  onNavigate: (tabId: string) => void;
  currentUserId?: string;
}

export function NotificationBell({ notifications, setNotifications, onNavigate, currentUserId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      clearAllNotificationsFromSupabase(currentUserId);
    }
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (currentUserId && !currentUserId.startsWith('00000000-')) {
      deleteNotificationFromSupabase(id);
    }
  };

  // Helper to format time as relative string
  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Icon selector based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // Action resolver based on keywords in title/message to go to subtabs
  const getNotificationTabRedirect = (n: AppNotification): string | null => {
    const text = (n.title + ' ' + n.message).toLowerCase();
    if (text.includes('mismatch') || text.includes('allocation') || text.includes('profile')) return 'settings';
    if (text.includes('subscription') || text.includes('reminder') || text.includes('due') || text.includes('netflix') || text.includes('google drive')) return 'reminders';
    if (text.includes('milestone') || text.includes('goal')) return 'milestones';
    if (text.includes('database') || text.includes('snapshot') || text.includes('backup')) return 'admin';
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl border bg-white dark:bg-zinc-900 cursor-pointer transition-all flex items-center justify-center relative select-none ${
          isOpen 
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
            : 'border-gray-200 dark:border-zinc-800 hover:border-emerald-500/50 text-gray-500 dark:text-zinc-400'
        }`}
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        
        {/* Red Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center px-1 border-2 border-white dark:border-zinc-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed sm:absolute top-16 sm:top-auto right-3 sm:right-0 mt-2.5 w-[calc(100vw-1.5rem)] sm:w-96 max-w-md rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-zinc-50">System Notifications</h4>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400">Manage real-time workspace alerts</p>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-rose-500 transition-colors cursor-pointer"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex px-4 py-1.5 border-b border-gray-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`text-[10px] font-extrabold pb-0.5 transition-colors cursor-pointer border-b-2 ${
                  filter === 'all'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`text-[10px] font-extrabold pb-0.5 transition-colors cursor-pointer border-b-2 ${
                  filter === 'unread'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-850 scrollbar-none">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto">
                    <Bell className="w-4 h-4 text-gray-300" />
                  </div>
                  <p className="text-[11px] font-medium">No alerts found</p>
                  <p className="text-[9px]">Everything is up-to-date in your workspace!</p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const redirectTab = getNotificationTabRedirect(n);
                  return (
                    <div
                      key={n.id}
                      onClick={() => toggleRead(n.id)}
                      className={`p-3.5 text-left transition-all relative flex gap-3 cursor-pointer group ${
                        n.read 
                          ? 'bg-transparent hover:bg-slate-50/50 dark:hover:bg-zinc-900/20' 
                          : 'bg-emerald-50/20 dark:bg-emerald-950/5 hover:bg-emerald-50/35 dark:hover:bg-emerald-950/10'
                      }`}
                    >
                      {/* Unread circle badge */}
                      {!n.read && (
                        <div className="absolute left-1.5 top-4.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}

                      {/* Icon */}
                      <div className="mt-0.5 flex-shrink-0">
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Info Content */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <p className={`text-xs font-bold text-gray-900 dark:text-zinc-100 truncate ${!n.read ? 'font-black' : ''}`}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-gray-400 flex-shrink-0">
                            {getRelativeTime(n.time)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-normal">
                          {n.message}
                        </p>

                        {/* Redirect button */}
                        {redirectTab && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Mark as read first
                              if (!n.read) toggleRead(n.id);
                              onNavigate(redirectTab);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer mt-1 pt-1 border-t border-dashed border-gray-150 dark:border-zinc-800"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Open {redirectTab.charAt(0).toUpperCase() + redirectTab.slice(1)}
                          </button>
                        )}
                      </div>

                      {/* Delete item */}
                      <div className="flex flex-col justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-900/30 text-center text-[9px] text-gray-400 border-t border-gray-150 dark:border-zinc-850">
                You have {unreadCount} unread workspace alerts.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
