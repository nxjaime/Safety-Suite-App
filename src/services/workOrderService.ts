import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { WorkOrder, WorkOrderLineItem } from '../types';
import { canManageFleet, type ProfileRole } from './authorizationService';

export type WorkOrderStatus = 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'Closed' | 'Cancelled';
export type WorkOrderRole = ProfileRole;

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
    return canManageFleet(role);
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
    createdFromTemplateId: data.created_from_template_id,
    repeatOfWorkOrderId: data.repeat_of_work_order_id,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    assignedTo: data.assigned_to,
    dueDate: data.due_date,
    completedAt: data.completed_at,
    createdAt: data.created_at,
    totalPartsCost: data.total_parts_cost,
    totalLaborCost: data.total_labor_cost,
    totalCost: data.total_cost,
    closeoutNotes: data.closeout_notes,
    closedBy: data.closed_by,
    lineItems: data.line_items?.map((item: any) => ({
        ...item,
        workOrderId: item.work_order_id,
        unitCost: item.unit_cost,
        totalCost: item.total_cost,
        laborHours: item.labor_hours,
        technician: item.technician,
    })) ?? [],
});

export const workOrderService = {
    async getWorkOrders(): Promise<WorkOrder[]> {
        const { data } = await this.getWorkOrdersPaginated(1, 1000);
        return data;
    },

    async getWorkOrdersPaginated(page: number, pageSize: number): Promise<{ data: WorkOrder[]; count: number }> {
        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('work_orders')
            .select('*, line_items:work_order_line_items(*)', { count: 'exact' });
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

        if (error) throw error;
        return { data: (data || []).map(mapWorkOrder), count: count || 0 };
    },

    async createWorkOrder(order: Omit<WorkOrder, 'id'>, lineItems: Omit<WorkOrderLineItem, 'id' | 'workOrderId'>[] = [], _role?: WorkOrderRole) {
        const orgId = await getCurrentOrganization();
        const { data, error } = await supabase
            .from('work_orders')
            .insert([
                {
                    organization_id: order.organizationId || orgId,
                    equipment_id: order.equipmentId || null,
                    inspection_id: order.inspectionId || null,
                    created_from_template_id: order.createdFromTemplateId || null,
                    repeat_of_work_order_id: order.repeatOfWorkOrderId || null,
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

    /** Create a work order directly from an inspection defect */
    async createWorkOrderFromInspection(
        inspectionId: string,
        details: { equipmentId?: string; title: string; description?: string; priority?: WorkOrder['priority'] },
        role?: WorkOrderRole
    ): Promise<WorkOrder> {
        return this.createWorkOrder({
            inspectionId,
            equipmentId: details.equipmentId,
            title: details.title,
            description: details.description || '',
            priority: details.priority || 'High',
            status: 'Draft',
        }, [], role);
    },

    /** Create a work order from a PM template (records template linkage) */
    async createWorkOrderFromTemplate(
        templateId: string,
        details: { equipmentId?: string; title: string; description?: string; dueDate?: string },
        _role?: WorkOrderRole
    ): Promise<WorkOrder> {
        const orgId = await getCurrentOrganization();
        const { data, error } = await supabase
            .from('work_orders')
            .insert([{
                organization_id: orgId,
                equipment_id: details.equipmentId || null,
                created_from_template_id: templateId,
                title: details.title,
                description: details.description || '',
                status: 'Draft',
                priority: 'Medium',
                due_date: details.dueDate || null,
                total_parts_cost: 0,
                total_labor_cost: 0,
                total_cost: 0,
            }])
            .select()
            .single();
        if (error) throw error;
        return mapWorkOrder({ ...data, line_items: [] });
    },

    /** Close out a completed work order with sign-off notes */
    async closeOut(
        id: string,
        closeoutNotes: string,
        closedBy: string,
        _role?: WorkOrderRole
    ): Promise<WorkOrder> {
        const { data, error } = await supabase
            .from('work_orders')
            .update({
                status: 'Closed',
                closeout_notes: closeoutNotes,
                closed_by: closedBy,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return mapWorkOrder(data);
    },

    /** SLA compliance: % of closed/completed orders that were finished on or before due date */
    getSLACompliance(orders: WorkOrder[]): number | null {
        const withDue = orders.filter(o =>
            (o.status === 'Completed' || o.status === 'Closed') && o.completedAt && o.dueDate
        );
        if (withDue.length === 0) return null;
        const onTime = withDue.filter(o => o.completedAt! <= o.dueDate!).length;
        return Math.round((onTime / withDue.length) * 100);
    },

    /** Repeat service count: work orders that reference a prior work order */
    getRepeatServiceCount(orders: WorkOrder[]): number {
        return orders.filter(o => o.repeatOfWorkOrderId).length;
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
