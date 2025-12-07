import { supabase } from '../lib/supabase';

export interface SystemOption {
    id: string;
    category: string;
    label: string;
    value: string;
    is_active: boolean;
}

export const settingsService = {
    // Fetch all options for a specific category
    async getOptionsByCategory(category: string) {
        const { data, error } = await supabase
            .from('system_options')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('label');

        if (error) throw error;
        return data as SystemOption[];
    },

    // Fetch all options (for settings page)
    async getAllOptions() {
        const { data, error } = await supabase
            .from('system_options')
            .select('*')
            .order('category')
            .order('label');

        if (error) throw error;
        return data as SystemOption[];
    },

    // Add a new option
    async addOption(option: Omit<SystemOption, 'id' | 'is_active'>) {
        const { data, error } = await supabase
            .from('system_options')
            .insert([{ ...option, is_active: true }])
            .select()
            .single();

        if (error) throw error;
        return data as SystemOption;
    },

    // Update an option
    async updateOption(id: string, updates: Partial<SystemOption>) {
        const { data, error } = await supabase
            .from('system_options')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as SystemOption;
    },

    // Delete (Soft delete via is_active or hard delete)
    async deleteOption(id: string) {
        const { error } = await supabase
            .from('system_options')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
