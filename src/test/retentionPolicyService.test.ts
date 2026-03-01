import { describe, expect, it, vi } from 'vitest';
import { retentionPolicyService } from '../services/retentionPolicyService';
import * as supa from '../lib/supabase';

describe('retentionPolicyService', () => {
  it('builds retention candidate counts from org-scoped entities', async () => {
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-55');

    const makeChain = (rows: any[]) => {
      const ltSpy = vi.fn().mockResolvedValue({ data: rows, error: null });
      const notSpy = vi.fn().mockReturnThis();
      const eqSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      return { select: selectSpy, eq: eqSpy, not: notSpy, lt: ltSpy };
    };

    const documentsChain = makeChain([{ id: 'd1', uploaded_at: '2024-01-01T00:00:00.000Z' }]);
    const tasksChain = makeChain([{ id: 't1', closed_at: '2024-02-01T00:00:00.000Z' }]);
    const trainingChain = makeChain([{ id: 'a1', completed_at: '2024-03-01T00:00:00.000Z' }]);

    const fromSpy = vi.fn((table: string) => {
      if (table === 'documents') return documentsChain as any;
      if (table === 'tasks') return tasksChain as any;
      return trainingChain as any;
    });

    vi.spyOn(supa, 'supabase', 'get').mockReturnValue({ from: fromSpy } as any);

    const snapshot = await retentionPolicyService.getRetentionSnapshot(365);

    expect(fromSpy).toHaveBeenCalledWith('documents');
    expect(fromSpy).toHaveBeenCalledWith('tasks');
    expect(fromSpy).toHaveBeenCalledWith('training_assignments');
    expect(snapshot.counts.documents).toBe(1);
    expect(snapshot.counts.tasks).toBe(1);
    expect(snapshot.counts.trainingAssignments).toBe(1);
    expect(snapshot.counts.total).toBe(3);
    expect(snapshot.candidates[0].entity).toBe('documents');
  });
});
