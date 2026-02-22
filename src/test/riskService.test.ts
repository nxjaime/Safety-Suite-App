import { describe, it, expect } from 'vitest';
import { computeLocalScore, computeCompositeScore, getBand } from '../services/riskService';

describe('riskService scoring helpers', () => {
    it('computes local score with weights and clamps', () => {
        const score = computeLocalScore([
            { event_type: 'Speeding', severity: 2 },
            { event_type: 'Accident', severity: 3 },
        ]);
        // Speeding: 8*2=16, Accident:15*3=45, base 20 -> 81
        expect(score).toBe(81);
    });

    it('falls back when motive score missing', () => {
        const score = computeCompositeScore(null, 70);
        // motive fallback 60 -> 0.6*60 + 0.4*70 = 64
        expect(score).toBe(64);
    });

    it('blends motive and local and clamps to 100', () => {
        const score = computeCompositeScore(95, 100);
        expect(score).toBe(97); // 0.6*95 + 0.4*100 = 97
        const clamped = computeCompositeScore(200, 200);
        expect(clamped).toBe(100);
    });

    it('assigns correct bands', () => {
        expect(getBand(20)).toBe('green');
        expect(getBand(70)).toBe('yellow');
        expect(getBand(90)).toBe('red');
    });
});
