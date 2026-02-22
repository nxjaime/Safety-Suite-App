import { describe, expect, it } from 'vitest';
import { shouldCreateWorkOrderFromInspection } from '../services/inspectionService';

const violations = [
    { code: '111', description: 'Brake issue', type: 'Vehicle' as const, oos: false },
    { code: '222', description: 'Lights', type: 'Vehicle' as const, oos: true },
];

describe('inspection work order trigger', () => {
    it('returns true when explicit out-of-service flag is set', () => {
        expect(shouldCreateWorkOrderFromInspection(true, [])).toBe(true);
    });

    it('returns true when any violation is out-of-service', () => {
        expect(shouldCreateWorkOrderFromInspection(false, violations)).toBe(true);
    });

    it('returns false when no out-of-service flag or violations', () => {
        expect(shouldCreateWorkOrderFromInspection(false, [])).toBe(false);
    });
});
