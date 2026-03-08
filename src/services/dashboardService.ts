import type { ReportingSnapshot, ReportingWindow } from './reportingService';
import type { Equipment } from '../types';

export interface DashboardKpiCard {
  key: string;
  label: string;
  value: string;
  detail: string;
  status: 'good' | 'warn' | 'critical';
}

export interface DashboardSnapshot {
  generatedAt: string;
  window: ReportingWindow;
  kpis: DashboardKpiCard[];
  fleetComposition: {
    active: number;
    outOfService: number;
    maintenance: number;
    total: number;
  };
  safetyTrend: Array<{
    month: string;
    averageRisk: number;
    highRiskCount: number;
  }>;
  recentActivity: Array<{
    type: 'work_order' | 'training' | 'compliance' | 'safety';
    label: string;
    detail: string;
  }>;
}

export type DashboardDeps = {
  getReportingSnapshot: (window?: ReportingWindow) => Promise<ReportingSnapshot>;
  getEquipment: () => Promise<Equipment[]>;
  now: () => Date;
};

const statusFromThreshold = (value: number, warn: number, critical: number, invert = false): DashboardKpiCard['status'] => {
  if (invert) {
    if (value >= critical) return 'critical';
    if (value >= warn) return 'warn';
    return 'good';
  }
  if (value <= critical) return 'critical';
  if (value <= warn) return 'warn';
  return 'good';
};

export const createDashboardService = (deps: DashboardDeps) => {
  return {
    async getSnapshot(window: ReportingWindow = '90d'): Promise<DashboardSnapshot> {
      const [reporting, equipment] = await Promise.all([
        deps.getReportingSnapshot(window),
        deps.getEquipment(),
      ]);

      const kpis: DashboardKpiCard[] = [
        {
          key: 'fleet_completion',
          label: 'Fleet WO Completion',
          value: `${reporting.fleetReliability.completionRate}%`,
          detail: `${reporting.fleetReliability.backlogWorkOrders} backlog · ${reporting.fleetReliability.overdueWorkOrders} overdue`,
          status: statusFromThreshold(reporting.fleetReliability.completionRate, 80, 60),
        },
        {
          key: 'avg_risk_score',
          label: 'Avg Driver Risk',
          value: String(reporting.safetyPerformance.averageRiskScore),
          detail: `${reporting.safetyPerformance.highRiskDrivers} high-risk of ${reporting.safetyPerformance.totalDrivers} drivers`,
          status: statusFromThreshold(reporting.safetyPerformance.averageRiskScore, 50, 70, true),
        },
        {
          key: 'compliance_actions',
          label: 'Open Compliance',
          value: String(reporting.compliancePosture.openActionItems),
          detail: `${reporting.compliancePosture.overdueRemediations} overdue · ${reporting.compliancePosture.criticalCredentials} critical creds`,
          status: statusFromThreshold(reporting.compliancePosture.openActionItems, 3, 8, true),
        },
        {
          key: 'training_rate',
          label: 'Training Completion',
          value: `${reporting.trainingCompletion.completionRate}%`,
          detail: `${reporting.trainingCompletion.overdueAssignments} overdue of ${reporting.trainingCompletion.totalAssignments} total`,
          status: statusFromThreshold(reporting.trainingCompletion.completionRate, 80, 60),
        },
      ];

      const fleetComposition = {
        active: equipment.filter((e) => e.status === 'active').length,
        outOfService: equipment.filter((e) => e.status === 'out_of_service').length,
        maintenance: equipment.filter((e) => e.status === 'maintenance').length,
        total: equipment.length,
      };

      // Build safety trend from risk band cohorts (month-level not available from reporting yet,
      // so we derive a summary-level point from the current snapshot and trend data)
      const safetyTrend = reporting.trends.map((point) => {
        // We don't have per-month risk scores, so provide a placeholder structure linked to trends
        return {
          month: point.month,
          averageRisk: reporting.safetyPerformance.averageRiskScore,
          highRiskCount: reporting.safetyPerformance.highRiskDrivers,
        };
      });

      // Build recent activity from snapshot data
      const recentActivity: DashboardSnapshot['recentActivity'] = [];

      if (reporting.fleetReliability.backlogWorkOrders > 0) {
        recentActivity.push({
          type: 'work_order',
          label: 'Work order backlog',
          detail: `${reporting.fleetReliability.backlogWorkOrders} orders in backlog`,
        });
      }
      if (reporting.fleetReliability.overdueWorkOrders > 0) {
        recentActivity.push({
          type: 'work_order',
          label: 'Overdue work orders',
          detail: `${reporting.fleetReliability.overdueWorkOrders} orders past due date`,
        });
      }
      if (reporting.trainingCompletion.overdueAssignments > 0) {
        recentActivity.push({
          type: 'training',
          label: 'Overdue training',
          detail: `${reporting.trainingCompletion.overdueAssignments} assignments overdue`,
        });
      }
      if (reporting.compliancePosture.overdueRemediations > 0) {
        recentActivity.push({
          type: 'compliance',
          label: 'Overdue remediations',
          detail: `${reporting.compliancePosture.overdueRemediations} compliance remediations past due`,
        });
      }
      if (reporting.safetyPerformance.highRiskDrivers > 0) {
        recentActivity.push({
          type: 'safety',
          label: 'High-risk drivers',
          detail: `${reporting.safetyPerformance.highRiskDrivers} drivers in high-risk band`,
        });
      }
      if (reporting.compliancePosture.criticalCredentials > 0) {
        recentActivity.push({
          type: 'compliance',
          label: 'Critical credentials',
          detail: `${reporting.compliancePosture.criticalCredentials} credentials expiring soon`,
        });
      }

      return {
        generatedAt: deps.now().toISOString(),
        window,
        kpis,
        fleetComposition,
        safetyTrend,
        recentActivity,
      };
    },
  };
};
