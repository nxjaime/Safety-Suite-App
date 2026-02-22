import { supabase, getCurrentOrganization } from '../lib/supabase';

export interface DataQualitySummary {
  missingDriverEmails: number;
  missingDriverTerminals: number;
  tasksWithoutDueDate: number;
  openInspectionRemediations: number;
}

export const dataQualityService = {
  async getSummary(): Promise<DataQualitySummary> {
    const orgId = await getCurrentOrganization();

    const [
      { count: missingDriverEmails },
      { count: missingDriverTerminals },
      { count: tasksWithoutDueDate },
      { count: openInspectionRemediations }
    ] = await Promise.all([
      supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('email', null),
      supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('terminal', null),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .neq('status', 'Completed')
        .is('due_date', null),
      supabase
        .from('inspections')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .neq('remediation_status', 'Closed')
    ]);

    return {
      missingDriverEmails: missingDriverEmails || 0,
      missingDriverTerminals: missingDriverTerminals || 0,
      tasksWithoutDueDate: tasksWithoutDueDate || 0,
      openInspectionRemediations: openInspectionRemediations || 0
    };
  }
};
