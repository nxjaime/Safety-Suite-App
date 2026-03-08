import { describe, it, expect } from 'vitest';
import { createDashboardService } from '../services/dashboardService';
import type { ReportingSnapshot } from '../services/reportingService';
import type { Equipment } from '../types';

const makeSnapshot = (overrides: Partial<ReportingSnapshot> = {}): ReportingSnapshot => ({
  generatedAt: '2025-01-15T00:00:00.000Z',
  window: '90d',
  fleetReliability: {
    totalWorkOrders: 10,
    backlogWorkOrders: 2,
    overdueWorkOrders: 1,
    mttrDays: 3.5,
    completionRate: 80,
  },
  safetyPerformance: {
    totalDrivers: 5,
    averageRiskScore: 45,
    highRiskDrivers: 1,
  },
  compliancePosture: {
    openActionItems: 3,
    overdueRemediations: 1,
    requiredDocumentGaps: 0,
    criticalCredentials: 0,
  },
  trainingCompletion: {
    totalAssignments: 8,
    completedAssignments: 6,
    overdueAssignments: 1,
    completionRate: 75,
  },
  cohortReporting: {
    riskBandCohorts: [
      { band: 'green', drivers: 3, avgScore: 25 },
      { band: 'yellow', drivers: 1, avgScore: 60 },
      { band: 'red', drivers: 1, avgScore: 85 },
    ],
    defectRecurrence: {
      inspectionLinkedOrders: 2,
      recurringInspectionGroups: 0,
      recurringOrders: 0,
      recurrenceRate: 0,
    },
  },
  trends: [
    { month: '2025-01', completedWorkOrders: 3, completedTraining: 2 },
    { month: '2024-12', completedWorkOrders: 5, completedTraining: 4 },
  ],
  kpiDefinitions: [],
  ...overrides,
});

const makeEquipment = (overrides: Partial<Equipment> = {}): Equipment => ({
  id: 'eq-1',
  assetTag: 'TRK-001',
  type: 'truck',
  ownershipType: 'owned',
  status: 'active',
  ...overrides,
});

describe('dashboardService', () => {
  it('returns a snapshot with four KPI cards', async () => {
    const service = createDashboardService({
      getReportingSnapshot: async () => makeSnapshot(),
      getEquipment: async () => [makeEquipment()],
      now: () => new Date('2025-01-15T12:00:00Z'),
    });

    const snap = await service.getSnapshot('90d');

    expect(snap.kpis).toHaveLength(4);
    expect(snap.kpis.map((k) => k.key)).toEqual([
      'fleet_completion',
      'avg_risk_score',
      'compliance_actions',
      'training_rate',
    ]);
  });

  it('calculates fleet composition from equipment list', async () => {
    const equipment: Equipment[] = [
      makeEquipment({ id: '1', status: 'active' }),
      makeEquipment({ id: '2', status: 'active' }),
      makeEquipment({ id: '3', status: 'maintenance' }),
      makeEquipment({ id: '4', status: 'out_of_service' }),
    ];

    const service = createDashboardService({
      getReportingSnapshot: async () => makeSnapshot(),
      getEquipment: async () => equipment,
      now: () => new Date('2025-01-15T12:00:00Z'),
    });

    const snap = await service.getSnapshot();

    expect(snap.fleetComposition).toEqual({
      active: 2,
      outOfService: 1,
      maintenance: 1,
      total: 4,
    });
  });

  it('marks fleet_completion as critical when below 60%', async () => {
    const service = createDashboardService({
      getReportingSnapshot: async () =>
        makeSnapshot({ fleetReliability: { totalWorkOrders: 10, backlogWorkOrders: 5, overdueWorkOrders: 3, mttrDays: 5, completionRate: 55 } }),
      getEquipment: async () => [],
      now: () => new Date('2025-01-15T12:00:00Z'),
    });

    const snap = await service.getSnapshot();
    const fleetCard = snap.kpis.find((k) => k.key === 'fleet_completion');
    expect(fleetCard?.status).toBe('critical');
  });

  it('marks avg_risk_score as critical when ≥70', async () => {
    const service = createDashboardService({
      getReportingSnapshot: async () =>
        makeSnapshot({ safetyPerformance: { totalDrivers: 3, averageRiskScore: 75, highRiskDrivers: 2 } }),
      getEquipment: async () => [],
      now: () => new Date('2025-01-15T12:00:00Z'),
    });

    const snap = await service.getSnapshot();
    const riskCard = snap.kpis.find((k) => k.key === 'avg_risk_score');
    expect(riskCard?.status).toBe('critical');
  });

  it('populates recent activity based on snapshot data', async () => {
    const service = createDashboardService({
      getReportingSnapshot: async () =>
        makeSnapshot({
          fleetReliability: { totalWorkOrders: 10, backlogWorkOrders: 3, overdueWorkOrders: 2, mttrDays: 3, completionRate: 70 },
          trainingCompletion: { totalAssignments: 5, completedAssignments: 3, overdueAssignments: 2, completionRate: 60 },
        }),
      getEquipment: async () => [],
      now: () => new Date('2025-01-15T12:00:00Z'),
    });

    const snap = await service.getSnapshot();

    const labels = snap.recentActivity.map((a) => a.label);
    expect(labels).toContain('Work order backlog');
    expect(labels).toContain('Overdue work orders');
    expect(labels).toContain('Overdue training');
  });

  it('sets generatedAt and window on the snapshot', async () => {
    const now = new Date('2025-01-15T09:30:00Z');
    const service = createDashboardService({
      getReportingSnapshot: async () => makeSnapshot(),
      getEquipment: async () => [],
      now: () => now,
    });

    const snap = await service.getSnapshot('30d');

    expect(snap.generatedAt).toBe(now.toISOString());
    expect(snap.window).toBe('30d');
  });
});
