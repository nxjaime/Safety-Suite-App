import { describe, expect, it } from 'vitest';
import { buildInterventionQueue } from '../services/interventionQueueService';

describe('interventionQueueService', () => {
  it('prioritizes high-risk drivers with recent severe events and no active coaching', () => {
    const queue = buildInterventionQueue({
      drivers: [
        { id: 'd1', name: 'Low Risk', risk_score: 35 },
        { id: 'd2', name: 'High Risk', risk_score: 88 }
      ],
      riskEvents: [
        {
          id: 'e1',
          driver_id: 'd2',
          severity: 5,
          occurred_at: '2026-03-01T00:00:00.000Z',
          event_type: 'Accident'
        },
        {
          id: 'e2',
          driver_id: 'd1',
          severity: 2,
          occurred_at: '2026-02-10T00:00:00.000Z',
          event_type: 'Speeding'
        }
      ],
      activeCoachingDriverIds: new Set<string>(['d1']),
      now: new Date('2026-03-02T00:00:00.000Z')
    });

    expect(queue[0].driverId).toBe('d2');
    expect(queue[0].recommendedAction).toContain('Assign coaching plan');
  });
});
