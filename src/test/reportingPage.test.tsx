import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

const authState = vi.hoisted(() => ({
  role: 'readonly' as 'readonly' | 'safety'
}));

const { getSnapshot } = vi.hoisted(() => ({
  getSnapshot: vi.fn()
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    role: authState.role,
    capabilities: {
      canManageReportingPreferences: authState.role === 'safety'
    }
  })
}));

vi.mock('../services/reportingService', () => ({
  reportingService: {
    getSnapshot
  }
}));

import Reporting from '../pages/Reporting';

const baseSnapshot = {
  generatedAt: '2026-03-07T12:00:00.000Z',
  window: '90d',
  fleetReliability: {
    totalWorkOrders: 12,
    backlogWorkOrders: 3,
    overdueWorkOrders: 1,
    mttrDays: 2.4,
    completionRate: 75
  },
  safetyPerformance: {
    totalDrivers: 4,
    averageRiskScore: 58.2,
    highRiskDrivers: 1
  },
  compliancePosture: {
    openActionItems: 6,
    overdueRemediations: 1,
    requiredDocumentGaps: 2,
    criticalCredentials: 1
  },
  trainingCompletion: {
    totalAssignments: 8,
    completedAssignments: 5,
    overdueAssignments: 2,
    completionRate: 62.5
  },
  cohortReporting: {
    riskBandCohorts: [],
    defectRecurrence: {
      inspectionLinkedOrders: 0,
      recurringInspectionGroups: 0,
      recurringOrders: 0,
      recurrenceRate: 0
    }
  },
  trends: [],
  kpiDefinitions: []
};

describe('Reporting page', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.role = 'readonly';
    getSnapshot.mockResolvedValue(baseSnapshot);
  });

  it('renders readonly users as read-only for saved views and schedules', async () => {
    render(
      <MemoryRouter>
        <Reporting />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Reporting & Analytics/i })).toBeInTheDocument();
    expect(screen.getByText(/Readonly role has read-only access to saved views and schedules/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Current View/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Save Schedule/i })).toBeDisabled();
  });

  it('allows safety users to manage reporting preferences', async () => {
    authState.role = 'safety';

    render(
      <MemoryRouter>
        <Reporting />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Reporting & Analytics/i })).toBeInTheDocument();
    expect(screen.queryByText(/read-only access to saved views and schedules/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Current View/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Save Schedule/i })).toBeEnabled();
  });
});
