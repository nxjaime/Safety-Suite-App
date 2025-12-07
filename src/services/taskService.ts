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
        driverName: data.driver_name // If joined view, or just undefined
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
                related_id: task.relatedId
            }])
            .select()
            .single();

        if (error) throw error;
        return mapTaskData(data);
    },

    async updateTaskStatus(id: string, status: TaskItem['status']) {
        const { error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    }
};
