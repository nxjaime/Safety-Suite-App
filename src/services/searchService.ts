import { supabase, getCurrentOrganization } from '../lib/supabase';

export type SearchResultType = 'driver' | 'task' | 'equipment' | 'document';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
}

const RESULTS_PER_TYPE = 5;

async function searchDrivers(query: string, orgId: string | null): Promise<SearchResult[]> {
  let q = supabase
    .from('drivers')
    .select('id, full_name, license_number, status')
    .ilike('full_name', `%${query}%`)
    .limit(RESULTS_PER_TYPE);

  if (orgId) q = q.eq('organization_id', orgId);

  const { data, error } = await q;
  if (error) throw error;

  return (data || []).map((d) => ({
    id: d.id,
    type: 'driver' as const,
    title: d.full_name || 'Unknown Driver',
    subtitle: [d.license_number, d.status].filter(Boolean).join(' · '),
    href: `/drivers/${d.id}`,
  }));
}

async function searchTasks(query: string, orgId: string | null): Promise<SearchResult[]> {
  let q = supabase
    .from('tasks')
    .select('id, title, status, priority')
    .ilike('title', `%${query}%`)
    .limit(RESULTS_PER_TYPE);

  if (orgId) q = q.eq('organization_id', orgId);

  const { data, error } = await q;
  if (error) throw error;

  return (data || []).map((t) => ({
    id: t.id,
    type: 'task' as const,
    title: t.title,
    subtitle: [t.status, t.priority].filter(Boolean).join(' · '),
    href: '/tasks',
  }));
}

async function searchEquipment(query: string, orgId: string | null): Promise<SearchResult[]> {
  let q = supabase
    .from('equipment')
    .select('id, name, unit_number, status')
    .or(`name.ilike.%${query}%,unit_number.ilike.%${query}%`)
    .limit(RESULTS_PER_TYPE);

  if (orgId) q = q.eq('organization_id', orgId);

  const { data, error } = await q;
  if (error) throw error;

  return (data || []).map((e) => ({
    id: e.id,
    type: 'equipment' as const,
    title: e.name || 'Unknown Asset',
    subtitle: [e.unit_number, e.status].filter(Boolean).join(' · '),
    href: '/equipment',
  }));
}

async function searchDocuments(query: string, orgId: string | null): Promise<SearchResult[]> {
  let q = supabase
    .from('documents')
    .select('id, name, document_type, status')
    .ilike('name', `%${query}%`)
    .limit(RESULTS_PER_TYPE);

  if (orgId) q = q.eq('organization_id', orgId);

  const { data, error } = await q;
  if (error) throw error;

  return (data || []).map((d) => ({
    id: d.id,
    type: 'document' as const,
    title: d.name || 'Untitled Document',
    subtitle: [d.document_type, d.status].filter(Boolean).join(' · '),
    href: '/documents',
  }));
}

export const searchService = {
  async search(query: string): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const orgId = await getCurrentOrganization();

    const results = await Promise.allSettled([
      searchDrivers(trimmed, orgId),
      searchTasks(trimmed, orgId),
      searchEquipment(trimmed, orgId),
      searchDocuments(trimmed, orgId),
    ]);

    const all: SearchResult[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') all.push(...r.value);
    }
    return all;
  },
};
