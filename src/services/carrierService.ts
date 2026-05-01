import { supabase } from '../lib/supabase';

export interface CarrierInspectionSummary {
    usInspections: number;
    canadianInspections: number;
    totalInspections: number;
    outOfServiceInspections: number;
    outOfServiceRate: number;
    crashes: {
        fatal: number;
        injury: number;
        tow: number;
        total: number;
    };
    derivedAt: string;
    safetyRatingAsOf?: string;
}

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
    inspectionSummary?: CarrierInspectionSummary;
    csaScores?: {
        unsafeDriving?: number;
        hoursOfService?: number;
        driverFitness?: number;
        controlledSubstances?: number;
        vehicleMaintenance?: number;
        hazmat?: number;
        crashIndicator?: number;
    };
    csaDetails?: {
        [key: string]: {
            alert: boolean;
            violations?: number;
            measure?: string;
        }
    };
    lastUpdated: string;
    fmcsaAsOf?: string;
}

export interface CarrierSettings {
    id?: string;
    dotNumber?: string;
    mcNumber?: string;
    companyName?: string;
}

export type CarrierSafetyRating = 'SATISFACTORY' | 'CONDITIONAL' | 'UNSATISFACTORY' | 'OUT OF SERVICE' | 'NOT RATED' | 'NONE' | 'UNKNOWN';

export interface CarrierLookupResult {
    status: 'success' | 'degraded' | 'unavailable';
    source: 'live' | 'cache' | 'circuit-breaker' | 'api-error';
    health: CarrierHealth | null;
    message: string;
    belowThreshold: boolean;
    threshold: CarrierSafetyRating;
}

interface CarrierLookupOptions {
    threshold?: CarrierSafetyRating;
    retryDelayMs?: number;
    endpointUrl?: string;
    bypassCircuitBreaker?: boolean;
}

const DEFAULT_THRESHOLD: CarrierSafetyRating = 'CONDITIONAL';
const DEFAULT_ENDPOINT = '/api/carrier-health';
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000;
const lookupCircuit = {
    failures: 0,
    openUntil: 0,
};

