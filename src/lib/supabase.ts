import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'INSERT_YOUR_ANON_KEY_HERE'
);

if (!isSupabaseConfigured) {
    console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

export const getCurrentOrganization = async (): Promise<string | null> => {
    // In a real implementation, this would fetch from the user's profile table
    // For now, we return a mock ID or fetch if available

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    return profile?.organization_id || null;
};

export const getCurrentProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return profile;
};

