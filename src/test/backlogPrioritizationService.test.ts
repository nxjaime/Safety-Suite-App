import { describe, it, expect } from 'vitest';
import { buildBacklog } from '../services/backlogPrioritizationService';
import type { ReportingSnapshot } from '../services/reportingService';

const baseSnapshot: ReportingSnapshot = {
  generatedAt: '2025-01-15T00:00:00.000Z',
  window: '90d',
  fleetReliability: {
    totalWorkOrders: 10,
    backlogWorkOrders: 0,
    overdueWorkOrders: 0,
    mttrDays: 3,
    completionRate: 90,
  },
  safetyPerformance: {
    totalDrivers: 5,
    averageRiskScore: 30,
    highRiskDrivers: 0,
  },
  compliancePosture: {
    openActionItems: 2,
    overdueRemediations: 0,
    requiredDocumentGaps: 0,
    criticalCredentials: 0,
  },
  trainingCompletion: {
    totalAssignments: 8,
    completedAssignments: 7,
    overdueAssignments: 0,
    completionRate: 87.5,
  },
  cohortReporting: {
    riskBandCohorts: [
      { band: 'green', drivers: 5, avgScore: 25 },
      { band: 'yellow', drivers: 0, avgScore: 0 },
      { band: 'red', drivers: 0, avgScore: 0 },
    ],
    defectRecurrence: {
      inspectionLinkedOrders: 0,
      recurringInspectionGroups: 0,
      recurringOrders: 0,
      recurrenceRate: 0,
    },
  },
  trends: [],
  kpiDefinitions: [],
};

describe('backlogPrioritizationService', () => {
  it('returns empty backlog when all metrics are healthy', () => {
    const items = buildBacklog(baseSnapshot);
    expect(items).toHaveLength(0);
  });

  it('creates a fleet item for overdue work orders', () => {
    const snapshot: ReportingSnapshot = {
      ...baseSnapshot,
      fleetReliability: {
        ...baseSnapshot.fleetReliability,
        overdueWorkOrders: 3,
      },
    };
    const items = buildBacklog(snapshot);
    const fleetItems = items.filter((i) => i.domain === 'fleet');
    expect(fleetItems.length).toBeGreaterThanOrEqual(1);
    expect(fleetItems[0].title).toBe('Overdue work orders');
  });

  it('creates a safety item for high-risk drivers', () => {
    const snapshot: ReportingSnapshot = {
      ...baseSnapshot,
      safetyPerformance: {
        totalDrivers: 10,
        averageRiskScore: 40,
        highRiskDrivers: 3,
      },
    };
    const items = buildBacklog(snapshot);
    const safetyItems = items.filter((i) => i.domain === 'safety');
    expect(safetyItems.length).toBeGreaterThanOrEqual(1);
    expect(safetyItems[0].title).toBe('High-risk drivers');
  });

  it('creates a compliance item for overdue remediations', () => {
    const snapshot: ReportingSnapshot = {
      ...baseSnapshot,
      compliancePosture: {
        ...baseSnapshot.compliancePosture,
        overdueRemediations: 2,
      },
    };
    const items = buildBacklog(snapshot);
    const complianceItems = items.filter((i) => i.domain === 'compliance');
    expect(complianceItems.length).toBeGreaterThanOrEqual(1);
    expect(complianceItems[0].title).toBe('Overdue compliance remediations');
  });

  it('creates a training item for overdue assignments', () => {
    const snapshot: ReportingSnapshot = {
      ...baseSnapshot,
      trainingCompletion: {
        ...baseSnapshot.trainingCompletion,
        overdueAssignments: 4,
      },
    };
    const items = buildBacklog(snapshot);
    const trainingItems = items.filter((i) => i.domain === 'training');
    expect(trainingItems.length).toBeGreaterThanOrEqual(1);
    expect(trainingItems[0].title).toBe('Overdue training assignments');
  });

  it('sorts items by score descending', () => {
    const snapshot: ReportingSnapshot = {
      ...baseSnapshot,
      fleetReliability: {
        ...baseSnapshot.fleetReliability,
        overdueWorkOrders: 1,
        backlogWorkOrders: 2,
      },
      safetyPerformance: {
        totalDrivers: 10,
        averageRiskScore: 55,
        highRiskDrivers: 5,
      },
      trainingCompletion: {
        totalAssignments: 10,
        completedAssignments: 5,
        overdueAssignments: 3,
        completionRate: 50,
      },
    };
    const items = buildBacklog(snapshot);
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].score).toBeGreaterThanOrEqual(items[i].score);
    }
  });

  it('assigns severity based on score thresholds', () => {
    const snapshot: ReportingSnapshot = {
      ...baseSnapshot,
      fleetReliability: {
        ...baseSnapshot.fleetReliability,
        overdueWorkOrders: 5, // score = 50 + 5*10 = 100 -> critical
      },
    };
    const items = buildBacklog(snapshot);
    const overdueItem = items.find((i) => i.title === 'Overdue work orders');
    expect(overdueItem?.severity).toBe('critical');
  });
});
