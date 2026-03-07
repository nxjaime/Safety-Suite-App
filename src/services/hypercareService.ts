import { feedbackService, type FeedbackEntry } from './feedbackService';
import { reportingService, type ReportingSnapshot, type ReportingWindow } from './reportingService';

export interface HypercareTrigger {
  id: 'compliance_pressure' | 'high_priority_feedback' | 'training_overdue' | 'driver_risk_watch';
  severity: 'warning' | 'critical';
  title: string;
  reason: string;
}

export interface HypercareSnapshot {
  activeTriggers: HypercareTrigger[];
  feedbackSummary: {
    byPriority: Record<'Low' | 'Medium' | 'High', number>;
    byStatus: Record<'Open' | 'In Review' | 'Planned' | 'Closed', number>;
    highPriorityOpen: number;
    totalOpen: number;
  };
  generatedAt: string;
  overallStatus: 'Stable' | 'Monitor' | 'Escalate';
  reportingSnapshot: ReportingSnapshot;
}

type HypercareDeps = {
  getReportingSnapshot: (window?: ReportingWindow) => Promise<ReportingSnapshot>;
  listFeedback: () => Promise<FeedbackEntry[]>;
  now: () => Date;
};

const summarizeFeedback = (entries: FeedbackEntry[]) => {
  const byPriority: Record<'Low' | 'Medium' | 'High', number> = {
    Low: 0,
    Medium: 0,
    High: 0
  };
  const byStatus: Record<'Open' | 'In Review' | 'Planned' | 'Closed', number> = {
    Open: 0,
    'In Review': 0,
    Planned: 0,
    Closed: 0
  };

  for (const entry of entries) {
    byPriority[entry.priority] += 1;
    byStatus[entry.status] += 1;
  }

  return {
    byPriority,
    byStatus,
    highPriorityOpen: entries.filter((entry) => entry.priority === 'High' && entry.status === 'Open').length,
    totalOpen: byStatus.Open
  };
};

const buildTriggers = (
  reportingSnapshot: ReportingSnapshot,
  feedbackSummary: HypercareSnapshot['feedbackSummary']
): HypercareTrigger[] => {
  const triggers: HypercareTrigger[] = [];

  if (
    reportingSnapshot.compliancePosture.overdueRemediations > 0 ||
    reportingSnapshot.compliancePosture.criticalCredentials > 0 ||
    reportingSnapshot.compliancePosture.requiredDocumentGaps > 0
  ) {
    triggers.push({
      id: 'compliance_pressure',
      severity: 'critical',
      title: 'Compliance pressure requires escalation',
      reason: [
        `${reportingSnapshot.compliancePosture.overdueRemediations} overdue remediations`,
        `${reportingSnapshot.compliancePosture.criticalCredentials} critical credentials`,
        `${reportingSnapshot.compliancePosture.requiredDocumentGaps} required document gaps`
      ].join(', ')
    });
  }

  if (feedbackSummary.highPriorityOpen > 0) {
    triggers.push({
      id: 'high_priority_feedback',
      severity: 'warning',
      title: 'High-priority support backlog is open',
      reason: `${feedbackSummary.highPriorityOpen} open high-priority feedback items require triage`
    });
  }

  if (reportingSnapshot.trainingCompletion.overdueAssignments > 0) {
    triggers.push({
      id: 'training_overdue',
      severity: 'warning',
      title: 'Training adoption risk detected',
      reason: `${reportingSnapshot.trainingCompletion.overdueAssignments} overdue training assignments`
    });
  }

  if (reportingSnapshot.safetyPerformance.highRiskDrivers > 0) {
    triggers.push({
      id: 'driver_risk_watch',
      severity: 'warning',
      title: 'High-risk drivers need watchlist coverage',
      reason: `${reportingSnapshot.safetyPerformance.highRiskDrivers} drivers remain in the high-risk band`
    });
  }

  return triggers;
};

const deriveOverallStatus = (activeTriggers: HypercareTrigger[]): HypercareSnapshot['overallStatus'] => {
  if (activeTriggers.some((trigger) => trigger.severity === 'critical')) {
    return 'Escalate';
  }

  if (activeTriggers.length > 0) {
    return 'Monitor';
  }

  return 'Stable';
};

export const createHypercareService = (deps: HypercareDeps) => {
  return {
    async getSnapshot(window: ReportingWindow = '90d'): Promise<HypercareSnapshot> {
      const [reportingSnapshot, feedbackEntries] = await Promise.all([
        deps.getReportingSnapshot(window),
        deps.listFeedback()
      ]);

      const feedbackSummary = summarizeFeedback(feedbackEntries);
      const activeTriggers = buildTriggers(reportingSnapshot, feedbackSummary);

      return {
        activeTriggers,
        feedbackSummary,
        generatedAt: deps.now().toISOString(),
        overallStatus: deriveOverallStatus(activeTriggers),
        reportingSnapshot
      };
    }
  };
};

export const hypercareService = createHypercareService({
  getReportingSnapshot: reportingService.getSnapshot,
  listFeedback: feedbackService.listFeedback,
  now: () => new Date()
});
