// Carrier Health Service - SAFER/CSA Data Scraping
// Uses web scraping to fetch carrier data from FMCSA SAFER website

export interface CarrierHealth {
    dotNumber: string;
    mcNumber?: string;
    legalName: string;
    dbaName?: string;
    entityType: string;
    operatingStatus: string;
    saferRating?: string;
    outOfServiceDate?: string;
    powerUnits: number;
    drivers: number;
    mcs150FormDate?: string;
    csaScores?: {
        unsafeDriving?: number;
        hoursOfService?: number;
        driverFitness?: number;
        controlledSubstances?: number;
        vehicleMaintenance?: number;
        hazmat?: number;
        crashIndicator?: number;
    };
    lastUpdated: string;
}

export interface CarrierSettings {
    id?: string;
    dotNumber?: string;
    mcNumber?: string;
    companyName?: string;
}

import { supabase } from '../lib/supabase';

export const carrierService = {
    // Save carrier settings to database
    async saveCarrierSettings(settings: CarrierSettings): Promise<void> {
        const { error } = await supabase
            .from('carrier_settings')
            .upsert([{
                id: settings.id || 'default',
                dot_number: settings.dotNumber,
                mc_number: settings.mcNumber,
                company_name: settings.companyName,
                updated_at: new Date().toISOString()
            }], { onConflict: 'id' });

        if (error) throw error;
    },

    // Get carrier settings from database
    async getCarrierSettings(): Promise<CarrierSettings | null> {
        try {
            const { data, error } = await supabase
                .from('carrier_settings')
                .select('*')
                .eq('id', 'default')
                .single();

            // Handle both "no rows" and "table doesn't exist" errors gracefully
            if (error) {
                // PGRST116 = no rows, PGRST205 = table doesn't exist
                if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.code === '42P01') {
                    return null;
                }
                console.error('Error fetching carrier settings:', error);
                return null;
            }

            if (!data) return null;

            return {
                id: data.id,
                dotNumber: data.dot_number,
                mcNumber: data.mc_number,
                companyName: data.company_name
            };
        } catch (error) {
            console.error('Error fetching carrier settings:', error);
            return null;
        }
    },

    // Fetch carrier health data from FMCSA SAFER
    // Note: This requires a backend proxy due to CORS
    async fetchCarrierHealth(dotNumber: string): Promise<CarrierHealth | null> {
        try {
            // In production, this would call a backend API that scrapes SAFER
            // For now, we'll use a mock API endpoint structure
            const response = await fetch(`/api/carrier-health?dot=${dotNumber}`);

            if (!response.ok) {
                // If API not available, return cached data from DB
                return this.getCachedCarrierHealth(dotNumber);
            }

            const data = await response.json();

            // Cache the result
            await this.cacheCarrierHealth(data);

            return data;
        } catch (error) {
            console.error('Failed to fetch carrier health:', error);
            return this.getCachedCarrierHealth(dotNumber);
        }
    },

    // Cache carrier health data
    async cacheCarrierHealth(health: CarrierHealth): Promise<void> {
        const { error } = await supabase
            .from('carrier_health_cache')
            .upsert([{
                dot_number: health.dotNumber,
                data: health,
                updated_at: new Date().toISOString()
            }], { onConflict: 'dot_number' });

        if (error) console.error('Failed to cache carrier health:', error);
    },

    // Get cached carrier health
    async getCachedCarrierHealth(dotNumber: string): Promise<CarrierHealth | null> {
        const { data, error } = await supabase
            .from('carrier_health_cache')
            .select('data')
            .eq('dot_number', dotNumber)
            .single();

        if (error) return null;
        return data?.data || null;
    },

    // Mock data for development/demo
    getMockCarrierHealth(dotNumber: string): CarrierHealth {
        return {
            dotNumber: dotNumber,
            legalName: 'Sample Trucking LLC',
            entityType: 'CARRIER',
            operatingStatus: 'AUTHORIZED',
            saferRating: 'SATISFACTORY',
            powerUnits: 25,
            drivers: 30,
            csaScores: {
                unsafeDriving: 45,
                hoursOfService: 62,
                driverFitness: 28,
                vehicleMaintenance: 55,
                crashIndicator: 38
            },
            lastUpdated: new Date().toISOString()
        };
    }
};
