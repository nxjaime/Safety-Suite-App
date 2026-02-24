import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { TrainingAssignment, TrainingTemplate } from '../types';

async function applyOrg(payload: Record<string, unknown>) {
  if ('organization_id' in payload) return payload;
  const orgId = await getCurrentOrganization();
  return { ...payload, organization_id: orgId };
}

export const trainingService = {
  async listAssignments(): Promise<TrainingAssignment[]> {
    const { data, error } = await supabase
      .from('training_assignments')
      .select('*')
      .order('created_at', { ascending: false });
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
    console.log('trainingService.insertAssignment returned data', data);
    let result: any = data;
    if (Array.isArray(result)) {
      result = result[0];
    }
    if (result && result['0'] !== undefined) {
      result = { ...result['0'], ...result };
      delete result['0'];
    }
    if (typeof window !== 'undefined') {
      (window as any).__lastAssignmentServiceData = result;
    }
    if (error) throw error;
    return result as TrainingAssignment;
  },

  async updateAssignment(id: string, updates: Partial<TrainingAssignment>) {
    const { data, error } = await supabase
      .from('training_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TrainingAssignment;
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase
      .from('training_assignments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // template methods
  async listTemplates(): Promise<TrainingTemplate[]> {
    const { data, error } = await supabase
      .from('training_templates')
      .select('*')
      .order('name');
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
    console.log('trainingService.insertTemplate returned data', data);
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
    // expose for e2e debugging when running in browser context
    if (typeof window !== 'undefined') {
      (window as any).__lastTemplateServiceData = result;
    }
    if (error) throw error;
    return result as TrainingTemplate;
  },

  async updateTemplate(id: string, updates: Partial<TrainingTemplate>) {
    const { data, error } = await supabase
      .from('training_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TrainingTemplate;
  },

  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('training_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
