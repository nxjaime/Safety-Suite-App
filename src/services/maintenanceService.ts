import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { MaintenanceTemplate } from '../types';

export interface DueCheckInput {
    lastServiceDate?: string;
    currentDate?: string;
    intervalDays?: number;
    lastServiceMiles?: number;
    currentMiles?: number;
    intervalMiles?: number;
    lastServiceHours?: number;
    currentHours?: number;
    intervalHours?: number;
}

const daysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay);
};

export const isTemplateDue = (input: DueCheckInput) => {
    if (input.intervalDays && input.lastServiceDate && input.currentDate) {
        if (daysBetween(input.lastServiceDate, input.currentDate) >= input.intervalDays) {
            return true;
        }
    }

    if (
        input.intervalMiles !== undefined &&
        input.lastServiceMiles !== undefined &&
        input.currentMiles !== undefined
    ) {
        if (input.currentMiles - input.lastServiceMiles >= input.intervalMiles) {
            return true;
        }
    }

    if (
        input.intervalHours !== undefined &&
        input.lastServiceHours !== undefined &&
        input.currentHours !== undefined
    ) {
        if (input.currentHours - input.lastServiceHours >= input.intervalHours) {
            return true;
        }
    }

    return false;
};

const mapTemplate = (data: any): MaintenanceTemplate => ({
    ...data,
    organizationId: data.organization_id,
    appliesToType: data.applies_to_type,
    intervalDays: data.interval_days,
    intervalMiles: data.interval_miles,
    intervalHours: data.interval_hours,
});

export const maintenanceService = {
    async getTemplates(): Promise<MaintenanceTemplate[]> {
        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('pm_templates')
            .select('*');
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }
        const { data, error } = await query.order('name');

        if (error) throw error;
        return (data || []).map(mapTemplate);
    },

    async createTemplate(template: Omit<MaintenanceTemplate, 'id'>) {
        // ensure organization context is attached
        const orgId = await getCurrentOrganization();
        const { data, error } = await supabase
            .from('pm_templates')
            .insert([
                {
                    organization_id: template.organizationId || orgId,
                    name: template.name,
                    applies_to_type: template.appliesToType,
                    interval_days: template.intervalDays,
                    interval_miles: template.intervalMiles,
                    interval_hours: template.intervalHours,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return mapTemplate(data);
    },
};
