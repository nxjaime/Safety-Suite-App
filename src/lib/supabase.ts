import { createClient } from '@supabase/supabase-js';

const SUPABASE_API_URL = 'https://slrxopkmbojugvenkfih.supabase.co';
const SUPABASE_PROXY_PATH = '/supabase';
const SUPABASE_FALLBACK_URL = SUPABASE_API_URL;
const SUPABASE_FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNscnhvcGttYm9qdWd2ZW5rZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTUxOTQsImV4cCI6MjA4MDYzMTE5NH0.3BbIxvC_LwhvfaKbU5mh_1LwC7byiaW-Cy9CKyWnWEk';

const hasWindow = typeof window !== 'undefined' && typeof window.location !== 'undefined';

export const getSupabaseBaseUrl = (): string => {
    if (hasWindow && window.location.origin) {
        return new URL(SUPABASE_PROXY_PATH, window.location.origin).toString();
    }

    return import.meta.env.VITE_SUPABASE_URL || SUPABASE_FALLBACK_URL;
};

const supabaseUrl = getSupabaseBaseUrl();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
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
