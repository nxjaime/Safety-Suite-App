import { supabase, getCurrentOrganization } from '../lib/supabase';

export type SavedViewTarget = 'tasks' | 'equipment' | 'drivers' | 'work_orders';
export type ViewFilters = Record<string, string | number | boolean | null | undefined>;

export interface SavedListView {
  id: string;
  organizationId: string | null;
  userId: string | null;
  target: SavedViewTarget;
  name: string;
  filters: ViewFilters;
  createdAt: string;
}

const STORAGE_PREFIX = 'saved-list-views:';

const mapView = (row: any): SavedListView => ({
  id: row.id,
  organizationId: row.organization_id ?? null,
  userId: row.user_id ?? null,
  target: row.target,
  name: row.name,
  filters: row.filters || {},
  createdAt: row.created_at,
});

const getUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

const baseQuery = async () => {
  const orgId = await getCurrentOrganization();
  const userId = await getUserId();
  return { orgId, userId };
};

const storageKey = (orgId: string | null, userId: string | null, target: SavedViewTarget) => `${STORAGE_PREFIX}${orgId ?? 'global'}:${userId ?? 'anon'}:${target}`;

const readLocalViews = (orgId: string | null, userId: string | null, target: SavedViewTarget): SavedListView[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(storageKey(orgId, userId, target)) || '[]'); } catch { return []; }
};

const writeLocalViews = (orgId: string | null, userId: string | null, target: SavedViewTarget, views: SavedListView[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(orgId, userId, target), JSON.stringify(views));
};

export const listWorkflowService = {
  async listSavedViews(target: SavedViewTarget): Promise<SavedListView[]> {
    const { orgId, userId } = await baseQuery();
    try {
      let query = supabase.from('user_saved_views').select('*').eq('target', target);
      if (orgId) query = query.eq('organization_id', orgId);
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapView);
    } catch {
      return readLocalViews(orgId, userId, target);
    }
  },
  async saveView(target: SavedViewTarget, name: string, filters: ViewFilters): Promise<SavedListView> {
    const { orgId, userId } = await baseQuery();
    const payload = { organization_id: orgId, user_id: userId, target, name: name.trim(), filters };
    try {
      const { data, error } = await supabase.from('user_saved_views').insert([payload]).select().single();
      if (error) throw error;
      return mapView(data);
    } catch {
      const view: SavedListView = { id: crypto.randomUUID(), organizationId: orgId, userId, target, name: name.trim(), filters, createdAt: new Date().toISOString() };
      const existing = readLocalViews(orgId, userId, target);
      writeLocalViews(orgId, userId, target, [view, ...existing]);
      return view;
    }
  },
  async deleteView(id: string): Promise<void> {
    const { orgId, userId } = await baseQuery();
    try {
      let query = supabase.from('user_saved_views').delete().eq('id', id);
      if (orgId) query = query.eq('organization_id', orgId);
      if (userId) query = query.eq('user_id', userId);
      const { error } = await query;
      if (error) throw error;
    } catch {
      for (const target of ['tasks', 'equipment', 'drivers', 'work_orders'] as SavedViewTarget[]) {
        const views = readLocalViews(orgId, userId, target).filter((view) => view.id !== id);
        writeLocalViews(orgId, userId, target, views);
      }
    }
  },
  async exportCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): Promise<string> {
    const escape = (value: string | number | boolean | null | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
  }
};
