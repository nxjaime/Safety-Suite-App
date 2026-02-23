import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { WorkOrder, WorkOrderLineItem } from '../types';

export type WorkOrderStatus = 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'Closed';
export type WorkOrderRole = 'admin' | 'manager' | 'viewer';

const allowedTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    Draft: ['Approved'],
    Approved: ['In Progress'],
    'In Progress': ['Completed'],
    Completed: ['Closed'],
    Closed: [],
};

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
    return allowedTransitions[current].includes(next);
};

const mapWorkOrder = (data: any): WorkOrder => ({
    ...data,
    equipmentId: data.equipment_id,
    organizationId: data.organization_id,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    assignedTo: data.assigned_to,
    dueDate: data.due_date,
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
        const { data, error } = await supabase
            .from('work_orders')
            .update({
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
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapWorkOrder(data);
    },
};
