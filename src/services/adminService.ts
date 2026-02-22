import { supabase, getCurrentOrganization } from '../lib/supabase';

export interface AdminTableOption {
  name: string;
  label: string;
  requiresOrg: boolean;
}

export const adminTables: AdminTableOption[] = [
  { name: 'drivers', label: 'Drivers', requiresOrg: true },
  { name: 'tasks', label: 'Tasks', requiresOrg: true },
  { name: 'risk_events', label: 'Risk Events', requiresOrg: true },
  { name: 'coaching_plans', label: 'Coaching Plans', requiresOrg: true },
  { name: 'accidents', label: 'Accidents', requiresOrg: true },
  { name: 'citations', label: 'Citations', requiresOrg: true },
  { name: 'equipment', label: 'Equipment', requiresOrg: true },
  { name: 'pm_templates', label: 'PM Templates', requiresOrg: true },
  { name: 'work_orders', label: 'Work Orders', requiresOrg: true },
  { name: 'work_order_line_items', label: 'Work Order Line Items', requiresOrg: false },
  { name: 'inspections', label: 'Inspections', requiresOrg: true },
  { name: 'documents', label: 'Documents', requiresOrg: true },
  { name: 'driver_documents', label: 'Driver Documents', requiresOrg: true },
  { name: 'feedback_entries', label: 'Feedback Entries', requiresOrg: true },
  { name: 'carrier_settings', label: 'Carrier Settings', requiresOrg: true },
  { name: 'carrier_health_cache', label: 'Carrier Health Cache', requiresOrg: true }
];

const applyOrgIfNeeded = async (table: string, payload: Record<string, unknown>) => {
  const config = adminTables.find((item) => item.name === table);
  if (!config?.requiresOrg) return payload;

  if ('organization_id' in payload) return payload;

  const orgId = await getCurrentOrganization();
  return {
    ...payload,
    organization_id: orgId
  };
};

export const adminService = {
  async listRows(table: string, limit = 25): Promise<Array<Record<string, unknown>>> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Array<Record<string, unknown>>;
  },

  async insertRow(table: string, payload: Record<string, unknown>) {
    const finalPayload = await applyOrgIfNeeded(table, payload);
    const { data, error } = await supabase
      .from(table)
      .insert([finalPayload])
      .select()
      .single();

    if (error) throw error;
    return data as Record<string, unknown>;
  },

  async deleteRow(table: string, id: string) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
