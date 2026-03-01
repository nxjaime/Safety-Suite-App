import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { TrainingAssignment, TrainingTemplate } from '../types';

async function applyOrg(payload: Record<string, unknown>) {
  if ('organization_id' in payload) return payload;
  const orgId = await getCurrentOrganization();
  return { ...payload, organization_id: orgId };
}

export const trainingService = {
  async listAssignments(): Promise<TrainingAssignment[]> {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_assignments')
      .select('*');
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as TrainingAssignment[];
  },

  async insertAssignment(payload: Partial<TrainingAssignment>) {
    const final = await applyOrg(payload as Record<string, unknown>);
    const { data, error } = await supabase
      .from('training_assignments')
      .insert([final])
      .select()
      .single();
    // normalize supabase response; tests previously relied on handling
    let result: any = data;
    if (Array.isArray(result)) {
      result = result[0];
    }
    if (result && result['0'] !== undefined) {
      result = { ...result['0'], ...result };
      delete result['0'];
    }
    if (error) throw error;
    return result as TrainingAssignment;
  },

  async updateAssignment(id: string, updates: Partial<TrainingAssignment>) {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_assignments')
      .update(updates)
      .eq('id', id);
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data as TrainingAssignment;
  },

  async deleteAssignment(id: string) {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_assignments')
      .delete()
      .eq('id', id);
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { error } = await query;
    if (error) throw error;
  },

  // template methods
  async listTemplates(): Promise<TrainingTemplate[]> {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_templates')
      .select('*');
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query.order('name');
    if (error) throw error;
    return (data || []) as TrainingTemplate[];
  },

  async insertTemplate(payload: Partial<TrainingTemplate>) {
    const final = await applyOrg(payload as Record<string, unknown>);
    const { data, error } = await supabase
      .from('training_templates')
      .insert([final])
      .select()
      .single();
    // handle cases where the supabase client returns unexpected wrappers (array or numeric keys)
    let result: any = data;
    if (Array.isArray(result)) {
      result = result[0];
    }
    // some mocks return object with numeric '0' property; merge it so we don't lose other keys like id
    if (result && result['0'] !== undefined) {
      result = { ...result['0'], ...result };
      delete result['0'];
    }
    if (error) throw error;
    return result as TrainingTemplate;
  },

  async updateTemplate(id: string, updates: Partial<TrainingTemplate>) {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_templates')
      .update(updates)
      .eq('id', id);
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data as TrainingTemplate;
  },

  async deleteTemplate(id: string) {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_templates')
      .delete()
      .eq('id', id);
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { error } = await query;
    if (error) throw error;
  }
};
