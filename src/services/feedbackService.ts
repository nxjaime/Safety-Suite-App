import { supabase, getCurrentOrganization } from '../lib/supabase';

export interface FeedbackEntry {
  id: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  message: string;
  status: 'Open' | 'In Review' | 'Planned' | 'Closed';
  createdAt: string;
  submitterEmail?: string;
}

const mapFeedback = (row: any): FeedbackEntry => ({
  id: row.id,
  category: row.category,
  priority: row.priority,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
  submitterEmail: row.submitter_email || ''
});

const resolveOrganizationId = async (): Promise<string | null> => {
  const orgFromProfile = await getCurrentOrganization();
  if (orgFromProfile) return orgFromProfile;

  // Fallback to DB-side helper function used by RLS policies.
  const { data, error } = await supabase.rpc('get_org_id');
  if (error) return null;
  return data || null;
};

export const feedbackService = {
  async listFeedback(): Promise<FeedbackEntry[]> {
    const { data, error } = await supabase
      .from('feedback_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFeedback);
  },

  async addFeedback(input: {
    category: string;
    priority: 'Low' | 'Medium' | 'High';
    message: string;
  }) {
    const orgId = await resolveOrganizationId();
    if (!orgId) {
      throw new Error('No organization found for current user.');
    }

    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('feedback_entries')
      .insert([{
        organization_id: orgId,
        created_by: userData.user?.id || null,
        submitter_email: userData.user?.email || null,
        category: input.category,
        priority: input.priority,
        message: input.message,
        status: 'Open'
      }])
      .select()
      .single();

    if (error) throw error;
    return mapFeedback(data);
  },

  async deleteFeedback(id: string) {
    const { error } = await supabase
      .from('feedback_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  toCsv(rows: FeedbackEntry[]): string {
    const escape = (value: string) => `"${String(value || '').replace(/"/g, '""')}"`;
    const header = ['id', 'category', 'priority', 'status', 'message', 'submitter_email', 'created_at'];
    const lines = rows.map((entry) => [
      escape(entry.id),
      escape(entry.category),
      escape(entry.priority),
      escape(entry.status),
      escape(entry.message),
      escape(entry.submitterEmail || ''),
      escape(entry.createdAt)
    ].join(','));

    return [header.join(','), ...lines].join('\n');
  }
};
