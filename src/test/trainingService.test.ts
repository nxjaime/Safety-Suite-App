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

  it('lists templates and sorts by name', async () => {
    const orderSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const chain: any = { select: selectSpy, order: orderSpy };
    orderSpy.mockReturnValue({ data: [{ id: 't1', name: 'Temp' }], error: null });
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const tmpl = await trainingService.listTemplates();
    expect((supa.supabase as any).from).toHaveBeenCalledWith('training_templates');
    expect(orderSpy).toHaveBeenCalledWith('name');
    expect(tmpl).toEqual([{ id: 't1', name: 'Temp' }]);
  });

  it('inserts template with org', async () => {
    const orgId = 'org-xyz';
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue(orgId);
    const insertSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const singleSpy = vi.fn().mockReturnThis();
    const chain: any = { insert: insertSpy, select: selectSpy, single: singleSpy };
    singleSpy.mockReturnValue({ data: { id: 'newt' }, error: null });
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const payload = { name: 'Template 1' };
    const result = await trainingService.insertTemplate(payload as any);
    expect(insertSpy).toHaveBeenCalledWith([expect.objectContaining({ name: 'Template 1', organization_id: orgId })]);
    expect(result).toEqual({ id: 'newt' });
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

  it('updates a template', async () => {
    const updateSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const singleSpy = vi.fn().mockReturnThis();
    const chain: any = { update: updateSpy, eq: vi.fn().mockReturnThis(), select: selectSpy, single: singleSpy };
    singleSpy.mockReturnValue({ data: { id: 't42', name: 'Updated' }, error: null });
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const updated = await trainingService.updateTemplate('t42', { name: 'Updated' } as any);
    expect(updateSpy).toHaveBeenCalledWith({ name: 'Updated' });
    expect(updated).toEqual({ id: 't42', name: 'Updated' });
  });

  it('deletes a template', async () => {
    const eqSpy = vi.fn().mockReturnThis();
    const deleteSpy = vi.fn().mockReturnThis();
    const chain: any = { delete: deleteSpy, eq: eqSpy };
    // simulate final result after eq
    eqSpy.mockReturnValue({ error: null });
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    await trainingService.deleteTemplate('t99');
    expect(deleteSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith('id', 't99');
  });
});
