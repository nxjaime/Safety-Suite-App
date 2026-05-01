import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Inspection } from './inspectionService';
import type { WorkOrder } from '../types';
import type { WorkOrderStatus as WorkOrderTransitionStatus } from './workOrderService';

const DB_NAME = 'safety-suite-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'queue';

export type OfflineQueueItemType = 'inspection-submit' | 'work-order-transition' | 'work-order-closeout';

export interface OfflineQueueResult {
    processed: number;
    failed: number;
    remaining: number;
}

export interface OfflineQueueHandlers {
    createInspection: (payload: Partial<Inspection>) => Promise<Inspection>;
    createWorkOrderFromInspection: (
        inspectionId: string,
        details: {
            equipmentId?: string;
            title: string;
            description?: string;
            priority?: WorkOrder['priority'];
        }
    ) => Promise<WorkOrder>;
    updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<WorkOrder>;
    closeWorkOrder: (id: string, closeoutNotes: string, closedBy: string) => Promise<WorkOrder>;
}

export interface QueuedInspectionSubmission {
    id: string;
    type: 'inspection-submit';
    queuedAt: string;
    payload: Partial<Inspection>;
    createFollowUpWorkOrder: boolean;
    followUpWorkOrderDraft?: {
        equipmentId?: string;
        title: string;
        description?: string;
        priority?: WorkOrder['priority'];
    };
}

export interface QueuedWorkOrderTransition {
    id: string;
    type: 'work-order-transition';
    queuedAt: string;
    workOrderId: string;
    nextStatus: WorkOrderTransitionStatus;
    updates: Partial<WorkOrder>;
    baselineUpdatedAt?: string;
}

export interface QueuedWorkOrderCloseout {
    id: string;
    type: 'work-order-closeout';
    queuedAt: string;
    workOrderId: string;
    closeoutNotes: string;
    closedBy: string;
    baselineUpdatedAt?: string;
}

export type OfflineQueueItem = QueuedInspectionSubmission | QueuedWorkOrderTransition | QueuedWorkOrderCloseout;

interface QueueDbSchema extends DBSchema {
    queue: {
        key: string;
        value: OfflineQueueItem;
        indexes: { 'by-queued-at': string };
    };
}

const memoryQueue = new Map<string, OfflineQueueItem>();
let memoryClock = 0;

const nowISO = () => new Date().toISOString();
const queueId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    memoryClock += 1;
    return `offline-${Date.now()}-${memoryClock}`;
};

const hasIndexedDb = () => typeof indexedDB !== 'undefined' && indexedDB !== null;

let dbPromise: Promise<IDBPDatabase<QueueDbSchema>> | null = null;

const getDb = async () => {
    if (!hasIndexedDb()) return null;
    if (!dbPromise) {
        dbPromise = openDB<QueueDbSchema>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('by-queued-at', 'queuedAt');
            },
        });
    }
    return dbPromise;
};

const sortQueue = (items: OfflineQueueItem[]) => items.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));

export const getOfflineQueueItems = async (): Promise<OfflineQueueItem[]> => {
    const db = await getDb();
    if (!db) {
        return sortQueue(Array.from(memoryQueue.values()));
    }

    const items = await db.getAllFromIndex(STORE_NAME, 'by-queued-at');
    return sortQueue(items);
};

export const getOfflineQueueCount = async (): Promise<number> => {
    const db = await getDb();
    if (!db) return memoryQueue.size;
    return db.count(STORE_NAME);
};

export const clearOfflineQueue = async (): Promise<void> => {
    const db = await getDb();
    if (!db) {
        memoryQueue.clear();
        return;
    }
    await db.clear(STORE_NAME);
};

export const enqueueInspectionSubmission = async (
    payload: Partial<Inspection>,
    options: {
        createFollowUpWorkOrder: boolean;
        followUpWorkOrderDraft?: QueuedInspectionSubmission['followUpWorkOrderDraft'];
    }
): Promise<QueuedInspectionSubmission> => {
    const item: QueuedInspectionSubmission = {
        id: queueId(),
        type: 'inspection-submit',
        queuedAt: nowISO(),
        payload,
        createFollowUpWorkOrder: options.createFollowUpWorkOrder,
        followUpWorkOrderDraft: options.followUpWorkOrderDraft,
    };

    const db = await getDb();
    if (!db) {
        memoryQueue.set(item.id, item);
        return item;
    }

    await db.put(STORE_NAME, item);
    return item;
};

export const enqueueWorkOrderTransition = async (
    workOrderId: string,
    nextStatus: WorkOrderTransitionStatus,
    updates: Partial<WorkOrder>,
    baselineUpdatedAt?: string
): Promise<QueuedWorkOrderTransition> => {
    const item: QueuedWorkOrderTransition = {
        id: queueId(),
        type: 'work-order-transition',
        queuedAt: nowISO(),
        workOrderId,
        nextStatus,
        updates,
        baselineUpdatedAt,
    };

    const db = await getDb();
    if (!db) {
        memoryQueue.set(item.id, item);
        return item;
    }

    await db.put(STORE_NAME, item);
    return item;
};

