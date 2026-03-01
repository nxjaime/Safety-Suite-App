import { describe, expect, it } from 'vitest';
import { createReportingService } from '../services/reportingService';

describe('reportingService', () => {
  it('builds unified KPI snapshot across fleet, safety, compliance, and training', async () => {
    const service = createReportingService({
      getWorkOrders: async () => ([
        { id: 'wo-1', status: 'Completed', inspectionId: 'i-1', createdAt: '2026-02-01T00:00:00.000Z', completedAt: '2026-02-03T00:00:00.000Z' },
        { id: 'wo-2', status: 'Closed', inspectionId: 'i-1', createdAt: '2026-02-10T00:00:00.000Z', completedAt: '2026-02-15T00:00:00.000Z' },
        { id: 'wo-3', status: 'In Progress', dueDate: '2026-02-05' }
      ] as any),
      getBacklogCount: () => 1,
      getOverdueCount: () => 1,
      getMTTRDays: () => 3.5,
      fetchDrivers: async () => ([
        { id: 'd1', riskScore: 85 },
        { id: 'd2', riskScore: 65 }
      ]),
      getComplianceSnapshot: async () => ({
        actionQueue: [{ id: 'a1' }, { id: 'a2' }],
        overdueRemediations: 2,
        requiredDocumentGaps: [{ id: 'gap-1' }],
        expiringCredentials: [{ id: 'cred-1', status: 'Critical' }, { id: 'cred-2', status: 'Warning' }]
      }),
      listAssignments: async () => ([
        { id: 'ta-1', status: 'Completed', completed_at: '2026-02-14T00:00:00.000Z' },
        { id: 'ta-2', status: 'Overdue', due_date: '2026-02-01' },
        { id: 'ta-3', status: 'Active', due_date: '2026-03-30' }
      ] as any),
      now: () => new Date('2026-03-01T00:00:00.000Z')
    });

    const snapshot = await service.getSnapshot('90d');

    expect(snapshot.fleetReliability.totalWorkOrders).toBe(3);
    expect(snapshot.fleetReliability.backlogWorkOrders).toBe(1);
    expect(snapshot.fleetReliability.overdueWorkOrders).toBe(1);
    expect(snapshot.fleetReliability.mttrDays).toBe(3.5);
    expect(snapshot.fleetReliability.completionRate).toBe(66.7);

    expect(snapshot.safetyPerformance.totalDrivers).toBe(2);
    expect(snapshot.safetyPerformance.averageRiskScore).toBe(75);
    expect(snapshot.safetyPerformance.highRiskDrivers).toBe(1);

    expect(snapshot.compliancePosture.openActionItems).toBe(2);
    expect(snapshot.compliancePosture.overdueRemediations).toBe(2);
    expect(snapshot.compliancePosture.requiredDocumentGaps).toBe(1);
    expect(snapshot.compliancePosture.criticalCredentials).toBe(1);

    expect(snapshot.trainingCompletion.totalAssignments).toBe(3);
    expect(snapshot.trainingCompletion.completedAssignments).toBe(1);
    expect(snapshot.trainingCompletion.overdueAssignments).toBe(1);
    expect(snapshot.trainingCompletion.completionRate).toBe(33.3);

    expect(snapshot.cohortReporting.riskBandCohorts.find((bucket) => bucket.band === 'red')?.drivers).toBe(1);
    expect(snapshot.cohortReporting.riskBandCohorts.find((bucket) => bucket.band === 'yellow')?.drivers).toBe(1);
    expect(snapshot.cohortReporting.defectRecurrence.inspectionLinkedOrders).toBe(2);
    expect(snapshot.cohortReporting.defectRecurrence.recurringInspectionGroups).toBe(1);
    expect(snapshot.cohortReporting.defectRecurrence.recurringOrders).toBe(2);
    expect(snapshot.cohortReporting.defectRecurrence.recurrenceRate).toBe(100);

    expect(snapshot.trends.length).toBe(6);
    expect(snapshot.kpiDefinitions.length).toBeGreaterThan(0);
  });
});
