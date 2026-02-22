import { describe, expect, it } from 'vitest';
import { isTemplateDue } from '../services/maintenanceService';

describe('maintenance scheduling', () => {
    it('flags due by days interval', () => {
        const result = isTemplateDue({
            lastServiceDate: '2025-12-01',
            currentDate: '2026-01-05',
            intervalDays: 30,
        });
        expect(result).toBe(true);
    });

    it('flags due by mileage interval', () => {
        const result = isTemplateDue({
            lastServiceMiles: 10000,
            currentMiles: 17050,
            intervalMiles: 7000,
        });
        expect(result).toBe(true);
    });

    it('flags due by hours interval', () => {
        const result = isTemplateDue({
            lastServiceHours: 250,
            currentHours: 525,
            intervalHours: 250,
        });
        expect(result).toBe(true);
    });

    it('returns false when no interval threshold reached', () => {
        const result = isTemplateDue({
            lastServiceDate: '2026-01-10',
            currentDate: '2026-01-20',
            intervalDays: 30,
            lastServiceMiles: 12000,
            currentMiles: 14000,
            intervalMiles: 5000,
            lastServiceHours: 300,
            currentHours: 420,
            intervalHours: 300,
        });
        expect(result).toBe(false);
    });
});
