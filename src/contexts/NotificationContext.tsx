import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { notificationService, type Notification } from '../services/notificationService';
import { useAuth } from './AuthContext';

const POLL_INTERVAL_MS = 60_000;

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  lastRefreshed: Date | null;
  markAllRead: () => void;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const result = await notificationService.getNotifications();
      setNotifications(result);
      setUnreadCount(result.length);
      setLastRefreshed(new Date());
    } catch {
      // silently degrade — stale count is better than an error toast
    }
  }, [session]);

  // Initial fetch + polling
  useEffect(() => {
    if (!session) return;

    refresh();

    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session, refresh]);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, lastRefreshed, markAllRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};

/** Derive per-nav-item badge counts from the shared notification list */
export function getNavBadgeCounts(notifications: Notification[]) {
  return {
    '/tasks': notifications.filter((n) => n.type === 'overdue_task').length,
    '/watchlist': notifications.filter((n) => n.type === 'pending_checkin').length,
    '/training': notifications.filter((n) => n.type === 'unreviewed_training').length,
    '/documents': notifications.filter((n) => n.type === 'expiring_document').length,
  };
}
