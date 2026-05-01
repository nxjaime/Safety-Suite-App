import { describe, expect, it } from 'vitest';
import { equipmentProfileTabs } from '../pages/equipmentConstants';

describe('equipment profile tabs', () => {
    it('includes required tabs', () => {
        expect(equipmentProfileTabs).toEqual([
            'Overview',
            'Inspections',
            'Maintenance',
            'Work Orders',
            'Documents',
            'Service History',
        ]);
    });
});
