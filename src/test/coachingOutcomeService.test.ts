import { describe, expect, it } from 'vitest';
import {
  buildCoachingOutcomeInsights,
  evaluateCoachingOutcome
} from '../services/coachingOutcomeService';

describe('coachingOutcomeService', () => {
  it('marks trend improved when latest risk score is lower than baseline', () => {
    const insight = evaluateCoachingOutcome(
      {
        id: 'plan-1',
        type: 'Speeding',
        status: 'Completed',
        startDate: '2026-02-01',
        dueDate: '2026-02-28'
      },
      [
        { as_of: '2026-02-01T00:00:00.000Z', score: 82 },
        { as_of: '2026-02-28T00:00:00.000Z', score: 68 }
      ],
      new Date('2026-03-01T00:00:00.000Z')
    );

    expect(insight.trend).toBe('improved');
    expect(insight.delta).toBe(-14);
  });

  it('returns insufficient-data when history is empty', () => {
    const insight = evaluateCoachingOutcome(
      {
        id: 'plan-2',
        type: 'Braking',
        status: 'Active',
        startDate: '2026-02-01'
      },
      []
    );
    expect(insight.trend).toBe('insufficient-data');
    expect(insight.delta).toBeNull();
  });

  it('builds outcome insight for each plan', () => {
    const insights = buildCoachingOutcomeInsights(
      [
        { id: 'plan-1', type: 'Speeding', status: 'Active', startDate: '2026-02-01' },
        { id: 'plan-2', type: 'Braking', status: 'Active', startDate: '2026-02-10' }
      ],
      [
        { as_of: '2026-02-01T00:00:00.000Z', score: 80 },
        { as_of: '2026-02-20T00:00:00.000Z', score: 74 }
      ],
      new Date('2026-03-01T00:00:00.000Z')
    );

    expect(insights).toHaveLength(2);
    expect(insights[0].planId).toBe('plan-1');
    expect(insights[1].planId).toBe('plan-2');
  });
});
