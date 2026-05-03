import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  getCurrentOrganization: vi.fn().mockResolvedValue('org-123'),
}));

import { supabase } from '../lib/supabase';
import { notificationRulesService } from '../services/notificationRulesService';

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

describe('notificationRulesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('falls back to local storage when remote rules are unavailable', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('offline') }),
    });

    const created = await notificationRulesService.createRule('full', { type: 'risk_score', threshold: 80 });
    const rules = await notificationRulesService.listRules();

    expect(created.type).toBe('risk_score');
    expect(rules).toHaveLength(1);
    expect(rules[0].threshold).toBe(80);
  });

  it('evaluates rules against current values', () => {
    const result = notificationRulesService.evaluateRules(
      [
        { id: '1', organizationId: 'org-123', type: 'risk_score', threshold: 75, createdBy: 'full', active: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: '2', organizationId: 'org-123', type: 'overdue_task', threshold: 2, createdBy: 'full', active: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      ],
      { risk_score: 88, overdue_task: 1, pending_checkin: 0, expiring_document: 0 }
    );

    expect(result[0].matches).toBe(true);
    expect(result[1].matches).toBe(false);
  });

  it('batches email digest summaries by day', async () => {
    const digest = await notificationRulesService.sendEmailDigest([
      { id: '1', title: 'One', detail: 'Alpha', createdAt: '2026-01-01T12:00:00Z' },
      { id: '2', title: 'Two', detail: 'Beta', createdAt: '2026-01-01T13:00:00Z' },
      { id: '3', title: 'Three', detail: 'Gamma', createdAt: '2026-01-02T13:00:00Z' },
    ]);

    expect(digest).toEqual([
      { day: '2026-01-01', count: 2, summary: 'One: Alpha | Two: Beta' },
      { day: '2026-01-02', count: 1, summary: 'Three: Gamma' },
    ]);
  });
});