export const enqueueWorkOrderCloseout = async (
    workOrderId: string,
    closeoutNotes: string,
    closedBy: string,
    baselineUpdatedAt?: string
): Promise<QueuedWorkOrderCloseout> => {
    const item: QueuedWorkOrderCloseout = {
        id: queueId(),
        type: 'work-order-closeout',
        queuedAt: nowISO(),
        workOrderId,
        closeoutNotes,
        closedBy,
        baselineUpdatedAt,
    };

    const db = await getDb();
    if (!db) {
        memoryQueue.set(item.id, item);
        return item;
    }

    await db.put(STORE_NAME, item);
    return item;
};

export const removeOfflineQueueItem = async (id: string): Promise<void> => {
    const db = await getDb();
    if (!db) {
        memoryQueue.delete(id);
        return;
    }
    await db.delete(STORE_NAME, id);
};

export const flushOfflineQueue = async (handlers: OfflineQueueHandlers): Promise<OfflineQueueResult> => {
    const items = await getOfflineQueueItems();
    let processed = 0;
    let failed = 0;

    for (const item of items) {
        try {
            if (item.type === 'inspection-submit') {
                const inspection = await handlers.createInspection(item.payload);
                if (item.createFollowUpWorkOrder && item.followUpWorkOrderDraft) {
                    await handlers.createWorkOrderFromInspection(inspection.id, item.followUpWorkOrderDraft);
                }
            } else if (item.type === 'work-order-transition') {
                const updates: Partial<WorkOrder> = {
                    ...item.updates,
                    status: item.nextStatus,
                };
                if (item.nextStatus === 'Completed' && updates.completedAt === undefined) {
                    updates.completedAt = nowISO();
                }
                await handlers.updateWorkOrder(item.workOrderId, updates);
            } else {
                await handlers.closeWorkOrder(item.workOrderId, item.closeoutNotes, item.closedBy);
            }
            await removeOfflineQueueItem(item.id);
            processed += 1;
        } catch (error) {
            console.error('Failed to flush offline queue item', item, error);
            failed += 1;
        }
    }

    return {
        processed,
        failed,
        remaining: await getOfflineQueueCount(),
    };
};

export const buildQueuedInspectionState = (
    payload: Partial<Inspection>,
    createFollowUpWorkOrder: boolean
): Inspection => ({
    id: queueId(),
    date: payload.date || nowISO().split('T')[0],
    report_number: payload.report_number || `OFFLINE-${nowISO().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}`,
    time_started: payload.time_started,
    time_ended: payload.time_ended,
    location: payload.location,
    inspection_level: payload.inspection_level,
    officer_name: payload.officer_name,
    badge_number: payload.badge_number,
    carrier_name: payload.carrier_name,
    carrier_address: payload.carrier_address,
    usdot_number: payload.usdot_number,
    driver_id: payload.driver_id,
    driver_name: payload.driver_name,
    driver_dob: payload.driver_dob,
    driver_license_number: payload.driver_license_number,
    driver_license_state: payload.driver_license_state,
    medical_cert_status: payload.medical_cert_status,
    vehicle_id: payload.vehicle_id,
    vehicle_name: payload.vehicle_name,
    vehicle_type: payload.vehicle_type,
    plate_number: payload.plate_number,
    plate_state: payload.plate_state,
    vin: payload.vin,
    odometer: payload.odometer,
    cargo_info: payload.cargo_info,
    violations_count: payload.violations_count ?? (payload.violations_data?.length || 0),
    violation_code: payload.violation_code,
    description: payload.description,
    violations_data: payload.violations_data,
    file_path: payload.file_path,
    status: createFollowUpWorkOrder ? 'Queued for sync' : 'Queued for sync',
    out_of_service: payload.out_of_service,
    defect_count: payload.defect_count ?? (payload.violations_data?.length || 0),
    remediation_status: payload.remediation_status || ((payload.violations_data?.length || 0) > 0 || payload.out_of_service ? 'Open' : 'Closed'),
    remediation_due_date: payload.remediation_due_date,
    remediation_notes: payload.remediation_notes,
    remediation_owner: payload.remediation_owner,
    remediation_closed_by: payload.remediation_closed_by,
    remediation_closed_at: payload.remediation_closed_at,
    remediation_evidence: payload.remediation_evidence,
});

export const buildFollowUpWorkOrderDraft = (payload: Partial<Inspection>) => ({
    equipmentId: payload.vehicle_id || undefined,
    title: `Inspection OOS: ${payload.vehicle_name || 'Vehicle'}`,
    description: 'Auto-generated from inspection out-of-service status.',
    priority: 'High' as const,
});

export const buildOptimisticWorkOrderTransition = (
    order: WorkOrder,
    nextStatus: WorkOrderTransitionStatus,
    updates: Partial<WorkOrder>
): WorkOrder => ({
    ...order,
    ...updates,
    status: nextStatus,
    completedAt: nextStatus === 'Completed' && updates.completedAt === undefined ? nowISO() : updates.completedAt ?? order.completedAt,
});

export const buildOptimisticWorkOrderCloseout = (
    order: WorkOrder,
    closeoutNotes: string,
    closedBy: string
): WorkOrder => ({
    ...order,
    status: 'Closed',
    closeoutNotes,
    closedBy,
    completedAt: order.completedAt || nowISO(),
});
