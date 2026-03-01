import { describe, expect, it } from 'vitest';
import { canTransitionStatus, canApproveWorkOrder } from '../services/workOrderService';

describe('work order status transitions', () => {
    it('allows admin to approve draft work orders', () => {
        expect(canApproveWorkOrder('admin')).toBe(true);
        expect(canTransitionStatus('Draft', 'Approved', 'admin')).toBe(true);
    });

    it('blocks viewer from approving draft work orders', () => {
        expect(canApproveWorkOrder('viewer')).toBe(false);
        expect(canTransitionStatus('Draft', 'Approved', 'viewer')).toBe(false);
    });

    it('allows approved to move in progress', () => {
        expect(canTransitionStatus('Approved', 'In Progress')).toBe(true);
    });

    it('blocks invalid status jumps', () => {
        expect(canTransitionStatus('Draft', 'Completed')).toBe(false);
        expect(canTransitionStatus('Closed', 'In Progress')).toBe(false);
    });

    it('allows draft and approved to cancel', () => {
        expect(canTransitionStatus('Draft', 'Cancelled')).toBe(true);
        expect(canTransitionStatus('Approved', 'Cancelled')).toBe(true);
    });
});
