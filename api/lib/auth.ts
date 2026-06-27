import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

const getBearerToken = (req: VercelRequest): string | null => {
  const header = req.headers.authorization;
  if (!header || Array.isArray(header)) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

export const requireSupabaseUser = async (req: VercelRequest) => {
  const token = getBearerToken(req);
  if (!token) {
    return { user: null, error: 'Missing bearer token' };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: 'Supabase auth verification is not configured' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: error?.message || 'Invalid bearer token' };
  }

  return { user: data.user, error: null };
};
