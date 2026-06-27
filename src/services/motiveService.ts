export interface MotiveDriver {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    status: string;
    phone?: string;
    driver_company_id?: string;
}

export interface MotiveScore {
    driver: {
        id: string;
        name: string;
    };
    safety_score: number;
    score_date: string;
    distance_driven_meters: number;
    drive_time_seconds: number;
    event_counts: {
        hard_brake: number;
        hard_accel: number;
        hard_corner: number;
        speeding: number;
    };
}

export interface MotiveEvent {
    id: string;
    event_type: string;
    event_start_time: string;
    vehicle_id: string;
    driver_id: string;
    location?: string;
    severity?: string;
}

export const MOTIVE_UNSUPPORTED_MESSAGE = 'Motive integration is not enabled for this product.';

const unsupported = <T extends Record<string, unknown>>(payload: T) => ({
    ...payload,
    unsupported: true,
    degraded: true,
    message: MOTIVE_UNSUPPORTED_MESSAGE
});

export const motiveService = {
    async getDrivers() {
        return unsupported({ drivers: [] as MotiveDriver[] });
    },

    async getScores() {
        return unsupported({ users: [] as MotiveScore[] });
    },

    async getEvents() {
        return unsupported({ events: [] as MotiveEvent[] });
    },

    async getIntegrationHealth() {
        return {
            status: 'disabled',
            integrations: [
                {
                    name: 'motive',
                    status: 'disabled',
                    message: MOTIVE_UNSUPPORTED_MESSAGE,
                    checkedAt: new Date().toISOString()
                }
            ],
            checkedAt: new Date().toISOString()
        };
    }
};
