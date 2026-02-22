import { supabase } from '../lib/supabase';
import type { Driver, RiskEvent } from '../types';
import { encryptData, decryptData } from '../utils/crypto';
import { riskService } from './riskService';

// Helper to handle encryption/decryption
const processDriverForStorage = async (driver: any) => {
    const processed = { ...driver };
    if (processed.ssn) {
        processed.ssn = await encryptData(processed.ssn);
    }
    return processed;
};

const processDriverFromStorage = async (driver: any) => {
    const processed = { ...driver };
    if (processed.ssn) {
        processed.ssn = await decryptData(processed.ssn);
    }
    return processed;
};

const mapDriverData = (data: any): Driver => {
    return {
        ...data,
        riskScore: data.risk_score,
        yearsOfService: data.years_of_service,
        driverManager: data.driver_manager,
        employeeId: data.employee_id,
        licenseNumber: data.license_number,
        licenseState: data.license_state,
        licenseRestrictions: data.license_restrictions,
        licenseEndorsements: data.license_endorsements,
        licenseExpirationDate: data.license_expiration_date,
        medicalCardIssueDate: data.medical_card_issue_date,
        medicalCardExpirationDate: data.medical_card_expiration_date,
        cpapRequired: data.cpap_required,
        hireDate: data.hire_date,
        riskEvents: data.risk_events ? data.risk_events.map((e: any) => ({
            ...e,
            driverId: e.driver_id,
            source: e.source,
            eventType: e.event_type || e.type,
            type: e.event_type || e.type,
            severity: e.severity,
            scoreDelta: e.score_delta,
            occurredAt: e.occurred_at || e.date
        })) : [],
        coachingPlans: data.coaching_plans ? data.coaching_plans.map((p: any) => ({
            ...p,
            driverId: p.driver_id,
            startDate: p.start_date,
            durationWeeks: p.duration_weeks,
            weeklyCheckIns: p.weekly_check_ins,
            targetScore: p.target_score,
            dueDate: p.due_date,
            outcome: p.outcome
        })) : [],
        // trainingHistory vs training_history? Assuming simple match or missing for now
        trainingHistory: data.training_history
    };
};

