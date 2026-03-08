import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { MaintenanceTemplate, MaintenanceHistoryEntry, PMDueItem } from '../types';

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

    async getMaintenanceHistory(equipmentId: string): Promise<MaintenanceHistoryEntry[]> {
        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('maintenance_history')
            .select('*')
            .eq('equipment_id', equipmentId);
        if (orgId) query = query.eq('organization_id', orgId);
        const { data, error } = await query.order('service_date', { ascending: false });
        if (error) throw error;
        return (data || []).map((r: any) => ({
            id: r.id,
            equipmentId: r.equipment_id,
            templateId: r.template_id,
            organizationId: r.organization_id,
            workOrderId: r.work_order_id,
            serviceDate: r.service_date,
            serviceMiles: r.service_miles,
            serviceHours: r.service_hours,
            notes: r.notes,
            performedBy: r.performed_by,
            createdAt: r.created_at,
        }));
    },

    async recordServiceCompletion(input: {
        equipmentId: string;
        templateId?: string;
        serviceDate: string;
        serviceMiles?: number;
        serviceHours?: number;
        notes?: string;
        performedBy?: string;
        workOrderId?: string;
    }): Promise<MaintenanceHistoryEntry> {
        const orgId = await getCurrentOrganization();
        const { data, error } = await supabase
            .from('maintenance_history')
            .insert([{
                equipment_id: input.equipmentId,
                template_id: input.templateId || null,
                organization_id: orgId,
                work_order_id: input.workOrderId || null,
                service_date: input.serviceDate,
                service_miles: input.serviceMiles || null,
                service_hours: input.serviceHours || null,
                notes: input.notes || null,
                performed_by: input.performedBy || null,
            }])
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            equipmentId: data.equipment_id,
            templateId: data.template_id,
            organizationId: data.organization_id,
            workOrderId: data.work_order_id,
            serviceDate: data.service_date,
            serviceMiles: data.service_miles,
            serviceHours: data.service_hours,
            notes: data.notes,
            performedBy: data.performed_by,
            createdAt: data.created_at,
        };
    },

    async generatePMDues(
        equipmentId: string,
        currentMiles: number,
        currentHours: number,
        currentDate?: string
    ): Promise<PMDueItem[]> {
        const today = currentDate || new Date().toISOString().split('T')[0];
        const orgId = await getCurrentOrganization();

        // Load equipment type for template filtering
        let equipQuery = supabase.from('equipment').select('type').eq('id', equipmentId);
        if (orgId) equipQuery = equipQuery.eq('organization_id', orgId);
        const { data: equipData } = await equipQuery.single();
        const equipType = equipData?.type || null;

        // Load applicable templates
        let tmplQuery = supabase.from('pm_templates').select('*');
        if (orgId) tmplQuery = tmplQuery.eq('organization_id', orgId);
        const { data: templates, error: tmplError } = await tmplQuery;
        if (tmplError) throw tmplError;

        const applicable = (templates || []).filter((t: any) =>
            !t.applies_to_type || t.applies_to_type === equipType
        );

        if (applicable.length === 0) return [];

        // Load most recent history entry per template for this equipment
        const { data: historyRows } = await supabase
            .from('maintenance_history')
            .select('*')
            .eq('equipment_id', equipmentId)
            .order('service_date', { ascending: false });

        const lastByTemplate = new Map<string, any>();
        for (const row of (historyRows || [])) {
            if (row.template_id && !lastByTemplate.has(row.template_id)) {
                lastByTemplate.set(row.template_id, row);
            }
        }

        const due: PMDueItem[] = [];
        for (const t of applicable) {
            const last = lastByTemplate.get(t.id);
            const isDue = isTemplateDue({
                lastServiceDate: last?.service_date,
                currentDate: today,
                intervalDays: t.interval_days,
                lastServiceMiles: last?.service_miles ?? undefined,
                currentMiles,
                intervalMiles: t.interval_miles,
                lastServiceHours: last?.service_hours ?? undefined,
                currentHours,
                intervalHours: t.interval_hours,
            });
            if (isDue) {
                let reason = '';
                if (t.interval_days && last?.service_date) {
                    const days = Math.floor(
                        (new Date(today).getTime() - new Date(last.service_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    reason = `${days} days since last service (interval: ${t.interval_days}d)`;
                } else if (t.interval_miles && last?.service_miles != null) {
                    reason = `${currentMiles - last.service_miles} miles since last service (interval: ${t.interval_miles} mi)`;
                } else if (t.interval_hours && last?.service_hours != null) {
                    reason = `${currentHours - last.service_hours} hours since last service (interval: ${t.interval_hours} hrs)`;
                } else {
                    reason = 'No service history — first service due';
                }
                due.push({
                    templateId: t.id,
                    templateName: t.name,
                    reason,
                    lastServiceDate: last?.service_date,
                    lastServiceMiles: last?.service_miles,
                    lastServiceHours: last?.service_hours,
                });
            }
        }

        return due;
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
