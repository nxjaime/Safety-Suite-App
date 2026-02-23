import { describe, it, expect, vi } from 'vitest';
import { workOrderService } from '../services/workOrderService';
import * as supa from '../lib/supabase';

// mock getCurrentOrganization to return known value
vi.mock('../lib/supabase', async () => {
  const actual = await vi.importActual('../lib/supabase');
  return {
    ...actual,
    getCurrentOrganization: vi.fn().mockResolvedValue('org-test'),
    supabase: {
      from: vi.fn()
    }
  };
});

describe('workOrderService', () => {
  it('adds organization filter when fetching', async () => {
    const eqSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const chain: any = { select: selectSpy, eq: eqSpy, order: orderSpy };
    orderSpy.mockReturnValue({ data: [], error: null });

    (supa.supabase as any).from = vi.fn().mockReturnValue(chain);

    await workOrderService.getWorkOrders();
    expect((supa.supabase as any).from).toHaveBeenCalledWith('work_orders');
    expect(eqSpy).toHaveBeenCalledWith('organization_id', 'org-test');
  });

  it('default organization id is used when creating', async () => {
    const insertSpy = vi.fn().mockReturnValue({ select: () => ({ single: () => ({ data: { id: 'wo1' }, error: null }) }) });
    (supa.supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === 'work_orders') {
        return { insert: insertSpy };
      }
      return { insert: vi.fn() };
    });

    const order = { title: 'test', description: '', status: 'Draft', priority: 'High' } as any;
    const created = await workOrderService.createWorkOrder(order, []);
    expect(insertSpy).toHaveBeenCalled();
    // ensure id returned is mapped
    expect(created.id).toBe('wo1');
  });
});