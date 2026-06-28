import { describe, expect, it, vi } from 'vitest';
import { taskService } from '../services/taskService';
import * as supa from '../lib/supabase';

describe('taskService', () => {
  it('filters tasks by organization when fetching', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');

    const eqSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnValue({
      data: [{
        id: 't1',
        title: 'Compliance follow-up',
        due_date: '2026-03-10',
        priority: 'High',
        status: 'Pending',
        assignee: 'Ops',
        type: 'Compliance'
      }],
      error: null
    });
    const chain: any = { select: selectSpy, eq: eqSpy, order: orderSpy };
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const result = await taskService.fetchTasks();
    expect(eqSpy).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
  });

  it('adds task with organization_id', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-2');

    const insertSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const singleSpy = vi.fn().mockReturnValue({
      data: {
        id: 't2',
        title: 'New task',
        due_date: '2026-03-10',
        priority: 'Medium',
        status: 'Pending',
        assignee: 'Ops',
        type: 'General'
      },
      error: null
    });
    const chain: any = { insert: insertSpy, select: selectSpy, single: singleSpy };
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    await taskService.addTask({
      title: 'New task',
      dueDate: '2026-03-10',
      priority: 'Medium',
      status: 'Pending',
      assignee: 'Ops',
      type: 'General'
    } as any);

    expect(insertSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        title: 'New task',
        organization_id: 'org-2'
      })
    ]);
  });

  it('fetches active paginated tasks as pending or in-progress', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');

    const inSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnThis();
    const rangeSpy = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
    const chain: any = { select: selectSpy, eq: eqSpy, in: inSpy, order: orderSpy, range: rangeSpy };
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    await taskService.fetchTasksPaginated(1, 12, { status: 'Pending' });

    expect(inSpy).toHaveBeenCalledWith('status', ['Pending', 'In Progress']);
    expect(rangeSpy).toHaveBeenCalledWith(0, 11);
  });

  it('fetches overdue paginated tasks by due date and incomplete status', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');

    const neqSpy = vi.fn().mockReturnThis();
    const ltSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnThis();
    const rangeSpy = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
    const chain: any = { select: selectSpy, eq: eqSpy, neq: neqSpy, lt: ltSpy, order: orderSpy, range: rangeSpy };
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    await taskService.fetchTasksPaginated(1, 12, { status: 'Overdue' });

    expect(neqSpy).toHaveBeenCalledWith('status', 'Completed');
    expect(ltSpy).toHaveBeenCalledWith('due_date', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });
});
