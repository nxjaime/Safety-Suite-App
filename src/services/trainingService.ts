import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { TrainingAssignment, TrainingTemplate } from '../types';
import { canManageTraining, type ProfileRole } from './authorizationService';

async function applyOrg(payload: Record<string, unknown>) {
  if ('organization_id' in payload) return payload;
  const orgId = await getCurrentOrganization();
  return { ...payload, organization_id: orgId };
}

const ensureCanMutate = (role?: ProfileRole) => {
  if (role && !canManageTraining(role)) {
    throw new Error('Insufficient permissions for this action');
  }
};

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

  async insertAssignment(payload: Partial<TrainingAssignment>, role?: ProfileRole) {
    ensureCanMutate(role);
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

  async updateAssignment(id: string, updates: Partial<TrainingAssignment>, role?: ProfileRole) {
    ensureCanMutate(role);
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

  async deleteAssignment(id: string, role?: ProfileRole) {
    ensureCanMutate(role);
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

  async insertTemplate(payload: Partial<TrainingTemplate>, role?: ProfileRole) {
    ensureCanMutate(role);
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

  async updateTemplate(id: string, updates: Partial<TrainingTemplate>, role?: ProfileRole) {
    ensureCanMutate(role);
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

  async deleteTemplate(id: string, role?: ProfileRole) {
    ensureCanMutate(role);
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
  },

  /** All assignments that are past due and not yet completed */
  async getOverdueAssignments(todayISO = new Date().toISOString().split('T')[0]): Promise<TrainingAssignment[]> {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_assignments')
      .select('*')
      .neq('status', 'Completed')
      .lt('due_date', todayISO);
    if (orgId) query = query.eq('organization_id', orgId);
    const { data, error } = await query.order('due_date', { ascending: true });
    if (error) throw error;
    return (data || []) as TrainingAssignment[];
  },

  /** Completed assignments awaiting manager review (completed_at set, reviewed_at null) */
  async getUnreviewedCompletions(): Promise<TrainingAssignment[]> {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_assignments')
      .select('*')
      .eq('status', 'Completed')
      .is('reviewed_at', null);
    if (orgId) query = query.eq('organization_id', orgId);
    const { data, error } = await query.order('completed_at', { ascending: false });
    if (error) throw error;
    return (data || []) as TrainingAssignment[];
  },

  /** Mark overdue assignments as escalated (sets escalated_at); returns count */
  async escalateOverdueAssignments(
    todayISO = new Date().toISOString().split('T')[0]
  ): Promise<number> {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('training_assignments')
      .update({ escalated_at: new Date().toISOString() })
      .neq('status', 'Completed')
      .lt('due_date', todayISO)
      .is('escalated_at', null);
    if (orgId) query = (query as any).eq('organization_id', orgId);
    const { data, error } = await (query as any).select('id');
    if (error) throw error;
    return (data || []).length;
  },

  /** Create a corrective training assignment linked to a risk event or coaching plan */
  async assignCorrectiveTraining(
    driverId: string,
    templateId: string,
    opts: {
      moduleName: string;
      dueDate: string;
      riskEventId?: string;
      coachingPlanId?: string;
      triggerType?: TrainingAssignment['trigger_type'];
      role?: ProfileRole;
    }
  ): Promise<TrainingAssignment> {
    ensureCanMutate(opts.role);
    const orgId = await getCurrentOrganization();
    const payload: Record<string, unknown> = {
      organization_id: orgId,
      template_id: templateId,
      assignee_id: driverId,
      module_name: opts.moduleName,
      due_date: opts.dueDate,
      status: 'Active',
      progress: 0,
      trigger_type: opts.triggerType || (opts.riskEventId ? 'risk_event' : opts.coachingPlanId ? 'coaching_plan' : 'manual'),
      risk_event_id: opts.riskEventId || null,
      coaching_plan_id: opts.coachingPlanId || null,
    };
    const { data, error } = await supabase
      .from('training_assignments')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as TrainingAssignment;
  },
};
