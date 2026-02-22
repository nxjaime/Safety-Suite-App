import { getCurrentOrganization, supabase } from '../lib/supabase';
import { motiveService } from './motiveService';

export type RiskBand = 'green' | 'yellow' | 'red';

type RiskEventRow = {
  event_type?: string | null;
  severity?: number | null;
  score_delta?: number | null;
  occurred_at?: string | null;
};

type ScoreParts = {
  motive: number;
  local: number;
  band: RiskBand;
};

type CalculateScoreResult = {
  score: number;
  parts: ScoreParts;
};

type RiskServiceDeps = {
  supabase: any;
  getCurrentOrganization: () => Promise<string | null>;
  getMotiveScores: (startDate: string, endDate: string) => Promise<any>;
  now: () => Date;
};

const DEFAULT_MOTIVE_SCORE = 60;
const SCORE_MIN = 0;
const SCORE_MAX = 100;

const RISK_TYPE_WEIGHTS: Record<string, number> = {
  speeding: 8,
  'hard braking': 6,
  'hos violation': 7,
  accident: 15,
  citation: 5
};

const clampScore = (value: number) => Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(value)));

const toISODate = (date: Date) => date.toISOString().split('T')[0];

const subtractDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
};

const parseWindowDays = (window: string) => {
  const parsed = Number.parseInt(window.replace('d', ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
};

const normalizeRiskType = (eventType?: string | null) => (eventType || '').trim().toLowerCase();

const getRiskTypeWeight = (eventType?: string | null) => {
  const key = normalizeRiskType(eventType);
  return RISK_TYPE_WEIGHTS[key] ?? 5;
};

const resolveMotiveScore = (payload: any, motiveId?: string | null) => {
  const users = payload?.users;
  if (!Array.isArray(users) || users.length === 0) {
    return DEFAULT_MOTIVE_SCORE;
  }

  if (motiveId) {
    const exactMatch = users.find((entry: any) => String(entry?.driver?.id) === String(motiveId));
    if (exactMatch && Number.isFinite(Number(exactMatch?.safety_score))) {
      return clampScore(Number(exactMatch.safety_score));
    }
  }

  const firstWithScore = users.find((entry: any) => Number.isFinite(Number(entry?.safety_score)));
  return firstWithScore ? clampScore(Number(firstWithScore.safety_score)) : DEFAULT_MOTIVE_SCORE;
};

const calculateLocalScore = (events: RiskEventRow[]) => {
  const weightedTotal = events.reduce((sum, event) => {
    const severity = Number(event.severity ?? 1);
    const safeSeverity = Number.isFinite(severity) ? Math.min(5, Math.max(1, severity)) : 1;
    const defaultDelta = getRiskTypeWeight(event.event_type) * safeSeverity;
    const explicitDelta = Number(event.score_delta);
    const delta = Number.isFinite(explicitDelta) ? explicitDelta : defaultDelta;
    return sum + delta;
  }, 0);

  return clampScore(20 + weightedTotal);
};

export const getRiskBand = (score: number): RiskBand => {
  if (score >= 80) return 'red';
  if (score >= 50) return 'yellow';
  return 'green';
};

export const createRiskService = (deps: RiskServiceDeps) => {
  return {
    getRiskTypeWeight,
    getRiskBand,

    async ingestEvent(input: {
      driverId: string;
      source?: string;
      eventType: string;
      severity: number;
      occurredAt: string;
      metadata?: Record<string, unknown>;
      scoreDelta?: number;
    }) {
      const organizationId = await deps.getCurrentOrganization();
      if (!organizationId) throw new Error('No organization context available');

      const payload = {
        driver_id: input.driverId,
        organization_id: organizationId,
        source: input.source ?? 'manual',
        event_type: input.eventType,
        severity: Math.min(5, Math.max(1, Math.round(input.severity))),
        score_delta: input.scoreDelta ?? null,
        occurred_at: input.occurredAt,
        metadata: input.metadata ?? {},
        type: input.eventType,
        date: input.occurredAt
      };

      const { data, error } = await deps.supabase
        .from('risk_events')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async calculateScore(driverId: string, window = '90d'): Promise<CalculateScoreResult> {
      const organizationId = await deps.getCurrentOrganization();
      if (!organizationId) throw new Error('No organization context available');

      const now = deps.now();
      const motiveStart = toISODate(subtractDays(now, 30));
      const motiveEnd = toISODate(now);

      const [{ data: driverRow, error: driverError }, motivePayload] = await Promise.all([
        deps.supabase
          .from('drivers')
          .select('motive_id')
          .eq('id', driverId)
          .maybeSingle(),
        deps.getMotiveScores(motiveStart, motiveEnd).catch(() => ({ users: [] }))
      ]);

      if (driverError) throw driverError;

      const motiveScore = resolveMotiveScore(motivePayload, driverRow?.motive_id);
      const localWindowDays = parseWindowDays(window);
      const cutoff = subtractDays(now, localWindowDays).toISOString();

      const { data: eventRows, error: eventsError } = await deps.supabase
        .from('risk_events')
        .select('event_type, severity, score_delta, occurred_at')
        .eq('driver_id', driverId)
        .gte('occurred_at', cutoff);

      if (eventsError) throw eventsError;

      const localScore = calculateLocalScore((eventRows || []) as RiskEventRow[]);
      const score = clampScore((0.6 * motiveScore) + (0.4 * localScore));
      const parts: ScoreParts = {
        motive: motiveScore,
        local: localScore,
        band: getRiskBand(score)
      };

      const { error: historyError } = await deps.supabase
        .from('driver_risk_scores')
        .insert([{
          driver_id: driverId,
          organization_id: organizationId,
          score,
          composite_parts: parts,
          source_window: window,
          as_of: now.toISOString()
        }]);
      if (historyError) throw historyError;

      const { error: updateError } = await deps.supabase
        .from('drivers')
        .update({ risk_score: score })
        .eq('id', driverId);
      if (updateError) throw updateError;

      return { score, parts };
    },

    async getScoreHistory(driverId: string, limit = 12) {
      const { data, error } = await deps.supabase
        .from('driver_risk_scores')
        .select('*')
        .eq('driver_id', driverId)
        .order('as_of', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }
  };
};

export const riskService = createRiskService({
  supabase,
  getCurrentOrganization,
  getMotiveScores: motiveService.getScores,
  now: () => new Date()
});
