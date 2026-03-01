import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { WorkOrder, WorkOrderLineItem } from '../types';

export type WorkOrderStatus = 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'Closed' | 'Cancelled';
export type WorkOrderRole = 'admin' | 'manager' | 'viewer';

export const allowedTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    Draft: ['Approved', 'Cancelled'],
    Approved: ['In Progress', 'Cancelled'],
    'In Progress': ['Completed'],
    Completed: ['Closed'],
    Closed: [],
    Cancelled: [],
};

export const getNextStatuses = (current: WorkOrderStatus): WorkOrderStatus[] =>
    allowedTransitions[current] ?? [];

export const canApproveWorkOrder = (role?: WorkOrderRole) => {
    return role === 'admin' || role === 'manager';
};

export const canTransitionStatus = (
    current: WorkOrderStatus,
    next: WorkOrderStatus,
    role?: WorkOrderRole
) => {
    if (next === 'Approved') {
        return canApproveWorkOrder(role) && allowedTransitions[current].includes(next);
    }
    return (allowedTransitions[current] ?? []).includes(next);
};

const mapWorkOrder = (data: any): WorkOrder => ({
    ...data,
    equipmentId: data.equipment_id,
    organizationId: data.organization_id,
    inspectionId: data.inspection_id,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    assignedTo: data.assigned_to,
    dueDate: data.due_date,
    completedAt: data.completed_at,
    createdAt: data.created_at,
    totalPartsCost: data.total_parts_cost,
    totalLaborCost: data.total_labor_cost,
    totalCost: data.total_cost,
    lineItems: data.line_items?.map((item: any) => ({
        ...item,
        workOrderId: item.work_order_id,
        unitCost: item.unit_cost,
        totalCost: item.total_cost,
    })) ?? [],
});

export const workOrderService = {
    async getWorkOrders(): Promise<WorkOrder[]> {
        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('work_orders')
            .select('*, line_items:work_order_line_items(*)');
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapWorkOrder);
    },

    async createWorkOrder(order: Omit<WorkOrder, 'id'>, lineItems: Omit<WorkOrderLineItem, 'id' | 'workOrderId'>[] = []) {
        const orgId = await getCurrentOrganization();
        const { data, error } = await supabase
            .from('work_orders')
            .insert([
                {
                    organization_id: order.organizationId || orgId,
                    equipment_id: order.equipmentId || null,
                    inspection_id: order.inspectionId || null,
                    title: order.title,
                    description: order.description,
                    status: order.status,
                    priority: order.priority,
                    approved_by: order.approvedBy,
                    approved_at: order.approvedAt,
                    assigned_to: order.assignedTo,
                    due_date: order.dueDate,
                    total_parts_cost: order.totalPartsCost ?? 0,
                    total_labor_cost: order.totalLaborCost ?? 0,
                    total_cost: order.totalCost ?? 0,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        if (lineItems.length > 0) {
            const itemsPayload = lineItems.map((item) => ({
                work_order_id: data.id,
                type: item.type,
                description: item.description,
                quantity: item.quantity,
                unit_cost: item.unitCost,
                total_cost: item.totalCost,
            }));

            const { error: lineItemError } = await supabase
                .from('work_order_line_items')
                .insert(itemsPayload);

            if (lineItemError) throw lineItemError;
        }

        return mapWorkOrder({ ...data, line_items: lineItems });
    },

    async updateWorkOrder(id: string, updates: Partial<WorkOrder>) {
        const dbUpdates: Record<string, unknown> = {
            title: updates.title,
            description: updates.description,
            status: updates.status,
            priority: updates.priority,
            approved_by: updates.approvedBy,
            approved_at: updates.approvedAt,
            assigned_to: updates.assignedTo,
            due_date: updates.dueDate,
            total_parts_cost: updates.totalPartsCost,
            total_labor_cost: updates.totalLaborCost,
            total_cost: updates.totalCost,
        };
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
        if (updates.status === 'Completed' && updates.completedAt === undefined) {
            dbUpdates.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('work_orders')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapWorkOrder(data);
    },

    /** Backlog = not Completed/Closed/Cancelled */
    getBacklogCount(orders: WorkOrder[]): number {
        return orders.filter(o => !['Completed', 'Closed', 'Cancelled'].includes(o.status)).length;
    },

    /** Overdue = due_date in past and not completed/closed/cancelled */
    getOverdueCount(orders: WorkOrder[]): number {
        const today = new Date().toISOString().split('T')[0];
        return orders.filter(o => {
            if (['Completed', 'Closed', 'Cancelled'].includes(o.status)) return false;
            return o.dueDate && o.dueDate < today;
        }).length;
    },

    /** Mean time to repair: average days from created_at to completed_at for Completed/Closed orders */
    getMTTRDays(orders: WorkOrder[]): number | null {
        const completed = orders.filter(o => (o.status === 'Completed' || o.status === 'Closed') && o.completedAt);
        if (completed.length === 0) return null;
        const totalDays = completed.reduce((sum, o) => {
            const created = o.createdAt;
            if (!created || !o.completedAt) return sum;
            const ms = new Date(o.completedAt).getTime() - new Date(created).getTime();
            return sum + ms / (1000 * 60 * 60 * 24);
        }, 0);
        return Math.round((totalDays / completed.length) * 10) / 10;
    },
};
