import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { notificationService, type Notification } from '../services/notificationService';
import { useAuth } from './AuthContext';

const POLL_INTERVAL_MS = 60_000;
const READ_NOTIFICATIONS_PREFIX = 'safety-suite.read-notifications:';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  lastRefreshed: Date | null;
  markAllRead: () => void;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storageKey = `${READ_NOTIFICATIONS_PREFIX}${user?.id ?? 'anonymous'}`;

  const readNotificationIds = useCallback(() => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      return new Set<string>(JSON.parse(window.localStorage.getItem(storageKey) || '[]'));
    } catch {
      return new Set<string>();
    }
  }, [storageKey]);

  const writeNotificationIds = useCallback((ids: Set<string>) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify([...ids].slice(-500)));
  }, [storageKey]);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const result = await notificationService.getNotifications();
      const readIds = readNotificationIds();
      setNotifications(result);
      setUnreadCount(result.filter((notification) => !readIds.has(notification.id)).length);
      setLastRefreshed(new Date());
    } catch {
      // silently degrade — stale count is better than an error toast
    }
  }, [readNotificationIds, session]);

  // Initial fetch + polling
  useEffect(() => {
    if (!session) return;

    refresh();

    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session, refresh]);

  const markAllRead = useCallback(() => {
    const readIds = readNotificationIds();
    notifications.forEach((notification) => readIds.add(notification.id));
    writeNotificationIds(readIds);
    setUnreadCount(0);
  }, [notifications, readNotificationIds, writeNotificationIds]);

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
