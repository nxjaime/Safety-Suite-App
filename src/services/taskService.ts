import { supabase } from '../lib/supabase';
import type { TaskItem } from '../types';

const mapTaskData = (data: any): TaskItem => {
    return {
        id: data.id,
        title: data.title,
        description: data.description,
        dueDate: data.due_date,
        priority: data.priority,
        status: data.status,
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
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
        return data.map(mapTaskData);
    },

    async addTask(task: Omit<TaskItem, 'id'>) {
        const { data, error } = await supabase
            .from('tasks')
            .insert([{
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

        const { data, error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapTaskData(data);
    },

    async closeTask(id: string, notes: string) {
        const { data, error } = await supabase
            .from('tasks')
            .update({
                status: 'Completed',
                closed_notes: notes,
                closed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error closing task:', error);
            console.error('Task ID was:', id);
            throw new Error(`Failed to close task: ${error.message}`);
        }
        return mapTaskData(data);
    },

    async deleteTask(id: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateTaskStatus(id: string, status: TaskItem['status']) {
        const { error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    }
};

