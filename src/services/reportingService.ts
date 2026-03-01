import { getComplianceSnapshot } from './complianceService';
import { driverService } from './driverService';
import { trainingService } from './trainingService';
import { workOrderService } from './workOrderService';
import type { TrainingAssignment, WorkOrder } from '../types';

export type ReportingWindow = '30d' | '90d' | '365d';

export interface ReportingTrendPoint {
  month: string;
  completedWorkOrders: number;
  completedTraining: number;
}

export interface KpiDefinition {
  key: string;
  label: string;
  definition: string;
  formula: string;
}

export interface ReportingSnapshot {
  generatedAt: string;
  window: ReportingWindow;
  fleetReliability: {
    totalWorkOrders: number;
    backlogWorkOrders: number;
    overdueWorkOrders: number;
    mttrDays: number | null;
    completionRate: number;
  };
  safetyPerformance: {
    totalDrivers: number;
    averageRiskScore: number;
    highRiskDrivers: number;
  };
  compliancePosture: {
    openActionItems: number;
    overdueRemediations: number;
    requiredDocumentGaps: number;
    criticalCredentials: number;
  };
  trainingCompletion: {
    totalAssignments: number;
    completedAssignments: number;
    overdueAssignments: number;
    completionRate: number;
  };
  cohortReporting: {
    riskBandCohorts: Array<{
      band: 'green' | 'yellow' | 'red';
      drivers: number;
      avgScore: number;
    }>;
    defectRecurrence: {
      inspectionLinkedOrders: number;
      recurringInspectionGroups: number;
      recurringOrders: number;
      recurrenceRate: number;
    };
  };
  trends: ReportingTrendPoint[];
  kpiDefinitions: KpiDefinition[];
}

type ReportingDeps = {
  getWorkOrders: () => Promise<WorkOrder[]>;
  getBacklogCount: (orders: WorkOrder[]) => number;
  getOverdueCount: (orders: WorkOrder[]) => number;
  getMTTRDays: (orders: WorkOrder[]) => number | null;
  fetchDrivers: () => Promise<any[]>;
  getComplianceSnapshot: () => Promise<any>;
  listAssignments: () => Promise<TrainingAssignment[]>;
  now: () => Date;
};

const KPI_DEFINITIONS: KpiDefinition[] = [
  {
    key: 'fleet_completion_rate',
    label: 'Fleet Work Order Completion Rate',
    definition: 'Share of work orders that reached Completed or Closed.',
    formula: '(Completed + Closed work orders) / Total work orders'
  },
  {
    key: 'fleet_mttr_days',
    label: 'Mean Time To Repair (MTTR)',
    definition: 'Average days from work order creation to completion.',
    formula: 'Average(completed_at - created_at) for Completed/Closed orders'
  },
  {
    key: 'safety_average_risk_score',
    label: 'Average Driver Risk Score',
    definition: 'Average current risk score across all active drivers in scope.',
    formula: 'Sum(driver.riskScore) / Total drivers'
  },
  {
    key: 'compliance_open_action_items',
    label: 'Compliance Open Action Items',
    definition: 'Open compliance queue items requiring action.',
    formula: 'Compliance snapshot actionQueue length'
  },
  {
    key: 'training_completion_rate',
    label: 'Training Completion Rate',
    definition: 'Share of assignments marked completed.',
    formula: 'Completed assignments / Total assignments'
  }
];

const parseWindowDays = (window: ReportingWindow): number => {
  if (window === '30d') return 30;
  if (window === '365d') return 365;
  return 90;
};

const toMonthKey = (isoDate?: string | null): string | null => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const normalizeRate = (num: number, denom: number): number => {
  if (denom <= 0) return 0;
  return Math.round((num / denom) * 1000) / 10;
};

const lastNMonthKeys = (n: number, now: Date): string[] => {
  const result: string[] = [];
  for (let idx = n - 1; idx >= 0; idx -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - idx, 1));
    result.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return result;
};

