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

  it('scopes document archive writes by organization', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');
    const eqSpy = vi.fn().mockReturnThis();
    const updateSpy = vi.fn().mockReturnThis();
    const removeSpy = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'documents') {
          return { update: updateSpy, eq: eqSpy };
        }
        return {};
      }),
      storage: {
        from: vi.fn().mockReturnValue({ remove: removeSpy })
      }
    } as any);

    await documentService.deleteDocument({
      id: 'doc-1',
      name: 'Doc 1',
      category: 'Compliance',
      storagePath: 'org-1/doc-1.pdf',
      uploadedAt: '2026-01-01T00:00:00.000Z'
    });

    expect(eqSpy).toHaveBeenCalledWith('id', 'doc-1');
    expect(eqSpy).toHaveBeenCalledWith('organization_id', 'org-1');
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
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-1');
    const updateSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn();
    const chain: any = { update: updateSpy, eq: eqSpy };
    eqSpy
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ error: null })
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ error: new Error('boom') });

    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({
      from: vi.fn().mockReturnValue(chain)
    } as any);

    const result = await documentService.bulkUpdateDocuments({
      documentIds: ['doc-1', 'doc-2'],
      category: 'Insurance',
      metadata: { required: true, expirationDate: '2026-05-01' }
    });

    expect(updateSpy).toHaveBeenCalledTimes(2);
    expect(eqSpy).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(result.updated).toBe(1);
    expect(result.failedIds).toEqual(['doc-2']);
  });

  it('getExpiringDocuments returns only docs expiring within window', () => {
    const docs: any[] = [
      { id: 'd1', name: 'A', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { expirationDate: '2026-03-20' } },
      { id: 'd2', name: 'B', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { expirationDate: '2026-05-01' } },
      { id: 'd3', name: 'C', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { expirationDate: '2025-12-01' } },
    ];
    const result = documentService.getExpiringDocuments(docs, 30, '2026-03-07');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d1');
  });

  it('getExpiredDocuments returns only docs past expiration', () => {
    const docs: any[] = [
      { id: 'd1', name: 'A', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { expirationDate: '2025-12-01' } },
      { id: 'd2', name: 'B', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { expirationDate: '2026-04-01' } },
    ];
    const result = documentService.getExpiredDocuments(docs, '2026-03-07');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d1');
  });

  it('getDocumentDeficiencies returns required docs with expired or missing expiry', () => {
    const docs: any[] = [
      { id: 'd1', name: 'A', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { required: true, expirationDate: '2025-06-01' } },
      { id: 'd2', name: 'B', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { required: true } },
      { id: 'd3', name: 'C', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { required: false, expirationDate: '2025-01-01' } },
      { id: 'd4', name: 'D', category: 'c', storagePath: 's', uploadedAt: '2026-01-01', metadata: { required: true, expirationDate: '2026-12-01' } },
    ];
    const result = documentService.getDocumentDeficiencies(docs, '2026-03-07');
    expect(result).toHaveLength(2);
    expect(result.find(r => r.doc.id === 'd1')?.reason).toBe('expired');
    expect(result.find(r => r.doc.id === 'd2')?.reason).toBe('missing_expiry');
  });
});
