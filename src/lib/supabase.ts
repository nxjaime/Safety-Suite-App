import { createClient } from '@supabase/supabase-js';
import { isAuthBypassEnabled } from './authTesting';

const SUPABASE_PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const SUPABASE_PLACEHOLDER_ANON_KEY = 'placeholder';

export const getSupabaseBaseUrl = (): string =>
    import.meta.env.VITE_SUPABASE_URL || SUPABASE_PLACEHOLDER_URL;

const supabaseUrl = getSupabaseBaseUrl();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_PLACEHOLDER_ANON_KEY;

export const isSupabaseConfigured = isAuthBypassEnabled() || Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== SUPABASE_PLACEHOLDER_URL &&
    supabaseAnonKey !== SUPABASE_PLACEHOLDER_ANON_KEY &&
    supabaseAnonKey !== 'INSERT_YOUR_ANON_KEY_HERE'
);

if (!isSupabaseConfigured) {
    console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCurrentOrganization = async (): Promise<string | null> => {
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
