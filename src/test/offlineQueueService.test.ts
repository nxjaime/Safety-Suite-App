import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Inspection } from '../services/inspectionService';
import type { WorkOrder } from '../types';
import {
  clearOfflineQueue,
  enqueueInspectionSubmission,
  enqueueWorkOrderCloseout,
  enqueueWorkOrderTransition,
  flushOfflineQueue,
  getOfflineQueueCount,
} from '../services/offlineQueueService';

describe('offlineQueueService', () => {
  beforeEach(async () => {
    vi.stubGlobal('indexedDB', undefined);
    await clearOfflineQueue();
  });

  it('queues and flushes inspection submissions and work-order updates in order', async () => {
    await enqueueInspectionSubmission(
      {
        date: '2026-05-01',
        report_number: 'RPT-100',
        vehicle_name: 'Truck 12',
        out_of_service: true,
      },
      {
        createFollowUpWorkOrder: true,
        followUpWorkOrderDraft: {
          equipmentId: 'eq-1',
          title: 'Inspection OOS: Truck 12',
          description: 'Auto-generated from inspection out-of-service status.',
          priority: 'High',
        },
      }
    );

    await enqueueWorkOrderTransition('wo-1', 'Completed', { completedAt: '2026-05-01T12:00:00.000Z' });
    await enqueueWorkOrderCloseout('wo-2', 'Repaired and tested', 'Technician A');

    expect(await getOfflineQueueCount()).toBe(3);

    const handlers = {
      createInspection: vi.fn(async (payload: Partial<Inspection>) => ({
        id: 'insp-1',
        date: payload.date || '2026-05-01',
        report_number: payload.report_number || 'RPT-100',
      } as Inspection)),
      createWorkOrderFromInspection: vi.fn(async () => ({ id: 'wo-new' } as WorkOrder)),
      updateWorkOrder: vi.fn(async () => ({ id: 'wo-1' } as WorkOrder)),
      closeWorkOrder: vi.fn(async () => ({ id: 'wo-2' } as WorkOrder)),
    };

    const result = await flushOfflineQueue(handlers);

    expect(handlers.createInspection).toHaveBeenCalledTimes(1);
    expect(handlers.createWorkOrderFromInspection).toHaveBeenCalledWith(
      'insp-1',
      expect.objectContaining({ title: 'Inspection OOS: Truck 12', priority: 'High' })
    );
    expect(handlers.updateWorkOrder).toHaveBeenCalledWith(
      'wo-1',
      expect.objectContaining({ status: 'Completed', completedAt: '2026-05-01T12:00:00.000Z' })
    );
    expect(handlers.closeWorkOrder).toHaveBeenCalledWith('wo-2', 'Repaired and tested', 'Technician A');
    expect(result).toEqual({ processed: 3, failed: 0, remaining: 0 });
    expect(await getOfflineQueueCount()).toBe(0);
  });
});
