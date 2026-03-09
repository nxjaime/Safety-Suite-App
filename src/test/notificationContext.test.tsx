import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { NotificationProvider, useNotifications, getNavBadgeCounts } from '../contexts/NotificationContext';
import type { Notification } from '../services/notificationService';

const mockNotifications: Notification[] = [
  { id: 't1', type: 'overdue_task', title: 'Task', detail: 'Fix', href: '/tasks', severity: 'critical', createdAt: new Date().toISOString() },
  { id: 't2', type: 'overdue_task', title: 'Task 2', detail: 'Fix 2', href: '/tasks', severity: 'warning', createdAt: new Date().toISOString() },
  { id: 'd1', type: 'expiring_document', title: 'Doc', detail: 'CDL', href: '/documents', severity: 'warning', createdAt: new Date().toISOString() },
  { id: 'tr1', type: 'unreviewed_training', title: 'Review', detail: 'HOS', href: '/training', severity: 'info', createdAt: new Date().toISOString() },
  { id: 'ci1', type: 'pending_checkin', title: 'Check-in', detail: 'Week 2', href: '/safety', severity: 'warning', createdAt: new Date().toISOString() },
];

vi.mock('../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue([]),
  },
  formatBadgeCount: (n: number) => (n > 99 ? '99+' : String(n)),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ session: { access_token: 'tok' }, user: { id: 'u1' } }),
}));

import { notificationService } from '../services/notificationService';
const mockGetNotifications = notificationService.getNotifications as ReturnType<typeof vi.fn>;

const Consumer: React.FC = () => {
  const { notifications, unreadCount, markAllRead, lastRefreshed } = useNotifications();
  return (
    <div>
      <span data-testid="count">{unreadCount}</span>
      <span data-testid="len">{notifications.length}</span>
      <span data-testid="refreshed">{lastRefreshed ? 'yes' : 'no'}</span>
      <button onClick={markAllRead}>mark read</button>
    </div>
  );
};

function renderWithProvider() {
  return render(
    <NotificationProvider>
      <Consumer />
    </NotificationProvider>
  );
}

describe('NotificationContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches notifications on mount and exposes them', async () => {
    mockGetNotifications.mockResolvedValue(mockNotifications);
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('5'));
    expect(screen.getByTestId('len').textContent).toBe('5');
    expect(screen.getByTestId('refreshed').textContent).toBe('yes');
  });

  it('markAllRead resets unreadCount to 0', async () => {
    mockGetNotifications.mockResolvedValue(mockNotifications);
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('5'));

    fireEvent.click(screen.getByRole('button', { name: /mark read/i }));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('refresh() re-fetches and updates notification count', async () => {
    mockGetNotifications.mockResolvedValue([]);
    const RefreshConsumer: React.FC = () => {
      const { notifications, refresh } = useNotifications();
      return (
        <div>
          <span data-testid="len">{notifications.length}</span>
          <button onClick={() => refresh()}>refresh</button>
        </div>
      );
    };
    render(<NotificationProvider><RefreshConsumer /></NotificationProvider>);
    await waitFor(() => expect(screen.getByTestId('len').textContent).toBe('0'));

    mockGetNotifications.mockResolvedValue(mockNotifications);
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    await waitFor(() => expect(screen.getByTestId('len').textContent).toBe('5'));
  });

  it('silently handles fetch errors without throwing', async () => {
    mockGetNotifications.mockRejectedValue(new Error('network error'));
    expect(() => renderWithProvider()).not.toThrow();
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});

describe('getNavBadgeCounts', () => {
  it('returns correct counts by nav path', () => {
    const counts = getNavBadgeCounts(mockNotifications);
    expect(counts['/tasks']).toBe(2);
    expect(counts['/documents']).toBe(1);
    expect(counts['/training']).toBe(1);
    expect(counts['/watchlist']).toBe(1);
  });

  it('returns zeros for empty notifications', () => {
    const counts = getNavBadgeCounts([]);
    expect(counts['/tasks']).toBe(0);
    expect(counts['/documents']).toBe(0);
    expect(counts['/training']).toBe(0);
    expect(counts['/watchlist']).toBe(0);
  });
});
