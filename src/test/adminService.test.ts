import { describe, expect, it, vi } from 'vitest';
import * as supa from '../lib/supabase';

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

describe('adminService', () => {
  it('allows platform admins to list rows', async () => {
    const limitSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    const orderSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const selectSpy = vi.fn().mockReturnValue({ order: orderSpy });

    (supa.supabase as any).from = vi.fn().mockReturnValue({ select: selectSpy });

    const { adminService } = await import('../services/adminService');
    await expect(adminService.listRows('drivers', 'platform_admin', 25)).resolves.toEqual([]);
  });

  it('blocks org-scoped roles from using admin service table access', async () => {
    const { adminService } = await import('../services/adminService');

    await expect(adminService.listRows('drivers', 'full', 25)).rejects.toThrow('Insufficient permissions for this action');
    await expect(adminService.listRows('drivers', 'readonly', 25)).rejects.toThrow('Insufficient permissions for this action');
  });
});
