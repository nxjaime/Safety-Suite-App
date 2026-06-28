import { isAuthBypassEnabled } from './authTesting';

export const SUPABASE_PLACEHOLDER_URL = 'https://placeholder.supabase.co';
export const SUPABASE_PLACEHOLDER_ANON_KEY = 'placeholder';

export const getSupabaseBaseUrl = (): string =>
    import.meta.env.VITE_SUPABASE_URL || SUPABASE_PLACEHOLDER_URL;

export const getSupabaseAnonKey = (): string =>
    import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_PLACEHOLDER_ANON_KEY;

export const isSupabaseConfigured = isAuthBypassEnabled() || Boolean(
    getSupabaseBaseUrl() &&
    getSupabaseAnonKey() &&
    getSupabaseBaseUrl() !== SUPABASE_PLACEHOLDER_URL &&
    getSupabaseAnonKey() !== SUPABASE_PLACEHOLDER_ANON_KEY &&
    getSupabaseAnonKey() !== 'INSERT_YOUR_ANON_KEY_HERE'
);
