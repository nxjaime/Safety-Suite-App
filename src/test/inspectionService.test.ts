import { describe, it, expect } from 'vitest';
import { shouldCreateWorkOrderFromInspection } from '../services/inspectionService';

describe('inspectionService helpers', () => {
  it('returns true if outOfService flag set', () => {
    expect(shouldCreateWorkOrderFromInspection(true, [])).toBe(true);
  });

  it('returns true if any violation has oos true', () => {
    expect(shouldCreateWorkOrderFromInspection(false, [{ code: 'A', description: '', type: 'Vehicle', oos: true }])).toBe(true);
  });

  it('returns false when no criteria met', () => {
    expect(shouldCreateWorkOrderFromInspection(false, [{ code: 'A', description: '', type: 'Vehicle', oos: false }])).toBe(false);
  });
});