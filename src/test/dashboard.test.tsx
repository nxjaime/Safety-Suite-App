import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ role: 'safety' }),
}));

vi.mock('../services/reportingService', () => ({
  reportingService: {
    getSnapshot: vi.fn().mockResolvedValue({
      generatedAt: '2026-05-03T00:00:00.000Z',
      window: '90d',
      fleetReliability: { totalWorkOrders: 10, backlogWorkOrders: 2, overdueWorkOrders: 1, mttrDays: 3, completionRate: 82 },
      safetyPerformance: { totalDrivers: 4, averageRiskScore: 41, highRiskDrivers: 1 },
      compliancePosture: { openActionItems: 2, overdueRemediations: 1, requiredDocumentGaps: 0, criticalCredentials: 0 },
      trainingCompletion: { totalAssignments: 8, completedAssignments: 7, overdueAssignments: 1, completionRate: 88 },
      cohortReporting: { riskBandCohorts: [], defectRecurrence: { inspectionLinkedOrders: 0, recurringInspectionGroups: 0, recurringOrders: 0, recurrenceRate: 0 } },
      trends: [
        { month: '2026-04', completedWorkOrders: 2, completedTraining: 3 },
        { month: '2026-05', completedWorkOrders: 4, completedTraining: 1 },
      ],
      kpiDefinitions: [],
    }),
  },
}));

vi.mock('../services/equipmentService', () => ({
  equipmentService: {
    getEquipment: vi.fn().mockResolvedValue([
      { id: 'eq-1', status: 'active' },
      { id: 'eq-2', status: 'maintenance' },
    ]),
  },
}));

import Dashboard from '../pages/Dashboard';

beforeEach(() => {
  window.localStorage.clear();
});

describe('Dashboard personalization', () => {
  it('shows role-aware widgets and dashboard controls', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Operations Pulse')).toBeInTheDocument();
    expect(screen.getByText('Dashboard controls')).toBeInTheDocument();
    expect(screen.getByText('Completed Work Orders & Training')).toBeInTheDocument();
    expect(screen.getByText('Fleet Composition')).toBeInTheDocument();
    expect(screen.getByText('Backlog Prioritization')).toBeInTheDocument();
  });

  it('persists hidden widgets in localStorage', async () => {
    render(<Dashboard />);
    await screen.findByText('Operations Pulse');

    fireEvent.click(screen.getAllByTitle('Hide')[0]);

    const stored = JSON.parse(window.localStorage.getItem('safety-suite.dashboard-prefs') || '{}');
    expect(stored.safety.hidden).toContain('kpis');
  });
});
