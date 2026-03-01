import { getCurrentOrganization, supabase } from '../lib/supabase';

interface QueueDriverRow {
  id: string;
  name: string;
  risk_score: number | null;
}

interface QueueRiskEventRow {
  id: string;
  driver_id: string;
  severity: number | null;
  occurred_at: string | null;
  event_type: string | null;
}

export interface InterventionQueueItem {
  driverId: string;
  driverName: string;
  riskScore: number;
  recentEventCount: number;
  maxSeverity: number;
  hasActiveCoaching: boolean;
  priorityScore: number;
  recommendedAction: string;
}

interface BuildQueueInput {
  drivers: QueueDriverRow[];
  riskEvents: QueueRiskEventRow[];
  activeCoachingDriverIds: Set<string>;
  now?: Date;
}

const ageScore = (occurredAt: string | null, now: Date) => {
  if (!occurredAt) return 0;
  const diffMs = now.getTime() - new Date(occurredAt).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 7) return 10;
  if (days <= 14) return 5;
  if (days <= 30) return 2;
  return 0;
};

export const buildInterventionQueue = ({
  drivers,
  riskEvents,
  activeCoachingDriverIds,
  now = new Date()
}: BuildQueueInput): InterventionQueueItem[] => {
  const eventsByDriver = new Map<string, QueueRiskEventRow[]>();

  for (const event of riskEvents) {
    if (!eventsByDriver.has(event.driver_id)) {
      eventsByDriver.set(event.driver_id, []);
    }
    eventsByDriver.get(event.driver_id)?.push(event);
  }

  const queue = drivers.map((driver) => {
    const driverEvents = eventsByDriver.get(driver.id) || [];
    const sorted = [...driverEvents].sort(
      (a, b) => (b.occurred_at || '').localeCompare(a.occurred_at || '')
    );
    const latest = sorted[0];
    const recentEventCount = driverEvents.length;
    const maxSeverity = driverEvents.reduce((max, event) => Math.max(max, event.severity || 1), 1);
    const riskScore = driver.risk_score || 0;
    const hasActiveCoaching = activeCoachingDriverIds.has(driver.id);

    const priorityScore = Math.round(
      (riskScore * 0.6)
      + (maxSeverity * 8)
      + Math.min(20, recentEventCount * 3)
      + ageScore(latest?.occurred_at || null, now)
      + (hasActiveCoaching ? -8 : 8)
    );

    const recommendedAction = hasActiveCoaching
      ? 'Schedule immediate check-in and review intervention outcomes'
      : 'Assign coaching plan and open intervention follow-up task';

    return {
      driverId: driver.id,
      driverName: driver.name,
      riskScore,
      recentEventCount,
      maxSeverity,
      hasActiveCoaching,
      priorityScore,
      recommendedAction
    };
  });

  return queue
    .filter((item) => item.recentEventCount > 0 || item.riskScore >= 70)
    .sort((a, b) => b.priorityScore - a.priorityScore);
};

export const fetchInterventionQueue = async (limit = 8): Promise<InterventionQueueItem[]> => {
  const organizationId = await getCurrentOrganization();
  if (!organizationId) return [];

  const cutoff = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();

  const [
    { data: drivers, error: driversError },
    { data: events, error: eventsError },
    { data: activePlans, error: plansError }
  ] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, name, risk_score')
      .eq('organization_id', organizationId),
    supabase
      .from('risk_events')
      .select('id, driver_id, severity, occurred_at, event_type')
      .eq('organization_id', organizationId)
      .gte('occurred_at', cutoff),
    supabase
      .from('coaching_plans')
      .select('driver_id')
      .eq('organization_id', organizationId)
      .eq('status', 'Active')
  ]);

  if (driversError) throw driversError;
  if (eventsError) throw eventsError;
  if (plansError) throw plansError;

  const activeSet = new Set<string>((activePlans || []).map((plan: any) => plan.driver_id));
  const queue = buildInterventionQueue({
    drivers: (drivers || []) as QueueDriverRow[],
    riskEvents: (events || []) as QueueRiskEventRow[],
    activeCoachingDriverIds: activeSet
  });

  return queue.slice(0, limit);
};
