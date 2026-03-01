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
});
