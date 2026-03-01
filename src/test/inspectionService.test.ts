import { describe, it, expect, vi } from 'vitest';
import { inspectionService, shouldCreateWorkOrderFromInspection } from '../services/inspectionService';
import * as supa from '../lib/supabase';

describe('inspectionService helpers', () => {
  it('returns true if outOfService flag set', () => {
    expect(shouldCreateWorkOrderFromInspection(true, [])).toBe(true);
  });

  it('returns true if any violation has oos true', () => {
    expect(shouldCreateWorkOrderFromInspection(false, [{ code: 'A', description: '', type: 'Vehicle', oos: true }])).toBe(true);
  });

  it('returns false when no criteria met', () => {
    expect(shouldCreateWorkOrderFromInspection(false, [{ code: 'A', description: '', type: 'Vehicle', oos: false }])).toBe(false);
  });

  it('filters inspections by organization on fetch', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-9');

    const eqSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnValue({ data: [{ id: 'i1' }], error: null });
    const chain: any = { select: selectSpy, eq: eqSpy, order: orderSpy };
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const rows = await inspectionService.getInspections();
    expect(eqSpy).toHaveBeenCalledWith('organization_id', 'org-9');
    expect(rows).toEqual([{ id: 'i1' }]);
  });
});
