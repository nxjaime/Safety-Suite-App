type ScorePoint = {
  score: number;
  as_of?: string;
  asOf?: string;
};

type CoachingPlanLike = {
  id: string;
  type: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  durationWeeks?: number;
};

export type CoachingOutcomeInsight = {
  planId: string;
  baselineScore: number | null;
  latestScore: number | null;
  delta: number | null;
  trend: 'improved' | 'worsened' | 'unchanged' | 'insufficient-data';
  summary: string;
};

const toIso = (value?: string) => (value ? new Date(value).toISOString() : null);

const normalizeHistory = (history: ScorePoint[]) => {
  return history
    .map((point) => ({
      score: Number(point.score),
      asOf: point.as_of || point.asOf
    }))
    .filter((point) => Number.isFinite(point.score) && !!point.asOf)
    .sort((a, b) => (a.asOf || '').localeCompare(b.asOf || ''));
};

const resolvePlanEndIso = (plan: CoachingPlanLike, now: Date) => {
  if (plan.dueDate) return toIso(plan.dueDate);
  if (plan.startDate && plan.durationWeeks) {
    const end = new Date(plan.startDate);
    end.setDate(end.getDate() + (plan.durationWeeks * 7));
    return end.toISOString();
  }
  return now.toISOString();
};

const getNearestAtOrAfter = (history: Array<{ score: number; asOf?: string }>, iso: string | null) => {
  if (!iso) return null;
  return history.find((point) => (point.asOf || '') >= iso) || null;
};

const getNearestAtOrBefore = (history: Array<{ score: number; asOf?: string }>, iso: string | null) => {
  if (!iso) return null;
  const candidates = history.filter((point) => (point.asOf || '') <= iso);
  return candidates.length > 0 ? candidates[candidates.length - 1] : null;
};

export const evaluateCoachingOutcome = (
  plan: CoachingPlanLike,
  scoreHistory: ScorePoint[],
  now = new Date()
): CoachingOutcomeInsight => {
  const normalized = normalizeHistory(scoreHistory);
  if (normalized.length === 0) {
    return {
      planId: plan.id,
      baselineScore: null,
      latestScore: null,
      delta: null,
      trend: 'insufficient-data',
      summary: 'Insufficient risk history to evaluate coaching outcome.'
    };
  }

  const startIso = toIso(plan.startDate);
  const endIso = resolvePlanEndIso(plan, now);

  const baselinePoint = getNearestAtOrAfter(normalized, startIso)
    || getNearestAtOrBefore(normalized, startIso)
    || normalized[0];
  const latestPoint = getNearestAtOrBefore(normalized, endIso)
    || normalized[normalized.length - 1];

  if (!baselinePoint || !latestPoint) {
    return {
      planId: plan.id,
      baselineScore: null,
      latestScore: null,
      delta: null,
      trend: 'insufficient-data',
      summary: 'Insufficient risk history to evaluate coaching outcome.'
    };
  }

  const delta = latestPoint.score - baselinePoint.score;
  let trend: CoachingOutcomeInsight['trend'] = 'unchanged';
  if (delta < 0) trend = 'improved';
  if (delta > 0) trend = 'worsened';

  const directionText = delta === 0
    ? 'No risk score movement'
    : `${Math.abs(delta)} point${Math.abs(delta) === 1 ? '' : 's'} ${trend}`;

  return {
    planId: plan.id,
    baselineScore: baselinePoint.score,
    latestScore: latestPoint.score,
    delta,
    trend,
    summary: `${directionText} since coaching start (baseline ${baselinePoint.score}, latest ${latestPoint.score}).`
  };
};

export const buildCoachingOutcomeInsights = (
  plans: CoachingPlanLike[],
  scoreHistory: ScorePoint[],
  now = new Date()
) => {
  return plans.map((plan) => evaluateCoachingOutcome(plan, scoreHistory, now));
};
