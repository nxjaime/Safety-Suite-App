import { describe, it, expect, vi } from 'vitest';
import { trainingService } from '../services/trainingService';
import * as supa from '../lib/supabase';

describe('trainingService', () => {
  it('lists assignments and applies org filter', async () => {
    const orgId = 'org-abc';
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue(orgId);

    const orderSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const chain: any = { select: selectSpy, order: orderSpy };
    orderSpy.mockReturnValue({ data: [{ id: 'a1' }], error: null });

    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({
      from: vi.fn().mockReturnValue(chain)
    } as any);

    const list = await trainingService.listAssignments();
    expect((supa.supabase as any).from).toHaveBeenCalledWith('training_assignments');
    expect(orderSpy).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(list).toEqual([{ id: 'a1' }]);
  });

  it('inserts assignment and merges organization', async () => {
    const orgId = 'org-xyz';
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue(orgId);

    const insertSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const singleSpy = vi.fn().mockReturnThis();
    const chain: any = { insert: insertSpy, select: selectSpy, single: singleSpy };
    singleSpy.mockReturnValue({ data: { id: 'new' }, error: null });

    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({
      from: vi.fn().mockReturnValue(chain)
    } as any);

    const payload = { module_name: 'Test' };
    const result = await trainingService.insertAssignment(payload as any);
    expect(insertSpy).toHaveBeenCalledWith([expect.objectContaining({ module_name: 'Test', organization_id: orgId })]);
    expect(result).toEqual({ id: 'new' });
  });
});
