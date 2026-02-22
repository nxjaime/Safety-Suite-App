import { describe, expect, it } from 'vitest';
import { workOrderStatusPipeline } from '../pages/WorkOrders';

describe('work order status pipeline', () => {
    it('matches approved workflow order', () => {
        expect(workOrderStatusPipeline).toEqual([
            'Draft',
            'Approved',
            'In Progress',
            'Completed',
            'Closed',
        ]);
    });
});
