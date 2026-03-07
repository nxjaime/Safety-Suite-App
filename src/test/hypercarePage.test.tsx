import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

const { getSnapshot } = vi.hoisted(() => ({
  getSnapshot: vi.fn()
}));

vi.mock('../services/hypercareService', () => ({
  hypercareService: {
    getSnapshot
  }
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ role: 'full' })
}));

import Hypercare from '../pages/Hypercare';

describe('Hypercare page', () => {
  it('renders launch status, feedback backlog, and active triggers', async () => {
    getSnapshot.mockResolvedValueOnce({
      generatedAt: '2026-03-07T12:00:00.000Z',
      overallStatus: 'Escalate',
      feedbackSummary: {
        totalOpen: 2,
        highPriorityOpen: 1,
        byStatus: {
          Open: 2,
          'In Review': 1,
          Planned: 0,
          Closed: 4
        },
        byPriority: {
          Low: 1,
          Medium: 1,
          High: 1
        }
      },
      reportingSnapshot: {
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
      },
      activeTriggers: [
        {
          id: 'compliance_pressure',
          severity: 'critical',
          title: 'Compliance pressure requires escalation',
          reason: '1 overdue remediation'
        }
      ]
    });

    render(
      <MemoryRouter>
        <Hypercare />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Hypercare Command Center/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Rollout Cohorts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Daily Reviews/i })).toBeInTheDocument();
    expect(screen.getAllByText(/^Escalate$/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Open feedback items/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliance pressure requires escalation/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Reporting Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Help & Feedback/i })).toBeInTheDocument();
  });

  it('renders a stable empty trigger state', async () => {
    getSnapshot.mockResolvedValueOnce({
      generatedAt: '2026-03-07T12:00:00.000Z',
      overallStatus: 'Stable',
      feedbackSummary: {
        totalOpen: 0,
        highPriorityOpen: 0,
        byStatus: {
          Open: 0,
          'In Review': 0,
          Planned: 0,
          Closed: 4
        },
        byPriority: {
          Low: 1,
          Medium: 0,
          High: 0
        }
      },
      reportingSnapshot: {
        generatedAt: '2026-03-07T12:00:00.000Z',
        window: '90d',
        fleetReliability: {
          totalWorkOrders: 12,
          backlogWorkOrders: 0,
          overdueWorkOrders: 0,
          mttrDays: 2.4,
          completionRate: 100
        },
        safetyPerformance: {
          totalDrivers: 4,
          averageRiskScore: 31.2,
          highRiskDrivers: 0
        },
        compliancePosture: {
          openActionItems: 0,
          overdueRemediations: 0,
          requiredDocumentGaps: 0,
          criticalCredentials: 0
        },
        trainingCompletion: {
          totalAssignments: 8,
          completedAssignments: 8,
          overdueAssignments: 0,
          completionRate: 100
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
      },
      activeTriggers: []
    });

    render(
      <MemoryRouter>
        <Hypercare />
      </MemoryRouter>
    );

    expect(await screen.findByText(/No active escalation triggers/i)).toBeInTheDocument();
    expect(screen.getByText(/No rollout cohorts configured yet/i)).toBeInTheDocument();
    expect(screen.getByText(/No daily reviews logged yet/i)).toBeInTheDocument();
  });
});
