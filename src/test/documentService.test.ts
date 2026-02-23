import { describe, it, expect, vi } from 'vitest';
import { documentService } from '../services/documentService';
import * as supa from '../lib/supabase';

describe('documentService', () => {
  it('filters by organization when listing documents', async () => {
    const orgId = 'org-123';
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue(orgId);

    // build a supabase-style chain that returns itself
    const eqSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const chain: any = { select: selectSpy, eq: eqSpy, order: orderSpy };
    // after order we need final data
    orderSpy.mockReturnValue({ data: [{ id: 'doc1' }], error: null });

    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const docs = await documentService.listDocuments();
    expect((supa.supabase as any).from).toHaveBeenCalledWith('documents');
    expect(eqSpy).toHaveBeenCalledWith('status', 'active');
    expect(eqSpy).toHaveBeenCalledWith('organization_id', orgId);
    expect(orderSpy).toHaveBeenCalledWith('uploaded_at', { ascending: false });
    expect(docs).toEqual([{ id: 'doc1' }]);
  });

  it('throws when supabase returns an error', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');
    const err = new Error('oops');

    const eqSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn().mockReturnThis();
    const selectSpy = vi.fn().mockReturnThis();
    const chain: any = { select: selectSpy, eq: eqSpy, order: orderSpy };
    orderSpy.mockReturnValue({ data: null, error: err });
    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    await expect(documentService.listDocuments()).rejects.toBe(err);
  });

});