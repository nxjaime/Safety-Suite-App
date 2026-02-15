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

export const motiveService = {
    async getDrivers(page = 1, perPage = 100) {
        const response = await fetch(`/api/motive/drivers?page=${page}&per_page=${perPage}`);
        if (!response.ok) throw new Error('Failed to fetch Motive drivers');
        return response.json();
    },

    async getScores(startDate: string, endDate: string) {
        const response = await fetch(`/api/motive/scores?start_date=${startDate}&end_date=${endDate}`);
        if (!response.ok) throw new Error('Failed to fetch Motive scores');
        return response.json();
    },

    async getEvents(startTime: string, endTime: string, page = 1, perPage = 100) {
        const response = await fetch(`/api/motive/events?start_time=${startTime}&end_time=${endTime}&page=${page}&per_page=${perPage}`);
        if (!response.ok) throw new Error('Failed to fetch Motive events');
        return response.json();
    }
};
