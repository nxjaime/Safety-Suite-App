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
    expect(docs[0].id).toBe('doc1');
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

  it('retries listDocuments on transient failure', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');
    const transient = new Error('temporary');

    const eqSpy = vi.fn().mockReturnThis();
    const orderSpy = vi.fn()
      .mockReturnValueOnce({ data: null, error: transient })
      .mockReturnValueOnce({
        data: [{
          id: 'doc1',
          name: 'Safety Handbook',
          category: 'Handbooks',
          storage_path: 'org-1/doc1.pdf',
          uploaded_at: '2026-01-01T00:00:00.000Z'
        }],
        error: null
      });
    const selectSpy = vi.fn().mockReturnThis();
    const chain: any = { select: selectSpy, eq: eqSpy, order: orderSpy };

    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any);

    const docs = await documentService.listDocuments();
    expect(orderSpy).toHaveBeenCalledTimes(2);
    expect(docs[0].id).toBe('doc1');
  });

  it('bulkArchiveDocuments reports per-item failures', async () => {
    const first = {
      id: 'doc-1',
      name: 'Doc 1',
      category: 'Compliance',
      storagePath: 'org-1/doc-1.pdf',
      uploadedAt: '2026-01-01T00:00:00.000Z'
    };
    const second = {
      id: 'doc-2',
      name: 'Doc 2',
      category: 'Compliance',
      storagePath: 'org-1/doc-2.pdf',
      uploadedAt: '2026-01-01T00:00:00.000Z'
    };

    vi.spyOn(documentService, 'deleteDocument')
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('boom'));

    const result = await documentService.bulkArchiveDocuments([first, second]);
    expect(result.archived).toBe(1);
    expect(result.failedIds).toEqual(['doc-2']);
  });

  it('uploadDocumentsBulk returns uploaded docs and failed file names', async () => {
    const files = [
      new File(['a'], 'first.pdf', { type: 'application/pdf' }),
      new File(['b'], 'second.pdf', { type: 'application/pdf' })
    ];

    vi.spyOn(documentService, 'uploadDocument')
      .mockResolvedValueOnce({
        id: 'doc-1',
        name: 'first.pdf',
        category: 'Compliance',
        storagePath: 'org-1/first.pdf',
        uploadedAt: '2026-01-01T00:00:00.000Z'
      } as any)
      .mockRejectedValueOnce(new Error('upload failed'));

    const result = await documentService.uploadDocumentsBulk({
      files,
      category: 'Compliance',
      docType: 'PDF'
    });

    expect(result.uploaded).toHaveLength(1);
    expect(result.uploaded[0].id).toBe('doc-1');
    expect(result.failedFiles).toEqual(['second.pdf']);
  });

  it('bulkUpdateDocuments updates selected docs and tracks failures', async () => {
    const updateSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error('boom') });
    const chain: any = { update: updateSpy, eq: eqSpy };

    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({
      from: vi.fn().mockReturnValue(chain)
    } as any);

    const result = await documentService.bulkUpdateDocuments({
      documentIds: ['doc-1', 'doc-2'],
      category: 'Insurance',
      metadata: { required: true, expirationDate: '2026-05-01' }
    });

    expect(updateSpy).toHaveBeenCalledTimes(2);
    expect(result.updated).toBe(1);
    expect(result.failedIds).toEqual(['doc-2']);
  });
});
