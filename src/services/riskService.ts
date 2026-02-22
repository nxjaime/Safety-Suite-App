import { supabase } from '../lib/supabase';
import { motiveService } from './motiveService';

export type RiskBand = 'green' | 'yellow' | 'red';

const typeWeights: Record<string, number> = {
    Speeding: 8,
    'Hard Braking': 6,
    'HOS Violation': 7,
    Accident: 15,
    Citation: 5,
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export interface RiskEventInput {
    driver_id: string;
    organization_id?: string | null;
    source: string;
    event_type: string;
    severity: number;
    score_delta?: number | null;
    occurred_at: string;
    metadata?: any;
}

export interface ScoreParts {
    motive: number;
    local: number;
}

export const getBand = (score: number): RiskBand => {
    if (score >= 80) return 'red';
    if (score >= 50) return 'yellow';
    return 'green';
};

export const computeLocalScore = (events: { event_type: string; severity: number }[]): number => {
    const base = 20;
    const total = events.reduce((acc, ev) => {
        const weight = typeWeights[ev.event_type] ?? 5;
        return acc + weight * ev.severity;
    }, 0);
    return clamp(base + total, 0, 100);
};

export const computeCompositeScore = (motiveScore: number | null, localScore: number): number => {
    const motive = motiveScore ?? 60; // fallback
    const composite = Math.round(0.6 * motive + 0.4 * localScore);
    return clamp(composite, 0, 100);
};

export const riskService = {
    async ingestEvent(event: RiskEventInput) {
        const payload = {
            ...event,
            score_delta: event.score_delta ?? null,
            metadata: event.metadata ?? {},
        };
        const { error } = await supabase.from('risk_events').insert([payload]);
        if (error) throw error;
    },

    async fetchLocalEvents(driverId: string, windowDays = 90) {
        const since = new Date();
        since.setDate(since.getDate() - windowDays);
        const { data, error } = await supabase
            .from('risk_events')
            .select('event_type, severity, occurred_at')
            .eq('driver_id', driverId)
            .gte('occurred_at', since.toISOString())
            .order('occurred_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async calculateScore(driverId: string, organizationId?: string | null, window = 90) {
        // Fetch motive score (30d window)
        let motiveScore: number | null = null;
        try {
            const start = new Date();
            start.setDate(start.getDate() - 30);
            const end = new Date();
            const { users } = await motiveService.getScores(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
            if (users) {
                const match = users.find((u: any) => u.driver?.id === driverId || u.driver_id === driverId);
                if (match && typeof match.safety_score === 'number') motiveScore = match.safety_score;
            }
        } catch (err) {
            console.warn('Motive scores unavailable, using fallback', err);
        }

        const localEvents = await this.fetchLocalEvents(driverId, window);
        const localScore = computeLocalScore(localEvents);
        const score = computeCompositeScore(motiveScore, localScore);

        const { error: insertErr } = await supabase.from('driver_risk_scores').insert([
            {
                driver_id: driverId,
                organization_id: organizationId ?? null,
                score,
                composite_parts: { motive: motiveScore ?? 60, local: localScore },
                source_window: `${window}d`,
            },
        ]);
        if (insertErr) throw insertErr;

        const { error: updErr } = await supabase
            .from('drivers')
            .update({ risk_score: score })
            .eq('id', driverId);
        if (updErr) throw updErr;

        return { score, band: getBand(score), parts: { motive: motiveScore ?? 60, local: localScore } as ScoreParts };
    },

    async getScoreHistory(driverId: string, limit = 12) {
        const { data, error } = await supabase
            .from('driver_risk_scores')
            .select('*')
            .eq('driver_id', driverId)
            .order('as_of', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },
};
