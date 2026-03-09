import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Notification } from '../services/notificationService';

const mockProfileData = vi.hoisted(() => ({
  value: {
    email: 'jane@test.com',
    fullName: 'Jane Doe',
    title: 'Fleet Manager',
    phone: '',
    location: '',
    avatarUrl: '',
    role: 'full' as const,
    organizationId: null,
  },
}));

const mockNotificationsData = vi.hoisted(() => ({
  value: [] as Notification[],
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'jane@test.com', user_metadata: {} },
    signOut: vi.fn(),
  }),
}));

vi.mock('../services/profileService', () => ({
  profileService: {
    getExtendedProfile: vi.fn().mockImplementation(() =>
      Promise.resolve(mockProfileData.value)
    ),
  },
}));

vi.mock('../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn().mockImplementation(() =>
      Promise.resolve(mockNotificationsData.value)
    ),
  },
  formatBadgeCount: (n: number) => (n > 99 ? '99+' : String(n)),
}));

import Header from '../components/Layout/Header';
import { profileService } from '../services/profileService';
import { notificationService } from '../services/notificationService';

const mockGetProfile = profileService.getExtendedProfile as ReturnType<typeof vi.fn>;
const mockGetNotifications = notificationService.getNotifications as ReturnType<typeof vi.fn>;

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileData.value = {
      email: 'jane@test.com',
      fullName: 'Jane Doe',
      title: 'Fleet Manager',
      phone: '',
      location: '',
      avatarUrl: '',
      role: 'full' as const,
      organizationId: null,
    };
    mockNotificationsData.value = [];
    mockGetProfile.mockImplementation(() => Promise.resolve(mockProfileData.value));
    mockGetNotifications.mockImplementation(() => Promise.resolve(mockNotificationsData.value));
  });

  it('shows profile name from profileService, not user_metadata', async () => {
    renderHeader();
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Fleet Manager')).toBeInTheDocument();
  });

  it('re-fetches profile when userProfileUpdated event fires', async () => {
    renderHeader();
    await screen.findByText('Jane Doe');

    mockProfileData.value = { ...mockProfileData.value, fullName: 'Jane Updated', title: 'Safety Lead' };
    mockGetProfile.mockResolvedValue(mockProfileData.value);

    window.dispatchEvent(new Event('userProfileUpdated'));

    expect(await screen.findByText('Jane Updated')).toBeInTheDocument();
  });

  it('shows avatar fallback when avatarUrl is empty', async () => {
    renderHeader();
    await screen.findByText('Jane Doe');
    expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'User' })).not.toBeInTheDocument();
  });

  it('shows notification badge with count when notifications exist', async () => {
    mockNotificationsData.value = [
      { id: 'n1', type: 'overdue_task', title: 'Task overdue', detail: 'Fix it', href: '/tasks', severity: 'critical', createdAt: new Date().toISOString() },
      { id: 'n2', type: 'expiring_document', title: 'Doc expiring', detail: 'CDL', href: '/documents', severity: 'warning', createdAt: new Date().toISOString() },
      { id: 'n3', type: 'unreviewed_training', title: 'Review needed', detail: 'HOS', href: '/training', severity: 'info', createdAt: new Date().toISOString() },
    ];
    mockGetNotifications.mockImplementation(() => Promise.resolve(mockNotificationsData.value));

    renderHeader();
    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('does not show badge when notifications is empty', async () => {
    mockNotificationsData.value = [];
    renderHeader();
    await screen.findByText('Jane Doe');
    // Badge only renders when unreadCount > 0 — should not be present
    expect(screen.queryByText(/^\d+$|^99\+$/)).not.toBeInTheDocument();
  });

  it('shows 99+ badge when unread count exceeds 99', async () => {
    mockNotificationsData.value = Array.from({ length: 100 }, (_, i) => ({
      id: `n${i}`,
      type: 'overdue_task' as const,
      title: 'Task',
      detail: 'Detail',
      href: '/tasks',
      severity: 'warning' as const,
      createdAt: new Date().toISOString(),
    }));
    mockGetNotifications.mockImplementation(() => Promise.resolve(mockNotificationsData.value));

    renderHeader();
    expect(await screen.findByText('99+')).toBeInTheDocument();
  });
});
