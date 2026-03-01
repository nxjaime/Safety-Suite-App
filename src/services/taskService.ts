import { supabase, getCurrentOrganization } from '../lib/supabase';
import type { TaskItem } from '../types';

const mapTaskData = (data: any): TaskItem => {
    return {
        id: data.id,
        title: data.title,
        description: data.description,
        dueDate: data.due_date,
        priority: data.priority,
        status: data.status,
        organizationId: data.organization_id,
        assignee: data.assignee,
        type: data.type,
        relatedId: data.related_id,
        driverName: data.driver_name,
        driverId: data.driver_id,
        closedNotes: data.closed_notes,
        closedAt: data.closed_at
    };
};

export const taskService = {
    async fetchTasks(): Promise<TaskItem[]> {
        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('tasks')
            .select('*');
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
        return data.map(mapTaskData);
    },

    async addTask(task: Omit<TaskItem, 'id'>) {
        const orgId = await getCurrentOrganization();
        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                organization_id: orgId,
                title: task.title,
                description: task.description,
                due_date: task.dueDate,
                priority: task.priority,
                status: task.status,
                assignee: task.assignee,
                type: task.type,
                related_id: task.relatedId,
                driver_id: task.driverId,
                driver_name: task.driverName
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            throw error;
        }
        return mapTaskData(data);
    },

    async updateTask(id: string, updates: Partial<{
        title: string;
        description: string;
        dueDate: string;
        priority: string;
        status: string;
        assignee: string;
        driverId: string;
    }>) {
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
        if (updates.priority) dbUpdates.priority = updates.priority;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.assignee) dbUpdates.assignee = updates.assignee;
        if (updates.driverId) dbUpdates.driver_id = updates.driverId;

        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id);
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }
        const { data, error } = await query.select().single();

        if (error) throw error;
        return mapTaskData(data);
    },

    async closeTask(id: string, notes: string) {
        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('tasks')
            .update({
                status: 'Completed',
                closed_notes: notes,
                closed_at: new Date().toISOString()
            })
            .eq('id', id);
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }
        const { data, error } = await query.select().single();

        if (error) {
            console.error('Error closing task:', error);
            console.error('Task ID was:', id);
            throw new Error(`Failed to close task: ${error.message}`);
        }
        return mapTaskData(data);
    },

    async deleteTask(id: string) {
        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('tasks')
            .delete()
            .eq('id', id);
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }
        const { error } = await query;

        if (error) throw error;
    },

    async updateTaskStatus(id: string, status: TaskItem['status']) {
        const orgId = await getCurrentOrganization();
        let query = supabase
            .from('tasks')
            .update({ status })
            .eq('id', id);
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }
        const { error } = await query;

        if (error) throw error;
    },

    // Mark a coaching check-in task as complete based on the plan ID and week
    async markCheckInTaskComplete(planId: string, week: number, driverName: string) {
        const orgId = await getCurrentOrganization();
        // Find the task matching this coaching check-in
        let findQuery = supabase
            .from('tasks')
            .select('id')
            .eq('related_id', planId)
            .ilike('title', `%Week ${week}%`);
        if (orgId) {
            findQuery = findQuery.eq('organization_id', orgId);
        }
        const { data, error: fetchError } = await findQuery.single();

        if (fetchError || !data) {
            console.log(`No matching task found for plan ${planId} week ${week}`);
            return; // Task might not exist, that's OK
        }

        // Update the task status to Completed
        let updateQuery = supabase
            .from('tasks')
            .update({
                status: 'Completed',
                closed_notes: `Check-in completed for ${driverName}`,
                closed_at: new Date().toISOString()
            })
            .eq('id', data.id);
        if (orgId) {
            updateQuery = updateQuery.eq('organization_id', orgId);
        }
        const { error } = await updateQuery;

        if (error) {
            console.error('Failed to update check-in task:', error);
        }
    }
};
