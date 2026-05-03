// React import no longer needed because JSX runtime handles it automatically
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({ role: 'platform_admin', session: { user: { id: 'admin-1' } } }),
}));

// Mock the services used by the new AdminDashboard
vi.mock('../services/orgManagementService', () => ({
    orgManagementService: {
        listUsers: vi.fn().mockResolvedValue([]),
        getOrgConfig: vi.fn().mockResolvedValue({ orgName: 'Test Org', timezone: 'UTC', modules: [], require2fa: false }),
        updateOrgConfig: vi.fn().mockResolvedValue({}),
        saveOrgConfig: vi.fn().mockResolvedValue({}),
        updateUserRole: vi.fn().mockResolvedValue({}),
        deactivateUser: vi.fn().mockResolvedValue({}),
        reactivateUser: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../services/auditLogService', () => ({
    auditLogService: {
        listLogs: vi.fn().mockResolvedValue([]),
        logAction: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../services/supportTicketService', () => ({
    supportTicketService: {
        listTickets: vi.fn().mockResolvedValue([]),
        createTicket: vi.fn().mockResolvedValue({ id: 'ticket-1' }),
    },
}));

vi.mock('../services/retentionPolicyService', () => ({
    retentionPolicyService: {
        getRetentionSnapshot: vi.fn().mockResolvedValue({
            counts: { documents: 0, tasks: 0, trainingAssignments: 0, total: 0 },
            candidates: [],
            days: 365,
            cutoffDate: '2026-01-01',
        }),
    },
}));

vi.mock('../services/telematicsService', () => ({
    telematicsService: {
        getIngestionHealthSummaries: vi.fn().mockResolvedValue([
            {
                provider: 'motive',
                lastReceivedAt: '2026-05-01T00:00:00.000Z',
                lastProcessedAt: '2026-05-01T00:05:00.000Z',
                bufferedCount: 2,
                processedCount: 4,
                retryCount: 1,
                droppedCount: 0,
                dedupCount: 3,
                outOfOrderCount: 1,
                lastEventKey: 'driver-1::speeding::2026-05-01T00:00:00.000Z',
                lastError: null,
            },
        ]),
    },
}));

vi.mock('../services/authorizationService', () => ({
    canAccessPlatformAdmin: vi.fn().mockReturnValue(true),
    getRoleCapabilities: vi.fn().mockReturnValue({
        canManageOrgSettings: true,
        canAccessPlatformAdmin: true,
    }),
}));

import AdminDashboard from '../pages/AdminDashboard';

describe('AdminDashboard — Enterprise Controls Hub', () => {
    it('renders the 5-tab navigation with Users tab active by default', () => {
        render(<AdminDashboard />);

        // The page title
        expect(screen.getByText(/Enterprise Controls/i)).toBeInTheDocument();

        // Scope to the navigation to avoid collisions with subtitle text
        const nav = screen.getByRole('navigation');
        const tabButtons = within(nav).getAllByRole('button');
        const tabLabels = tabButtons.map(btn => btn.textContent?.trim());

        expect(tabLabels).toContain('User Management');
        expect(tabLabels).toContain('Organization');
        expect(tabLabels).toContain('Audit Log');
        expect(tabLabels).toContain('Support Tickets');
        expect(tabLabels).toContain('Telematics');
        expect(tabLabels).toContain('Data Retention');
        expect(tabButtons).toHaveLength(7);
    });

    it('can switch to the Support Tickets tab', () => {
        render(<AdminDashboard />);

        const nav = screen.getByRole('navigation');
        const ticketsTab = within(nav).getByText('Support Tickets');
        fireEvent.click(ticketsTab);

        // Should show a "New Ticket" button on the support tickets tab
        expect(screen.getByText(/New Ticket/i)).toBeInTheDocument();
    });

    it('can switch to the Telematics tab and show provider health', async () => {
        render(<AdminDashboard />);

        const nav = screen.getByRole('navigation');
        const telematicsTab = within(nav).getByText('Telematics');
        fireEvent.click(telematicsTab);

        expect(await screen.findByText(/Telematics ingestion health/i)).toBeInTheDocument();
        expect(await screen.findByText('motive')).toBeInTheDocument();
        expect(screen.getByText('Deduplicated')).toBeInTheDocument();
    });

    it('can switch to the Organization tab', () => {
        render(<AdminDashboard />);

        const nav = screen.getByRole('navigation');
        const orgTab = within(nav).getByText('Organization');
        fireEvent.click(orgTab);

        // Company Name field should be present in the org form
        expect(screen.getByText(/Company Name/i)).toBeInTheDocument();
    });
});
