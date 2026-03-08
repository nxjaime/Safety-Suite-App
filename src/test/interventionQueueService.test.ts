import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildInterventionQueue, recordInterventionAction, getInterventionActions } from '../services/interventionQueueService';

vi.mock('../lib/supabase', () => {
  const chain = () => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  return {
    supabase: { from: vi.fn(() => chain()) },
    getCurrentOrganization: vi.fn().mockResolvedValue('org-1'),
  };
});

import { supabase } from '../lib/supabase';

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

describe('intervention action persistence', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('recordInterventionAction inserts correct payload', async () => {
    const mockData = { id: 'ia-1', organization_id: 'org-1', driver_id: 'd2', action: 'dismissed', reason: 'false positive', actor: null, coaching_plan_id: null, created_at: '2026-03-07T00:00:00.000Z' };
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };
    vi.spyOn(supabase, 'from').mockReturnValue(chain as any);
    const result = await recordInterventionAction('d2', 'dismissed', { reason: 'false positive' });
    expect(result.action).toBe('dismissed');
    expect(result.reason).toBe('false positive');
  });

  it('getInterventionActions applies org and driver filter', async () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(() => chain),
    };
    // final await — after all eq calls — resolves with data
    chain.eq.mockImplementationOnce(() => chain).mockImplementationOnce(() => Promise.resolve({ data: [], error: null }));
    vi.spyOn(supabase, 'from').mockReturnValue(chain);
    await getInterventionActions('d2');
    expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(chain.eq).toHaveBeenCalledWith('driver_id', 'd2');
  });
});
