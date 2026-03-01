import { getCurrentOrganization, supabase } from '../lib/supabase';

export interface RetentionCandidate {
  id: string;
  entity: 'documents' | 'tasks' | 'training_assignments';
  date: string;
  reason: string;
}

export interface RetentionSnapshot {
  evaluatedAt: string;
  cutoffDate: string;
  days: number;
  candidates: RetentionCandidate[];
  counts: {
    documents: number;
    tasks: number;
    trainingAssignments: number;
    total: number;
  };
}

const toCutoffDate = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split('T')[0];
};

export const retentionPolicyService = {
  async getRetentionSnapshot(days = 365): Promise<RetentionSnapshot> {
    const orgId = await getCurrentOrganization();
    const cutoffDate = toCutoffDate(days);

    let documentsQuery = supabase
      .from('documents')
      .select('id, uploaded_at')
      .eq('status', 'active');
    let tasksQuery = supabase
      .from('tasks')
      .select('id, closed_at')
      .eq('status', 'Completed')
      .not('closed_at', 'is', null);
    let trainingQuery = supabase
      .from('training_assignments')
      .select('id, completed_at')
      .eq('status', 'Completed')
      .not('completed_at', 'is', null);

    if (orgId) {
      documentsQuery = documentsQuery.eq('organization_id', orgId);
      tasksQuery = tasksQuery.eq('organization_id', orgId);
      trainingQuery = trainingQuery.eq('organization_id', orgId);
    }

    documentsQuery = documentsQuery.lt('uploaded_at', `${cutoffDate}T00:00:00.000Z`);
    tasksQuery = tasksQuery.lt('closed_at', `${cutoffDate}T00:00:00.000Z`);
    trainingQuery = trainingQuery.lt('completed_at', `${cutoffDate}T00:00:00.000Z`);

    const [
      { data: documents, error: documentsError },
      { data: tasks, error: tasksError },
      { data: trainingAssignments, error: trainingError }
    ] = await Promise.all([documentsQuery, tasksQuery, trainingQuery]);

    if (documentsError) throw documentsError;
    if (tasksError) throw tasksError;
    if (trainingError) throw trainingError;

    const documentCandidates: RetentionCandidate[] = (documents || []).map((row: any) => ({
      id: row.id,
      entity: 'documents',
      date: row.uploaded_at,
      reason: `Active document older than ${days} days`
    }));
    const taskCandidates: RetentionCandidate[] = (tasks || []).map((row: any) => ({
      id: row.id,
      entity: 'tasks',
      date: row.closed_at,
      reason: `Completed task older than ${days} days`
    }));
    const trainingCandidates: RetentionCandidate[] = (trainingAssignments || []).map((row: any) => ({
      id: row.id,
      entity: 'training_assignments',
      date: row.completed_at,
      reason: `Completed training assignment older than ${days} days`
    }));

    const candidates = [...documentCandidates, ...taskCandidates, ...trainingCandidates]
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      evaluatedAt: new Date().toISOString(),
      cutoffDate,
      days,
      candidates,
      counts: {
        documents: documentCandidates.length,
        tasks: taskCandidates.length,
        trainingAssignments: trainingCandidates.length,
        total: candidates.length
      }
    };
  }
};