export const driverService = {
    async fetchDrivers(): Promise<Driver[]> {
        // Enforce org isolation logic if not already applied by RLS (but RLS handles it now)
        // Ideally we should also filter by org_id in query for performance, but let's rely on RLS for now 
        // or add .eq('organization_id', orgId) if available.
        // Since this method doesn't call _getOrgId, we rely on RLS.

        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .order('name');

        if (error) throw error;

        const decrypted = await Promise.all(data.map(d => processDriverFromStorage(d)));
        return decrypted.map(mapDriverData);
    },

    async fetchDriversDetailed(): Promise<Driver[]> {
        const { data, error } = await supabase
            .from('drivers')
            .select(`
                *,
                risk_events (*),
                coaching_plans (*)
            `)
            .order('name');

        if (error) throw error;
        const decrypted = await Promise.all(data.map(d => processDriverFromStorage(d)));
        return decrypted.map(mapDriverData);
    },

    async getDriverById(id: string): Promise<Driver | null> {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select(`
                    *,
                    risk_events (*),
                    coaching_plans (*)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching driver by ID:', error);
                // Try without the joins if there's an error
                const { data: simpleData, error: simpleError } = await supabase
                    .from('drivers')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (simpleError) {
                    console.error('Error fetching driver (simple):', simpleError);
                    return null;
                }
                const decrypted = await processDriverFromStorage(simpleData);
                return mapDriverData({ ...decrypted, risk_events: [], coaching_plans: [] });
            }
            const decrypted = await processDriverFromStorage(data);
            return mapDriverData(decrypted);
        } catch (error) {
            console.error('Exception in getDriverById:', error);
            return null;
        }
    },

    async createDriver(driver: Omit<Driver, 'id'> | any) {
        const orgId = await this._getOrgId();

        // Process encryption
        const driverWithEncryption = await processDriverForStorage(driver);

        const dbDriver = {
            organization_id: orgId,
            name: driverWithEncryption.name,
            status: driverWithEncryption.status,
            terminal: driverWithEncryption.terminal,
            risk_score: driverWithEncryption.riskScore || 20,
            years_of_service: driverWithEncryption.yearsOfService,
            employee_id: driverWithEncryption.employeeId,
            image: driverWithEncryption.image,
            address: driverWithEncryption.address,
            ssn: driverWithEncryption.ssn,
            phone: driverWithEncryption.phone,
            license_number: driverWithEncryption.licenseNumber,
            license_state: driverWithEncryption.licenseState,
            license_restrictions: driverWithEncryption.licenseRestrictions,
            license_endorsements: driverWithEncryption.licenseEndorsements,
            license_expiration_date: driverWithEncryption.licenseExpirationDate,
            medical_card_issue_date: driverWithEncryption.medicalCardIssueDate,
            medical_card_expiration_date: driverWithEncryption.medicalCardExpirationDate,
            cpap_required: driverWithEncryption.cpapRequired,
            email: driverWithEncryption.email,
            hire_date: driverWithEncryption.hireDate,
            driver_manager: driverWithEncryption.driverManager
        };

        const { data, error } = await supabase
            .from('drivers')
            .insert([dbDriver])
            .select()
            .single();

        if (error) throw error;

        const decrypted = await processDriverFromStorage(data);
        return mapDriverData(decrypted);
    },

    async upsertDrivers(drivers: Partial<Driver>[]) {
        const orgId = await this._getOrgId();

        // Process drivers in parallel to encrypt SSNs if present
        const processedDrivers = await Promise.all(drivers.map(d => processDriverForStorage(d)));

        const dbDrivers = processedDrivers.map(d => ({
            organization_id: orgId,
            motive_id: d.motive_id, // Ensure this is passed
            name: d.name,
            status: d.status || 'Active',
            terminal: d.terminal,
            risk_score: d.riskScore || 0,
            years_of_service: d.yearsOfService || 0,
            employee_id: d.employeeId,
            image: d.image,
            address: d.address,
            ssn: d.ssn,
            phone: d.phone,
            license_number: d.licenseNumber,
            email: d.email,
            hire_date: d.hireDate,
        }));

        const { data, error } = await supabase
            .from('drivers')
            .upsert(dbDrivers, { onConflict: 'motive_id' }) // Upsert based on motive_id
            .select();

        if (error) throw error;

        const decrypted = await Promise.all(data.map(d => processDriverFromStorage(d)));
        return decrypted.map(mapDriverData);
    },

    async createDriversBulk(drivers: Partial<Driver>[]) {
        const orgId = await this._getOrgId();

        // Process drivers in parallel to encrypt SSNs
        const processedDrivers = await Promise.all(drivers.map(d => processDriverForStorage(d)));

        const dbDrivers = processedDrivers.map(d => ({
            organization_id: orgId,
            name: d.name,
            status: d.status || 'Active',
            terminal: d.terminal,
            risk_score: d.riskScore || 0,
            years_of_service: d.yearsOfService || 0,
            employee_id: d.employeeId,
            image: d.image,
            address: d.address,
            ssn: d.ssn, // Encrypted
            phone: d.phone,
            license_number: d.licenseNumber,
            email: d.email,
            hire_date: d.hireDate,
        }));

        const { data, error } = await supabase
            .from('drivers')
            .insert(dbDrivers)
            .select();

        if (error) throw error;

        const decrypted = await Promise.all(data.map(d => processDriverFromStorage(d)));
        return decrypted.map(mapDriverData);
    },

    async _getOrgId() {
        // Helper to get org ID, defaulting for now if not set
        // In real app, this might come from a context or the auth user
        // validating strict multi-tenancy.

        // For MVP/Demo:
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null; // Or throw error

        const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        return data?.organization_id;
    },

    async updateDriver(id: string, updates: Partial<Driver> | any) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.terminal !== undefined) dbUpdates.terminal = updates.terminal;
        if (updates.riskScore !== undefined) dbUpdates.risk_score = updates.riskScore;
        if (updates.yearsOfService !== undefined) dbUpdates.years_of_service = updates.yearsOfService;
        if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId;
        if (updates.image !== undefined) dbUpdates.image = updates.image;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.ssn !== undefined) {
            dbUpdates.ssn = await encryptData(updates.ssn);
        }
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.licenseNumber !== undefined) dbUpdates.license_number = updates.licenseNumber;
        if (updates.licenseState !== undefined) dbUpdates.license_state = updates.licenseState;
        if (updates.licenseRestrictions !== undefined) dbUpdates.license_restrictions = updates.licenseRestrictions;
        if (updates.licenseEndorsements !== undefined) dbUpdates.license_endorsements = updates.licenseEndorsements;
        if (updates.licenseExpirationDate !== undefined) dbUpdates.license_expiration_date = updates.licenseExpirationDate;
        if (updates.medicalCardIssueDate !== undefined) dbUpdates.medical_card_issue_date = updates.medicalCardIssueDate;
        if (updates.medicalCardExpirationDate !== undefined) dbUpdates.medical_card_expiration_date = updates.medicalCardExpirationDate;
        if (updates.cpapRequired !== undefined) dbUpdates.cpap_required = updates.cpapRequired;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.hireDate !== undefined) dbUpdates.hire_date = updates.hireDate;
        if (updates.driverManager !== undefined) dbUpdates.driver_manager = updates.driverManager;

        // Notes or arrays might need special handling if stored as JSONB
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

        const { data, error } = await supabase
            .from('drivers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        const decrypted = await processDriverFromStorage(data);
        return mapDriverData(decrypted);
    },


    async deleteDriver(id: string) {
        const { error } = await supabase
            .from('drivers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async addRiskEvent(driverId: string, event: Omit<RiskEvent, 'id'>) {
        const severity = event.severity ?? Math.max(1, Math.min(5, Math.round((event.points || 5) / 5)));
        const occurredAt = event.occurredAt || event.date || new Date().toISOString().split('T')[0];

        const data = await riskService.ingestEvent({
            driverId,
            source: event.source || 'manual',
            eventType: event.eventType || event.type,
            severity,
            occurredAt,
            metadata: event.metadata || (event.notes ? { notes: event.notes } : {}),
            scoreDelta: event.scoreDelta
        });

        await riskService.calculateScore(driverId, '90d');
        return data;
    },

    async refreshRiskScore(driverId: string, window = '90d') {
        return riskService.calculateScore(driverId, window);
    },

    async getDriverRiskScoreHistory(driverId: string, limit = 12) {
        return riskService.getScoreHistory(driverId, limit);
    },

    async getDriverRiskEvents(driverId: string, days = 90) {
        const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
        const { data, error } = await supabase
            .from('risk_events')
            .select('*')
            .eq('driver_id', driverId)
            .gte('occurred_at', cutoff)
            .order('occurred_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((e: any) => ({
            ...e,
            driverId: e.driver_id,
            source: e.source,
            eventType: e.event_type || e.type,
            type: e.event_type || e.type,
            severity: e.severity,
            scoreDelta: e.score_delta,
            occurredAt: e.occurred_at || e.date
        }));
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
                    weekly_check_ins: plan.weeklyCheckIns,
                    target_score: plan.targetScore,
                    due_date: plan.dueDate,
                    outcome: plan.outcome
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
        // First, delete all related tasks (coaching check-ins linked to this plan)
        const { error: tasksError } = await supabase
            .from('tasks')
            .delete()
            .eq('related_id', planId);

        if (tasksError) {
            console.error('Failed to delete related tasks:', tasksError);
            // Continue anyway - we still want to delete the plan
        }

        // Then delete the coaching plan itself
        const { error } = await supabase
            .from('coaching_plans')
            .delete()
            .eq('id', planId);

        if (error) {
            console.error('Failed to delete coaching plan:', error);
            console.error('Plan ID was:', planId);
            throw new Error(`Failed to delete coaching plan: ${error.message}`);
        }
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
    },

    async fetchDriversPaginated(
        page: number,
        pageSize: number,
        filters?: { search?: string; terminal?: string; status?: string }
    ): Promise<{ data: Driver[]; count: number }> {
        const orgId = await this._getOrgId();

        let query = supabase
            .from('drivers')
            .select(`
                *,
                coaching_plans (id, status)
            `, { count: 'exact' });

        if (orgId) {
            query = query.eq('organization_id', orgId);
        }


        if (filters?.search) {
            // Sanitize search input to prevent injection in PostgREST filter
            const safeSearch = filters.search.replace(/[.%]/g, '');
            query = query.or(`name.ilike.%${safeSearch}%,employee_id.ilike.%${safeSearch}%`);
        }
        if (filters?.terminal) {
            query = query.eq('terminal', filters.terminal);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query
            .order('name')
            .range(from, to);

        if (error) throw error;

        return {
            data: data ? data.map(mapDriverData) : [],
            count: count || 0
        };
    },

    async fetchSafetyStats() {
        const cutoff = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)).toISOString();
        const scoreCutoff = new Date(Date.now() - (180 * 24 * 60 * 60 * 1000)).toISOString();

        const [
            { data: drivers, error: driversError },
            { data: events, error: eventsError },
            { data: history, error: historyError },
            { count: coachingCount, error: coachError }
        ] = await Promise.all([
            supabase.from('drivers').select('id, risk_score'),
            supabase.from('risk_events').select('event_type, occurred_at').gte('occurred_at', cutoff),
            supabase.from('driver_risk_scores').select('score, as_of').gte('as_of', scoreCutoff).order('as_of', { ascending: true }),
            supabase.from('coaching_plans').select('*', { count: 'exact', head: true }).eq('status', 'Active')
        ]);

        if (driversError) throw driversError;
        if (eventsError) throw eventsError;
        if (historyError) throw historyError;
        if (coachError) throw coachError;

        const driverRows = drivers || [];
        const avgRisk = driverRows.length
            ? Math.round(driverRows.reduce((sum: number, d: any) => sum + (d.risk_score || 0), 0) / driverRows.length)
            : 0;

        const riskDistribution = driverRows.reduce((acc: { green: number; yellow: number; red: number }, driver: any) => {
            const score = driver.risk_score || 0;
            if (score >= 80) acc.red += 1;
            else if (score >= 50) acc.yellow += 1;
            else acc.green += 1;
            return acc;
        }, { green: 0, yellow: 0, red: 0 });

        const incidentTypeCounts = new Map<string, number>();
        (events || []).forEach((event: any) => {
            const key = event.event_type || 'Other';
            incidentTypeCounts.set(key, (incidentTypeCounts.get(key) || 0) + 1);
        });

        const topIncidentTypes = Array.from(incidentTypeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const scoreTrend = (history || []).slice(-12).map((entry: any) => ({
            asOf: entry.as_of,
            score: entry.score
        }));

        return {
            riskScore: avgRisk,
            incidentCount: (events || []).length,
            coachingCount: coachingCount || 0,
            riskDistribution,
            topIncidentTypes,
            scoreTrend
        };
    }
};
