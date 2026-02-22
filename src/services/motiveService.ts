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

const requestJson = async <T>(url: string, fallback: T): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`HTTP ${response.status}: ${details.slice(0, 200)}`);
        }

        return (await response.json()) as T;
    } catch (error) {
        console.warn(`Motive request failed for ${url}`, error);
        return fallback;
    } finally {
        clearTimeout(timer);
    }
};

export const motiveService = {
    async getDrivers(page = 1, perPage = 100) {
        return requestJson(`/api/motive/drivers?page=${page}&per_page=${perPage}`, {
            drivers: [],
            degraded: true
        });
    },

    async getScores(startDate: string, endDate: string) {
        return requestJson(`/api/motive/scores?start_date=${startDate}&end_date=${endDate}`, {
            users: [],
            degraded: true
        });
    },

    async getEvents(startTime: string, endTime: string, page = 1, perPage = 100) {
        return requestJson(`/api/motive/events?start_time=${startTime}&end_time=${endTime}&page=${page}&per_page=${perPage}`, {
            events: [],
            degraded: true
        });
    },

    async getIntegrationHealth() {
        return requestJson('/api/integrations/health', {
            status: 'down',
            integrations: [],
            checkedAt: new Date().toISOString()
        });
    }
};
