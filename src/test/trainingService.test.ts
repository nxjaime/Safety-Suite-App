import { describe, it, expect, vi } from 'vitest';
import { trainingService } from '../services/trainingService';
import * as supa from '../lib/supabase';

describe('trainingService', () => {
  it('lists assignments and applies org filter', async () => {
    const orgId = 'org-abc';
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue(orgId);

    const eqSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const chain: any = { select: selectSpy, eq: eqSpy, order: orderSpy };
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
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-abc');
    const eqSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const chain: any = { select: selectSpy, eq: eqSpy, order: orderSpy };
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
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-xyz');
    const eqSpy = vi.fn().mockReturnThis();
    const updateSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const singleSpy = vi.fn().mockReturnThis();
    const chain: any = { update: updateSpy, eq: eqSpy, select: selectSpy, single: singleSpy };
    singleSpy.mockReturnValue({ data: { id: 't42', name: 'Updated' }, error: null });
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const updated = await trainingService.updateTemplate('t42', { name: 'Updated' } as any);
    expect(updateSpy).toHaveBeenCalledWith({ name: 'Updated' });
    expect(updated).toEqual({ id: 't42', name: 'Updated' });
  });

  it('deletes a template', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-xyz');
    const deleteSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn();
    const chain: any = { delete: deleteSpy, eq: eqSpy };
    eqSpy.mockReturnValueOnce(chain).mockReturnValueOnce({ error: null });
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    await trainingService.deleteTemplate('t99');
    expect(deleteSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith('id', 't99');
  });

  it('updates assignment with completion and review fields', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-xyz');
    const updateSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const singleSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn().mockReturnThis();
    const chain: any = { update: updateSpy, eq: eqSpy, select: selectSpy, single: singleSpy };
    singleSpy.mockReturnValue({
      data: {
        id: 'a1',
        status: 'Completed',
        progress: 100,
        completed_at: '2024-01-01T12:00:00Z',
        completed_by: 'user-1',
        completion_notes: 'Attestation note',
        reviewed_at: '2024-01-02T12:00:00Z',
        reviewed_by: 'user-2',
      },
      error: null,
    });
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const updated = await trainingService.updateAssignment('a1', {
      status: 'Completed',
      progress: 100,
      completed_at: '2024-01-01T12:00:00Z',
      completed_by: 'user-1',
      completion_notes: 'Attestation note',
      reviewed_at: '2024-01-02T12:00:00Z',
      reviewed_by: 'user-2',
    });
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Completed',
        progress: 100,
        completed_at: '2024-01-01T12:00:00Z',
        completed_by: 'user-1',
        completion_notes: 'Attestation note',
        reviewed_at: '2024-01-02T12:00:00Z',
        reviewed_by: 'user-2',
      })
    );
    expect(updated.status).toBe('Completed');
    expect(updated.completion_notes).toBe('Attestation note');
  });

  it('blocks readonly mutations across training assignments and templates', async () => {
    await expect(
      trainingService.insertAssignment({ module_name: 'Blocked' }, 'readonly')
    ).rejects.toThrow('Insufficient permissions for this action');

    await expect(
      trainingService.updateAssignment('a1', { status: 'Completed' }, 'readonly')
    ).rejects.toThrow('Insufficient permissions for this action');

    await expect(
      trainingService.deleteAssignment('a1', 'readonly')
    ).rejects.toThrow('Insufficient permissions for this action');

    await expect(
      trainingService.insertTemplate({ name: 'Blocked template' }, 'readonly')
    ).rejects.toThrow('Insufficient permissions for this action');

    await expect(
      trainingService.updateTemplate('t1', { name: 'Blocked template' }, 'readonly')
    ).rejects.toThrow('Insufficient permissions for this action');

    await expect(
      trainingService.deleteTemplate('t1', 'readonly')
    ).rejects.toThrow('Insufficient permissions for this action');
  });

  it('allows coaching users to manage training mutations', async () => {
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

    await expect(
      trainingService.insertAssignment({ module_name: 'Allowed' }, 'coaching')
    ).resolves.toEqual({ id: 'new' });
  });

  it('getOverdueAssignments filters by neq Completed and lt due_date', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 'od-1' }], error: null }),
    };
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);
    const result = await trainingService.getOverdueAssignments('2026-03-07');
    expect(chain.neq).toHaveBeenCalledWith('status', 'Completed');
    expect(chain.lt).toHaveBeenCalledWith('due_date', '2026-03-07');
    expect(result).toHaveLength(1);
  });

  it('getUnreviewedCompletions filters completed with null reviewed_at', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 'ur-1', status: 'Completed' }], error: null }),
    };
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);
    const result = await trainingService.getUnreviewedCompletions();
    expect(chain.eq).toHaveBeenCalledWith('status', 'Completed');
    expect(chain.is).toHaveBeenCalledWith('reviewed_at', null);
    expect(result[0].id).toBe('ur-1');
  });

  it('assignCorrectiveTraining sets trigger_type from riskEventId', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');
    const chain: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'ct-1', trigger_type: 'risk_event' }, error: null }),
    };
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);
    const result = await trainingService.assignCorrectiveTraining('driver-1', 'tmpl-1', {
      moduleName: 'Defensive Driving',
      dueDate: '2026-04-01',
      riskEventId: 'evt-1',
      role: 'full',
    });
    expect(result.trigger_type).toBe('risk_event');
  });
});
