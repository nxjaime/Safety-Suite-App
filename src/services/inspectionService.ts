import { z } from 'zod';
import { supabase, getCurrentOrganization } from '../lib/supabase';

export interface ViolationItem {
    code: string;
    description: string;
    type: 'Driver' | 'Vehicle';
    oos: boolean;
}

export interface Inspection {
    id: string;
    date: string;
    report_number: string;
    time_started?: string;
    time_ended?: string;
    location?: string;
    inspection_level?: string;
    officer_name?: string;
    badge_number?: string;
    carrier_name?: string;
    carrier_address?: string;
    usdot_number?: string;
    driver_id?: string;
    driver_name?: string;
    driver_dob?: string;
    driver_license_number?: string;
    driver_license_state?: string;
    medical_cert_status?: string;
    vehicle_id?: string;
    vehicle_name?: string;
    vehicle_type?: string;
    plate_number?: string;
    plate_state?: string;
    vin?: string;
    odometer?: string;
    cargo_info?: string;
    violations_count?: number;
    violation_code?: string;
    description?: string;
    violations_data?: ViolationItem[];
    file_path?: string;
    status?: string;
    out_of_service?: boolean;
    defect_count?: number;
    remediation_status?: 'Open' | 'In Progress' | 'Closed';
    remediation_due_date?: string;
    remediation_notes?: string;
}

interface ComplianceTaskPayload {
    title: string;
    description: string;
    due_date: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'In Progress' | 'Completed';
    assignee: string;
    type: 'Compliance';
    related_id: string;
    driver_id: string | null;
    driver_name: string | null;
    organization_id: string | null;
}

const violationSchema = z.object({
    code: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['Driver', 'Vehicle']),
    oos: z.boolean().default(false)
});

const inspectionInputSchema = z.object({
    date: z.string().min(1),
    report_number: z.string().min(1),
    driver_name: z.string().optional(),
    vehicle_name: z.string().optional(),
    out_of_service: z.boolean().optional().default(false),
    violations_data: z.array(violationSchema).optional().default([])
}).passthrough();

const isUuid = (value?: string): boolean => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

const toDueDate = (daysOut: number) => {
    const due = new Date(Date.now() + (daysOut * 24 * 60 * 60 * 1000));
    return due.toISOString().split('T')[0];
};

export const shouldCreateWorkOrderFromInspection = (
    outOfService: boolean | undefined,
    violations: ViolationItem[] = []
) => {
    if (outOfService) return true;
    return violations.some((violation) => violation.oos);
};

export const buildInspectionComplianceTasks = (
    inspection: {
        id: string;
        report_number: string;
        driver_id?: string;
        driver_name?: string;
        vehicle_name?: string;
        out_of_service?: boolean;
        organization_id?: string | null;
    },
    violations: ViolationItem[] = []
): ComplianceTaskPayload[] => {
    const tasks: ComplianceTaskPayload[] = [];

    if (inspection.out_of_service) {
        tasks.push({
            title: `Inspection ${inspection.report_number}: out-of-service clearance`,
            description: `Clear out-of-service condition for ${inspection.vehicle_name || 'vehicle'} and attach remediation evidence.`,
            due_date: toDueDate(2),
            priority: 'High',
            status: 'Pending',
            assignee: 'Fleet Manager',
            type: 'Compliance',
            related_id: inspection.id,
            driver_id: isUuid(inspection.driver_id) ? inspection.driver_id! : null,
            driver_name: inspection.driver_name || null,
            organization_id: inspection.organization_id || null
        });
    }

    violations.forEach((violation) => {
        tasks.push({
            title: `Inspection ${inspection.report_number}: ${violation.code}`,
            description: `${violation.description} (${violation.type})`,
            due_date: toDueDate(violation.oos ? 2 : 7),
            priority: violation.oos ? 'High' : 'Medium',
            status: 'Pending',
            assignee: 'Safety Manager',
            type: 'Compliance',
            related_id: inspection.id,
            driver_id: isUuid(inspection.driver_id) ? inspection.driver_id! : null,
            driver_name: inspection.driver_name || null,
            organization_id: inspection.organization_id || null
        });
    });

    return tasks;
};

export const inspectionService = {
    async getInspections() {
        const { data, error } = await supabase
            .from('inspections')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching inspections:', error);
            return [];
        }

        return data || [];
    },

    async createInspection(inspection: Partial<Inspection>) {
        const parsed = inspectionInputSchema.safeParse(inspection);
        if (!parsed.success) {
            throw new Error('Inspection payload is invalid');
        }

        const orgId = await getCurrentOrganization();

        const payload = {
            organization_id: orgId,
            date: parsed.data.date,
            report_number: parsed.data.report_number,
            description: inspection.description || `Driver: ${inspection.driver_name || 'Unknown'}, Vehicle: ${inspection.vehicle_name || 'Unknown'}`,
            driver_id: isUuid(inspection.driver_id) ? inspection.driver_id : null,
            time_started: inspection.time_started || null,
            time_ended: inspection.time_ended || null,
            location: inspection.location,
            inspection_level: inspection.inspection_level,
            officer_name: inspection.officer_name,
            badge_number: inspection.badge_number,
            carrier_name: inspection.carrier_name,
            carrier_address: inspection.carrier_address,
            usdot_number: inspection.usdot_number,
            driver_name: inspection.driver_name,
            driver_dob: inspection.driver_dob,
            driver_license_number: inspection.driver_license_number,
            driver_license_state: inspection.driver_license_state,
            medical_cert_status: inspection.medical_cert_status,
            vehicle_name: inspection.vehicle_name,
            vehicle_type: inspection.vehicle_type,
            plate_number: inspection.plate_number,
            plate_state: inspection.plate_state,
            vin: inspection.vin,
            odometer: inspection.odometer,
            cargo_info: inspection.cargo_info,
            violation_code: inspection.violations_count?.toString(),
            violations_data: parsed.data.violations_data,
            out_of_service: parsed.data.out_of_service,
            defect_count: parsed.data.violations_data.length,
            remediation_status: parsed.data.violations_data.length > 0 || parsed.data.out_of_service ? 'Open' : 'Closed',
            remediation_due_date: parsed.data.violations_data.length > 0 || parsed.data.out_of_service ? toDueDate(7) : null
        };

        const { data, error } = await supabase
            .from('inspections')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        const complianceTasks = buildInspectionComplianceTasks(data, parsed.data.violations_data);
        if (complianceTasks.length > 0) {
            const { error: taskError } = await supabase.from('tasks').insert(complianceTasks);
            if (taskError) {
                console.error('Failed to create inspection compliance tasks', taskError);
            }
        }

        return data;
    }
};