const RATING_RANK: Record<string, number> = {
    'SATISFACTORY': 4,
    'CONDITIONAL': 3,
    'UNSATISFACTORY': 2,
    'OUT OF SERVICE': 1,
    'NOT RATED': 0,
    'NONE': 0,
    'UNKNOWN': 0,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeRating = (rating?: string | null): CarrierSafetyRating => {
    const normalized = rating?.trim().toUpperCase();
    if (!normalized) return 'UNKNOWN';
    if (normalized in RATING_RANK) return normalized as CarrierSafetyRating;
    return 'UNKNOWN';
};

const getRatingRank = (rating?: string | null): number => RATING_RANK[normalizeRating(rating)] ?? 0;

const buildUnavailableResult = (threshold: CarrierSafetyRating, message: string, source: CarrierLookupResult['source']): CarrierLookupResult => ({
    status: 'unavailable',
    source,
    health: null,
    message,
    belowThreshold: false,
    threshold,
});

const isCircuitOpen = () => lookupCircuit.openUntil > Date.now();

const recordFailure = () => {
    lookupCircuit.failures += 1;
    if (lookupCircuit.failures >= CIRCUIT_BREAKER_THRESHOLD) {
        lookupCircuit.openUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
    }
};

const recordSuccess = () => {
    lookupCircuit.failures = 0;
    lookupCircuit.openUntil = 0;
};

const buildRequestUrl = (dotNumber: string, endpointUrl?: string) => {
    const base = endpointUrl ?? DEFAULT_ENDPOINT;
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}dot=${encodeURIComponent(dotNumber)}`;
};

export const carrierService = {
    async saveCarrierSettings(settings: CarrierSettings): Promise<void> {
        const payload = {
            id: settings.id || 'default',
            dot_number: settings.dotNumber || null,
            mc_number: settings.mcNumber || null,
            company_name: settings.companyName || null,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('carrier_settings')
            .upsert([payload], { onConflict: 'id' });

        if (error) {
            console.error('Failed to save carrier settings:', error);
            console.error('Payload was:', payload);

            if (error.code === 'PGRST205' || error.message.includes('relation "public.carrier_settings" does not exist')) {
                throw new Error('Database configuration error: Carrier Settings table not found. Please contact support to run migrations.');
            }

            throw new Error(`Failed to save carrier settings: ${error.message}`);
        }
    },

    async getCarrierSettings(): Promise<CarrierSettings | null> {
        try {
            const { data, error } = await supabase
                .from('carrier_settings')
                .select('*')
                .eq('id', 'default')
                .single();

            if (error) {
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

    async lookupCarrierHealth(dotNumber: string, options: CarrierLookupOptions = {}): Promise<CarrierLookupResult> {
        const threshold = options.threshold ?? DEFAULT_THRESHOLD;
        const normalizedDot = dotNumber.trim();

        if (!normalizedDot) {
            return buildUnavailableResult(threshold, 'Enter a USDOT number to look up carrier health.', 'api-error');
        }

        if (!options.bypassCircuitBreaker && isCircuitOpen()) {
            const cached = await this.getCachedCarrierHealth(normalizedDot);
            if (cached) {
                return {
                    status: 'degraded',
                    source: 'circuit-breaker',
                    health: cached,
                    message: 'FMCSA carrier lookup is temporarily rate-limited. Showing the last cached snapshot.',
                    belowThreshold: this.isSafetyRatingBelowThreshold(cached.saferRating, threshold),
                    threshold,
                };
            }

            return buildUnavailableResult(threshold, 'FMCSA carrier lookup is temporarily unavailable. Please retry in a few minutes.', 'circuit-breaker');
        }

        let lastError: unknown = null;
        const retryDelayMs = options.retryDelayMs ?? 250;
        const endpointUrl = options.endpointUrl ?? DEFAULT_ENDPOINT;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                let response: Response;
                try {
                    response = await fetch(buildRequestUrl(normalizedDot, endpointUrl), { signal: controller.signal });
                } finally {
                    clearTimeout(timeout);
                }

                if (!response.ok) {
                    throw new Error(`FMCSA lookup failed with HTTP ${response.status}`);
                }

                const payload = await response.json() as unknown;
                let health: CarrierHealth | null = null;
                if (payload && typeof payload === 'object') {
                    const payloadRecord = payload as Record<string, unknown>;
                    if ('health' in payloadRecord && payloadRecord.health) {
                        health = payloadRecord.health as CarrierHealth;
                    } else if ('data' in payloadRecord && payloadRecord.data) {
                        health = payloadRecord.data as CarrierHealth;
                    } else if ('dotNumber' in payloadRecord) {
                        health = payload as CarrierHealth;
                    }
                }

                if (!health || !health.dotNumber) {
                    throw new Error('FMCSA lookup returned an empty carrier snapshot');
                }

                recordSuccess();
                await this.cacheCarrierHealth(health);

                return {
                    status: 'success',
                    source: 'live',
                    health,
                    message: 'Live FMCSA carrier snapshot loaded.',
                    belowThreshold: this.isSafetyRatingBelowThreshold(health.saferRating, threshold),
                    threshold,
                };
            } catch (error) {
                lastError = error;
                recordFailure();

                if (attempt < MAX_RETRIES) {
                    await sleep(retryDelayMs * attempt);
                    continue;
                }
            }
        }

        const cached = await this.getCachedCarrierHealth(normalizedDot);
        if (cached) {
            return {
                status: 'degraded',
                source: 'cache',
                health: cached,
                message: lastError instanceof Error
                    ? `FMCSA lookup unavailable (${lastError.message}). Showing the last cached snapshot.`
                    : 'FMCSA lookup unavailable. Showing the last cached snapshot.',
                belowThreshold: this.isSafetyRatingBelowThreshold(cached.saferRating, threshold),
                threshold,
            };
        }

        return buildUnavailableResult(
            threshold,
            lastError instanceof Error
                ? `FMCSA carrier lookup failed: ${lastError.message}`
                : 'FMCSA carrier lookup failed. Please try again later.',
            'api-error'
        );
    },

    async fetchCarrierHealth(dotNumber: string): Promise<CarrierHealth | null> {
        const result = await this.lookupCarrierHealth(dotNumber);
        return result.health;
    },

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

    async getCachedCarrierHealth(dotNumber: string): Promise<CarrierHealth | null> {
        const { data, error } = await supabase
            .from('carrier_health_cache')
            .select('data')
            .eq('dot_number', dotNumber)
            .single();

        if (error) return null;
        return data?.data || null;
    },

    isSafetyRatingBelowThreshold(rating: string | undefined, threshold: CarrierSafetyRating = DEFAULT_THRESHOLD): boolean {
        const normalizedRating = normalizeRating(rating);
        const normalizedThreshold = normalizeRating(threshold);
        return getRatingRank(normalizedRating) < getRatingRank(normalizedThreshold);
    },

    getCarrierLookupCircuitState() {
        return {
            failures: lookupCircuit.failures,
            openUntil: lookupCircuit.openUntil,
            isOpen: isCircuitOpen(),
        };
    },

    resetCarrierLookupCircuit() {
        lookupCircuit.failures = 0;
        lookupCircuit.openUntil = 0;
    },
};
