import { describe, expect, it } from 'vitest';
import type { FeedbackEntry } from '../services/feedbackService';
import type { ReportingSnapshot } from '../services/reportingService';

const buildReportingSnapshot = (overrides: Partial<ReportingSnapshot> = {}): ReportingSnapshot => ({
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
  kpiDefinitions: [],
  ...overrides
});

const buildFeedbackEntry = (overrides: Partial<FeedbackEntry> = {}): FeedbackEntry => ({
  id: 'fb-1',
  category: 'Operations',
  priority: 'High',
  message: 'Dispatch board data looks wrong',
  status: 'Open',
  createdAt: '2026-03-07T09:00:00.000Z',
  submitterEmail: 'ops@example.com',
  ...overrides
});

describe('hypercareService', () => {
  it('elevates launch blockers into an escalate status', async () => {
    const { createHypercareService } = await import('../services/hypercareService');
    const service = createHypercareService({
      getReportingSnapshot: async () => buildReportingSnapshot(),
      listFeedback: async () => [
        buildFeedbackEntry(),
        buildFeedbackEntry({
          id: 'fb-2',
          priority: 'Medium',
          status: 'In Review'
        })
      ],
      now: () => new Date('2026-03-07T12:15:00.000Z')
    });

    const snapshot = await service.getSnapshot();

    expect(snapshot.overallStatus).toBe('Escalate');
    expect(snapshot.feedbackSummary.totalOpen).toBe(1);
    expect(snapshot.feedbackSummary.highPriorityOpen).toBe(1);
    expect(snapshot.activeTriggers.map((trigger) => trigger.id)).toEqual([
      'compliance_pressure',
      'high_priority_feedback',
      'training_overdue',
      'driver_risk_watch'
    ]);
  });

  it('returns a stable status when no launch triggers are active', async () => {
    const { createHypercareService } = await import('../services/hypercareService');
    const service = createHypercareService({
      getReportingSnapshot: async () => buildReportingSnapshot({
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
        }
      }),
      listFeedback: async () => [
        buildFeedbackEntry({
          id: 'fb-3',
          priority: 'Low',
          status: 'Closed'
        })
      ],
      now: () => new Date('2026-03-07T12:15:00.000Z')
    });

    const snapshot = await service.getSnapshot();

    expect(snapshot.overallStatus).toBe('Stable');
    expect(snapshot.feedbackSummary.totalOpen).toBe(0);
    expect(snapshot.feedbackSummary.byStatus.Open).toBe(0);
    expect(snapshot.activeTriggers).toHaveLength(0);
  });
});
