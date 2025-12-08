import { supabase } from '../lib/supabase';
import type { Driver, RiskEvent } from '../types';

const mapDriverData = (data: any): Driver => {
    return {
        ...data,
        riskScore: data.risk_score,
        yearsOfService: data.years_of_service,
        driverManager: data.driver_manager,
        employeeId: data.employee_id,
        licenseNumber: data.license_number,
        hireDate: data.hire_date,
        riskEvents: data.risk_events ? data.risk_events.map((e: any) => ({
            ...e,
            driverId: e.driver_id
        })) : [],
        coachingPlans: data.coaching_plans ? data.coaching_plans.map((p: any) => ({
            ...p,
            driverId: p.driver_id,
            startDate: p.start_date,
            durationWeeks: p.duration_weeks,
            weeklyCheckIns: p.weekly_check_ins
        })) : [],
        // trainingHistory vs training_history? Assuming simple match or missing for now
        trainingHistory: data.training_history
    };
};

export const driverService = {
    async fetchDrivers(): Promise<Driver[]> {
        const { data, error } = await supabase
            .from('drivers')
            .select(`
                *,
                risk_events (*),
                coaching_plans (*)
            `)
            .order('name');

        if (error) throw error;
        return data.map(mapDriverData);
    },

    async getDriverById(id: string): Promise<Driver | null> {
        const { data, error } = await supabase
            .from('drivers')
            .select(`
                *,
                risk_events (*),
                coaching_plans (*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return mapDriverData(data);
    },

    async createDriver(driver: Omit<Driver, 'id'> | any) {
        const dbDriver = {
            name: driver.name,
            status: driver.status,
            terminal: driver.terminal,
            risk_score: driver.riskScore || 20,
            years_of_service: driver.yearsOfService,
            employee_id: driver.employeeId,
            image: driver.image,
            address: driver.address,
            ssn: driver.ssn,
            phone: driver.phone,
            license_number: driver.licenseNumber,
            email: driver.email,
            hire_date: driver.hireDate,
            driver_manager: driver.driverManager
        };

        const { data, error } = await supabase
            .from('drivers')
            .insert([dbDriver])
            .select()
            .single();

        if (error) throw error;
        return mapDriverData(data);
    },

    async updateDriver(id: string, updates: Partial<Driver> | any) {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.terminal) dbUpdates.terminal = updates.terminal;
        if (updates.riskScore !== undefined) dbUpdates.risk_score = updates.riskScore;
        if (updates.yearsOfService !== undefined) dbUpdates.years_of_service = updates.yearsOfService;
        if (updates.employeeId) dbUpdates.employee_id = updates.employeeId;
        if (updates.image) dbUpdates.image = updates.image;
        if (updates.address) dbUpdates.address = updates.address;
        if (updates.ssn) dbUpdates.ssn = updates.ssn;
        if (updates.phone) dbUpdates.phone = updates.phone;
        if (updates.licenseNumber) dbUpdates.license_number = updates.licenseNumber;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.hireDate) dbUpdates.hire_date = updates.hireDate;
        if (updates.driverManager) dbUpdates.driver_manager = updates.driverManager;

        // Notes or arrays might need special handling if stored as JSONB
        if (updates.notes) dbUpdates.notes = updates.notes;

        const { data, error } = await supabase
            .from('drivers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapDriverData(data);
    },

    async deleteDriver(id: string) {
        const { error } = await supabase
            .from('drivers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async addRiskEvent(driverId: string, event: Omit<RiskEvent, 'id'>) {
        const { data, error } = await supabase
            .from('risk_events')
            .insert([
                {
                    driver_id: driverId,
                    date: event.date,
                    type: event.type,
                    points: event.points,
                    notes: event.notes
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async addCoachingPlan(driverId: string, driverName: string, plan: any) {
        const { data: planData, error: planError } = await supabase
            .from('coaching_plans')
            .insert([
                {
                    driver_id: driverId,
                    type: plan.type,
                    start_date: plan.startDate,
                    duration_weeks: plan.durationWeeks,
                    status: plan.status,
                    weekly_check_ins: plan.weeklyCheckIns
                }
            ])
            .select()
            .single();

        if (planError) throw planError;

        // specific type for checkIn
        const tasksToCreate = plan.weeklyCheckIns.map((checkIn: any) => ({
            title: `Coaching Check-in: ${driverName} (Week ${checkIn.week})`,
            description: `Review metrics and discuss progress for ${plan.type} plan.`,
            due_date: checkIn.date,
            priority: 'Medium',
            status: 'Pending',
            assignee: 'Safety Manager', // Default
            type: 'Coaching',
            related_id: planData.id // Link to the plan
        }));

        const { error: tasksError } = await supabase
            .from('tasks')
            .insert(tasksToCreate);

        if (tasksError) {
            console.error('Failed to create tasks for coaching plan', tasksError);
            // Not throwing here to avoid rolling back the plan creation if tasks fail, 
            // but could potentially want strictly transactional behavior. 
            // For now, logging is sufficient.
        }

        return planData;
    },

    async deleteCoachingPlan(planId: string) {
        // Also delete related tasks? Supabase might define cascade, but let's assume cascade or leave tasks.
        // Usually safe to just delete the plan if tasks have on delete cascade.
        const { error } = await supabase
            .from('coaching_plans')
            .delete()
            .eq('id', planId);

        if (error) throw error;
    },

    async getDriverDocuments(driverId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('driver_documents')
            .select('*')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id,
            driverId: d.driver_id,
            name: d.name,
            type: d.type,
            url: d.url,
            notes: d.notes,
            expiryDate: d.expiry_date,
            date: d.created_at
        }));
    },

    async uploadDocument(driverId: string, doc: { name: string, type: string, notes?: string, expiryDate?: string, url?: string }) {
        const { data, error } = await supabase
            .from('driver_documents')
            .insert([{
                driver_id: driverId,
                name: doc.name,
                type: doc.type,
                notes: doc.notes,
                expiry_date: doc.expiryDate,
                url: doc.url
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteDocument(docId: string) {
        const { error } = await supabase
            .from('driver_documents')
            .delete()
            .eq('id', docId);

        if (error) throw error;
    },

    async updateCoachingPlan(planId: string, updates: any) {
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        // Explicitly map camelCase to snake_case for DB
        if (updates.weeklyCheckIns) dbUpdates.weekly_check_ins = updates.weeklyCheckIns;

        const { data, error } = await supabase
            .from('coaching_plans')
            .update(dbUpdates)
            .eq('id', planId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateDriverScore(driverId: string, newScore: number) {
        const { error } = await supabase
            .from('drivers')
            .update({ risk_score: newScore })
            .eq('id', driverId);

        if (error) throw error;
    }
};
