import { describe, expect, it } from 'vitest';
import { maintenanceIntervals } from '../pages/Maintenance';

describe('maintenance intervals', () => {
    it('declares time, miles, and hours intervals', () => {
        expect(maintenanceIntervals).toEqual(['Days', 'Miles', 'Hours']);
    });
});
