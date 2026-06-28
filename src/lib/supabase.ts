import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseBaseUrl, isSupabaseConfigured } from './supabaseConfig';

export { getSupabaseBaseUrl, isSupabaseConfigured } from './supabaseConfig';

const supabaseUrl = getSupabaseBaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!isSupabaseConfigured) {
    console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSessionUser = async () => {
    if (typeof supabase.auth.getSession === 'function') {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user ?? null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
};

export const getCurrentOrganization = async (): Promise<string | null> => {
    const user = await getSessionUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    return profile?.organization_id || null;
};

export const getCurrentProfile = async () => {
    const user = await getSessionUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return profile;
};