export const createReportingService = (deps: ReportingDeps) => {
  return {
    async getSnapshot(window: ReportingWindow = '90d'): Promise<ReportingSnapshot> {
      const [orders, drivers, compliance, assignments] = await Promise.all([
        deps.getWorkOrders(),
        deps.fetchDrivers(),
        deps.getComplianceSnapshot(),
        deps.listAssignments()
      ]);

      const totalWorkOrders = orders.length;
      const completedWorkOrders = orders.filter((order) => order.status === 'Completed' || order.status === 'Closed').length;
      const backlogWorkOrders = deps.getBacklogCount(orders);
      const overdueWorkOrders = deps.getOverdueCount(orders);
      const mttrDays = deps.getMTTRDays(orders);

      const totalDrivers = drivers.length;
      const scoreTotal = drivers.reduce((sum, driver) => sum + Number(driver.riskScore || 0), 0);
      const averageRiskScore = totalDrivers > 0 ? Math.round((scoreTotal / totalDrivers) * 10) / 10 : 0;
      const highRiskDrivers = drivers.filter((driver) => Number(driver.riskScore || 0) >= 80).length;

      const completedAssignments = assignments.filter((assignment) => assignment.status === 'Completed').length;
      const now = deps.now();
      const today = now.toISOString().split('T')[0];
      const overdueAssignments = assignments.filter((assignment) => {
        if (assignment.status === 'Completed') return false;
        if (assignment.status === 'Overdue') return true;
        return Boolean(assignment.due_date && assignment.due_date < today);
      }).length;

      const openActionItems = compliance?.actionQueue?.length ?? 0;
      const overdueRemediations = compliance?.overdueRemediations ?? 0;
      const requiredDocumentGaps = compliance?.requiredDocumentGaps?.length ?? 0;
      const criticalCredentials = (compliance?.expiringCredentials || []).filter((item: any) => item.status === 'Critical').length;

      const windowDays = parseWindowDays(window);
      const cutoffDate = new Date(now);
      cutoffDate.setUTCDate(cutoffDate.getUTCDate() - windowDays);
      const cutoffTime = cutoffDate.getTime();

      const monthKeys = lastNMonthKeys(6, now);
      const workOrderByMonth = new Map<string, number>();
      const trainingByMonth = new Map<string, number>();

      orders.forEach((order) => {
        if (!(order.status === 'Completed' || order.status === 'Closed')) return;
        if (!order.completedAt) return;
        const completedTime = new Date(order.completedAt).getTime();
        if (Number.isNaN(completedTime) || completedTime < cutoffTime) return;
        const key = toMonthKey(order.completedAt);
        if (!key) return;
        workOrderByMonth.set(key, (workOrderByMonth.get(key) || 0) + 1);
      });

      assignments.forEach((assignment) => {
        if (assignment.status !== 'Completed' || !assignment.completed_at) return;
        const completedTime = new Date(assignment.completed_at).getTime();
        if (Number.isNaN(completedTime) || completedTime < cutoffTime) return;
        const key = toMonthKey(assignment.completed_at);
        if (!key) return;
        trainingByMonth.set(key, (trainingByMonth.get(key) || 0) + 1);
      });

      const trends: ReportingTrendPoint[] = monthKeys.map((month) => ({
        month,
        completedWorkOrders: workOrderByMonth.get(month) || 0,
        completedTraining: trainingByMonth.get(month) || 0
      }));

      const scoreBuckets: Record<'green' | 'yellow' | 'red', number[]> = {
        green: [],
        yellow: [],
        red: []
      };
      drivers.forEach((driver) => {
        const score = Number(driver.riskScore || 0);
        if (score >= 80) scoreBuckets.red.push(score);
        else if (score >= 50) scoreBuckets.yellow.push(score);
        else scoreBuckets.green.push(score);
      });

      const riskBandCohorts: Array<{ band: 'green' | 'yellow' | 'red'; drivers: number; avgScore: number }> =
        (['green', 'yellow', 'red'] as const).map((band) => {
          const scores = scoreBuckets[band];
          const avgScore = scores.length > 0
            ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10
            : 0;
          return {
            band,
            drivers: scores.length,
            avgScore
          };
        });

      const inspectionLinked = orders.filter((order) => Boolean(order.inspectionId));
      const inspectionGroupCount = inspectionLinked.reduce((acc, order) => {
        const key = String(order.inspectionId);
        acc.set(key, (acc.get(key) || 0) + 1);
        return acc;
      }, new Map<string, number>());

      const recurringInspectionGroups = Array.from(inspectionGroupCount.values()).filter((count) => count > 1).length;
      const recurringOrders = Array.from(inspectionGroupCount.values()).reduce((sum, count) => {
        if (count <= 1) return sum;
        return sum + count;
      }, 0);

      return {
        generatedAt: now.toISOString(),
        window,
        fleetReliability: {
          totalWorkOrders,
          backlogWorkOrders,
          overdueWorkOrders,
          mttrDays,
          completionRate: normalizeRate(completedWorkOrders, totalWorkOrders)
        },
        safetyPerformance: {
          totalDrivers,
          averageRiskScore,
          highRiskDrivers
        },
        compliancePosture: {
          openActionItems,
          overdueRemediations,
          requiredDocumentGaps,
          criticalCredentials
        },
        trainingCompletion: {
          totalAssignments: assignments.length,
          completedAssignments,
          overdueAssignments,
          completionRate: normalizeRate(completedAssignments, assignments.length)
        },
        cohortReporting: {
          riskBandCohorts,
          defectRecurrence: {
            inspectionLinkedOrders: inspectionLinked.length,
            recurringInspectionGroups,
            recurringOrders,
            recurrenceRate: normalizeRate(recurringOrders, inspectionLinked.length)
          }
        },
        trends,
        kpiDefinitions: KPI_DEFINITIONS
      };
    }
  };
};

export const reportingService = createReportingService({
  getWorkOrders: () => workOrderService.getWorkOrders(),
  getBacklogCount: (orders) => workOrderService.getBacklogCount(orders),
  getOverdueCount: (orders) => workOrderService.getOverdueCount(orders),
  getMTTRDays: (orders) => workOrderService.getMTTRDays(orders),
  fetchDrivers: () => driverService.fetchDrivers(),
  getComplianceSnapshot: () => getComplianceSnapshot(),
  listAssignments: () => trainingService.listAssignments(),
  now: () => new Date()
});
