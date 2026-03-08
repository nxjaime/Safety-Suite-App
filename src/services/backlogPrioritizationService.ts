/**
 * Backlog Prioritization Service
 *
 * Consumes the reporting snapshot to surface and rank operational action items
 * across fleet, safety, compliance, and training domains. Each item gets a
 * weighted priority score so executives and managers can triage work top-down.
 */
import type { ReportingSnapshot } from './reportingService';

export type BacklogDomain = 'fleet' | 'safety' | 'compliance' | 'training';
export type BacklogSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface BacklogItem {
  id: string;
  domain: BacklogDomain;
  severity: BacklogSeverity;
  score: number;          // 0-100 weighted priority
  title: string;
  detail: string;
  metric: string;
  suggestedAction: string;
}

const severityFromScore = (score: number): BacklogSeverity => {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
};

let idCounter = 0;
const nextId = (): string => {
  idCounter += 1;
  return `bl-${idCounter}`;
};

export const buildBacklog = (snapshot: ReportingSnapshot): BacklogItem[] => {
  idCounter = 0;
  const items: BacklogItem[] = [];

  // --- Fleet reliability ---
  const { overdueWorkOrders, backlogWorkOrders, completionRate } = snapshot.fleetReliability;

  if (overdueWorkOrders > 0) {
    const score = Math.min(100, 50 + overdueWorkOrders * 10);
    items.push({
      id: nextId(),
      domain: 'fleet',
      severity: severityFromScore(score),
      score,
      title: 'Overdue work orders',
      detail: `${overdueWorkOrders} work orders are past their due date.`,
      metric: `${overdueWorkOrders} overdue`,
      suggestedAction: 'Review and reassign overdue orders; escalate if blocking equipment availability.',
    });
  }

  if (backlogWorkOrders > 0) {
    const score = Math.min(100, 30 + backlogWorkOrders * 8);
    items.push({
      id: nextId(),
      domain: 'fleet',
      severity: severityFromScore(score),
      score,
      title: 'Work order backlog',
      detail: `${backlogWorkOrders} work orders are in open / in-progress backlog.`,
      metric: `${backlogWorkOrders} backlog`,
      suggestedAction: 'Triage backlog; prioritise safety-critical equipment first.',
    });
  }

  if (completionRate < 80) {
    const distance = 80 - completionRate;
    const score = Math.min(100, 40 + distance * 1.5);
    items.push({
      id: nextId(),
      domain: 'fleet',
      severity: severityFromScore(score),
      score: Math.round(score),
      title: 'Low fleet WO completion rate',
      detail: `Completion rate is ${completionRate}%, below the 80% target.`,
      metric: `${completionRate}% completion`,
      suggestedAction: 'Investigate bottlenecks; ensure adequate technician staffing.',
    });
  }

  // --- Safety performance ---
  const { averageRiskScore, highRiskDrivers, totalDrivers } = snapshot.safetyPerformance;

  if (highRiskDrivers > 0) {
    const ratio = totalDrivers > 0 ? highRiskDrivers / totalDrivers : 0;
    const score = Math.min(100, 60 + ratio * 100);
    items.push({
      id: nextId(),
      domain: 'safety',
      severity: severityFromScore(Math.round(score)),
      score: Math.round(score),
      title: 'High-risk drivers',
      detail: `${highRiskDrivers} of ${totalDrivers} drivers are in the high-risk band (≥80).`,
      metric: `${highRiskDrivers} high-risk`,
      suggestedAction: 'Initiate coaching plans; review recent risk events for root causes.',
    });
  }

  if (averageRiskScore >= 50) {
    const score = Math.min(100, averageRiskScore);
    items.push({
      id: nextId(),
      domain: 'safety',
      severity: severityFromScore(score),
      score,
      title: 'Elevated average risk score',
      detail: `Average driver risk score is ${averageRiskScore}, above the 50-point threshold.`,
      metric: `${averageRiskScore} avg score`,
      suggestedAction: 'Analyse risk event sources; schedule targeted safety training.',
    });
  }

  // --- Compliance posture ---
  const { openActionItems, overdueRemediations, criticalCredentials } = snapshot.compliancePosture;

  if (overdueRemediations > 0) {
    const score = Math.min(100, 60 + overdueRemediations * 12);
    items.push({
      id: nextId(),
      domain: 'compliance',
      severity: severityFromScore(score),
      score: Math.min(score, 100),
      title: 'Overdue compliance remediations',
      detail: `${overdueRemediations} compliance remediations are past their deadline.`,
      metric: `${overdueRemediations} overdue`,
      suggestedAction: 'Escalate to compliance officer; document reasons for delay.',
    });
  }

  if (criticalCredentials > 0) {
    const score = Math.min(100, 55 + criticalCredentials * 15);
    items.push({
      id: nextId(),
      domain: 'compliance',
      severity: severityFromScore(score),
      score: Math.min(score, 100),
      title: 'Critical credentials expiring',
      detail: `${criticalCredentials} driver credentials are expiring soon or already expired.`,
      metric: `${criticalCredentials} critical`,
      suggestedAction: 'Notify affected drivers; schedule renewal appointments.',
    });
  }

  if (openActionItems > 5) {
    const score = Math.min(100, 25 + openActionItems * 5);
    items.push({
      id: nextId(),
      domain: 'compliance',
      severity: severityFromScore(score),
      score: Math.min(score, 100),
      title: 'Open compliance action items',
      detail: `${openActionItems} compliance actions remain open.`,
      metric: `${openActionItems} open`,
      suggestedAction: 'Distribute among compliance team; set follow-up deadlines.',
    });
  }

  // --- Training completion ---
  const { overdueAssignments, completionRate: trainingRate } = snapshot.trainingCompletion;

  if (overdueAssignments > 0) {
    const score = Math.min(100, 45 + overdueAssignments * 10);
    items.push({
      id: nextId(),
      domain: 'training',
      severity: severityFromScore(score),
      score: Math.min(score, 100),
      title: 'Overdue training assignments',
      detail: `${overdueAssignments} training assignments are past due.`,
      metric: `${overdueAssignments} overdue`,
      suggestedAction: 'Send reminders; consider mandatory scheduling for persistent overdue items.',
    });
  }

  if (trainingRate < 70) {
    const distance = 70 - trainingRate;
    const score = Math.min(100, 35 + distance * 1.2);
    items.push({
      id: nextId(),
      domain: 'training',
      severity: severityFromScore(Math.round(score)),
      score: Math.round(score),
      title: 'Low training completion rate',
      detail: `Training completion rate is ${trainingRate}%, below the 70% target.`,
      metric: `${trainingRate}% completion`,
      suggestedAction: 'Review assignment workload; extend deadlines where appropriate.',
    });
  }

  // sort descending by score
  items.sort((a, b) => b.score - a.score);

  return items;
};
