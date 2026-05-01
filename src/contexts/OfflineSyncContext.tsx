import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import type { Inspection } from '../services/inspectionService';
import { inspectionService, shouldCreateWorkOrderFromInspection } from '../services/inspectionService';
import type { WorkOrder } from '../types';
import { workOrderService, type WorkOrderStatus } from '../services/workOrderService';
import {
    buildFollowUpWorkOrderDraft,
    buildOptimisticWorkOrderCloseout,
    buildOptimisticWorkOrderTransition,
    buildQueuedInspectionState,
    clearOfflineQueue,
    enqueueInspectionSubmission,
    enqueueWorkOrderCloseout,
    enqueueWorkOrderTransition,
    flushOfflineQueue,
    getOfflineQueueCount,
} from '../services/offlineQueueService';

interface OfflineSyncContextType {
    isOnline: boolean;
    pendingCount: number;
    lastSyncedAt: Date | null;
    lastSyncMessage: string | null;
    syncNow: () => Promise<void>;
    submitInspection: (payload: Partial<Inspection>) => Promise<{ inspection: Inspection; queued: boolean }>;
    transitionWorkOrderStatus: (order: WorkOrder, nextStatus: WorkOrderStatus) => Promise<{ order: WorkOrder; queued: boolean }>;
    closeWorkOrder: (order: WorkOrder, closeoutNotes: string, closedBy: string) => Promise<{ order: WorkOrder; queued: boolean }>;
    refreshPendingCount: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

const resolveWorkOrderTransition = (nextStatus: WorkOrderStatus) => {
    const updates: Partial<WorkOrder> = { status: nextStatus };

    if (nextStatus === 'Approved') {
        updates.approvedAt = new Date().toISOString();
        updates.approvedBy = 'Current User';
    }

    if (nextStatus === 'Completed') {
        updates.completedAt = new Date().toISOString();
    }

    return updates;
};

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
    const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
    const onlineRef = useRef(navigator.onLine);

    const refreshPendingCount = useCallback(async () => {
        const count = await getOfflineQueueCount();
        setPendingCount(count);
    }, []);

    const syncNow = useCallback(async () => {
        if (!onlineRef.current) {
            setIsOnline(false);
            setLastSyncMessage('Offline — queued changes will sync when connectivity returns.');
            return;
        }

        const result = await flushOfflineQueue({
            createInspection: (payload) => inspectionService.createInspection(payload),
            createWorkOrderFromInspection: (inspectionId, details) => workOrderService.createWorkOrderFromInspection(inspectionId, details),
            updateWorkOrder: (id, updates) => workOrderService.updateWorkOrder(id, updates),
            closeWorkOrder: (id, closeoutNotes, closedBy) => workOrderService.closeOut(id, closeoutNotes, closedBy),
        });

        await refreshPendingCount();
        setLastSyncedAt(new Date());
        setLastSyncMessage(
            result.failed > 0
                ? `Synced ${result.processed} queued item(s); ${result.failed} need attention.`
                : result.processed > 0
                    ? `Synced ${result.processed} queued item(s).`
                    : 'No queued items to sync.'
        );

        if (result.processed > 0) {
            toast.success(result.failed > 0 ? 'Offline queue synced with warnings' : 'Offline queue synced');
        }
    }, [refreshPendingCount]);

    useEffect(() => {
        let cancelled = false;
        refreshPendingCount().catch(() => {});

        const handleOnline = () => {
            onlineRef.current = true;
            setIsOnline(true);
            syncNow().catch((error) => {
                console.error('Failed to sync offline queue', error);
                if (!cancelled) {
                    setLastSyncMessage('Could not sync queued changes right now.');
                }
            });
        };

        const handleOffline = () => {
            onlineRef.current = false;
            setIsOnline(false);
            setLastSyncMessage('Offline mode enabled. Changes will queue locally.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (navigator.onLine) {
            syncNow().catch((error) => {
                console.error('Initial offline queue sync failed', error);
                if (!cancelled) {
                    setLastSyncMessage('Could not sync queued changes right now.');
                }
            });
        } else {
            handleOffline();
        }

        return () => {
            cancelled = true;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [refreshPendingCount, syncNow]);

    const submitInspection = useCallback(async (payload: Partial<Inspection>) => {
        const needsFollowUp = shouldCreateWorkOrderFromInspection(payload.out_of_service, payload.violations_data || []);
        const followUpWorkOrderDraft = needsFollowUp ? buildFollowUpWorkOrderDraft(payload) : undefined;

        if (!onlineRef.current) {
            await enqueueInspectionSubmission(payload, {
                createFollowUpWorkOrder: needsFollowUp,
                followUpWorkOrderDraft,
            });
            const inspection = buildQueuedInspectionState(payload, needsFollowUp);
            await refreshPendingCount();
            setLastSyncMessage('Inspection queued offline.');
            return { inspection, queued: true };
        }

        const inspection = await inspectionService.createInspection(payload);
        if (needsFollowUp && followUpWorkOrderDraft) {
            await workOrderService.createWorkOrderFromInspection(inspection.id, followUpWorkOrderDraft);
        }
        await refreshPendingCount();
        return { inspection, queued: false };
    }, [refreshPendingCount]);

    const transitionWorkOrderStatus = useCallback(async (order: WorkOrder, nextStatus: WorkOrderStatus) => {
        const updates = resolveWorkOrderTransition(nextStatus);

        if (!onlineRef.current) {
            await enqueueWorkOrderTransition(order.id, nextStatus, updates, order.createdAt);
            await refreshPendingCount();
            setLastSyncMessage(`Work order ${order.title} queued for sync.`);
            return { order: buildOptimisticWorkOrderTransition(order, nextStatus, updates), queued: true };
        }

        const updated = await workOrderService.updateWorkOrder(order.id, updates);
        await refreshPendingCount();
        return { order: updated, queued: false };
    }, [refreshPendingCount]);

    const closeWorkOrder = useCallback(async (order: WorkOrder, closeoutNotes: string, closedBy: string) => {
        if (!onlineRef.current) {
            await enqueueWorkOrderCloseout(order.id, closeoutNotes, closedBy, order.createdAt);
            await refreshPendingCount();
            setLastSyncMessage(`Work order ${order.title} closeout queued for sync.`);
            return { order: buildOptimisticWorkOrderCloseout(order, closeoutNotes, closedBy), queued: true };
        }

        const updated = await workOrderService.closeOut(order.id, closeoutNotes, closedBy);
        await refreshPendingCount();
        return { order: updated, queued: false };
    }, [refreshPendingCount]);

    const value = useMemo(() => ({
        isOnline,
        pendingCount,
        lastSyncedAt,
        lastSyncMessage,
        syncNow,
        submitInspection,
        transitionWorkOrderStatus,
        closeWorkOrder,
        refreshPendingCount,
    }), [closeWorkOrder, isOnline, lastSyncMessage, lastSyncedAt, pendingCount, refreshPendingCount, submitInspection, syncNow, transitionWorkOrderStatus]);

    return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
};

export const useOfflineSync = () => {
    const context = useContext(OfflineSyncContext);
    if (!context) {
        throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
    }
    return context;
};

export const clearOfflineQueueAndRefresh = async () => {
    await clearOfflineQueue();
};
