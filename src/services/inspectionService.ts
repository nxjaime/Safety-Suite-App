
import { supabase } from '../lib/supabase';

export interface ViolationItem {
    code: string;
    description: string;
    type: 'Driver' | 'Vehicle';
    oos: boolean; // Out of Service
}

export interface Inspection {
    id: string;
    date: string;
    report_number: string;

    // Admin
    time_started?: string;
    time_ended?: string;
    location?: string;
    inspection_level?: string;
    officer_name?: string;
    badge_number?: string;

    // Carrier
    carrier_name?: string;
    carrier_address?: string;
    usdot_number?: string;

    // Driver
    driver_id?: string;
    driver_name?: string; // Helper for UI
    driver_dob?: string;
    driver_license_number?: string;
    driver_license_state?: string;
    medical_cert_status?: string;

    // Vehicle
    vehicle_id?: string;
    vehicle_name?: string; // Helper for UI
    vehicle_type?: string;
    plate_number?: string;
    plate_state?: string;
    vin?: string;
    odometer?: string;
    cargo_info?: string;

    // Violations
    violations_count?: number; // Kept for backward compatibility or computed
    violation_code?: string; // Kept for backward compatibility
    description?: string; // Kept for backward compatibility
    violations_data?: ViolationItem[];

    file_path?: string;
    status?: string;
    out_of_service?: boolean;
}

export const shouldCreateWorkOrderFromInspection = (
    outOfService: boolean | undefined,
    violations: ViolationItem[] = []
) => {
    if (outOfService) return true;
    return violations.some((violation) => violation.oos);
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
        // Prepare payload with all new fields
        const payload = {
            date: inspection.date,
            report_number: inspection.report_number,
            description: inspection.description || `Driver: ${inspection.driver_name}, Vehicle: ${inspection.vehicle_name}`,

            // Driver/Vehicle IDs if present
            // driver_id: inspection.driver_id, // Still handling text vs UUID issue, omitting if not valid UUID

            // Admin
            time_started: inspection.time_started || null,
            time_ended: inspection.time_ended || null,
            location: inspection.location,
            inspection_level: inspection.inspection_level,
            officer_name: inspection.officer_name,
            badge_number: inspection.badge_number,

            // Carrier
            carrier_name: inspection.carrier_name,
            carrier_address: inspection.carrier_address,
            usdot_number: inspection.usdot_number,

            // Driver Details
            driver_dob: inspection.driver_dob,
            driver_license_number: inspection.driver_license_number,
            driver_license_state: inspection.driver_license_state,
            medical_cert_status: inspection.medical_cert_status,

            // Vehicle Details
            vehicle_type: inspection.vehicle_type,
            plate_number: inspection.plate_number,
            plate_state: inspection.plate_state,
            vin: inspection.vin,
            odometer: inspection.odometer,
            cargo_info: inspection.cargo_info,

            // Violations
            violation_code: inspection.violations_count?.toString(),
            violations_data: inspection.violations_data || [],
            out_of_service: inspection.out_of_service || false,
        };

        const { data, error } = await supabase
            .from('inspections')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Helper to upload file would go here
};
