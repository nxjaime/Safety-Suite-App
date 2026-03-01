import { describe, expect, it } from 'vitest';
import { workOrderStatusPipeline } from '../pages/WorkOrders';

describe('work order status pipeline', () => {
    it('includes all statuses including Cancelled', () => {
        expect(workOrderStatusPipeline).toContain('Draft');
        expect(workOrderStatusPipeline).toContain('Approved');
        expect(workOrderStatusPipeline).toContain('In Progress');
        expect(workOrderStatusPipeline).toContain('Completed');
        expect(workOrderStatusPipeline).toContain('Closed');
        expect(workOrderStatusPipeline).toContain('Cancelled');
    });
});
