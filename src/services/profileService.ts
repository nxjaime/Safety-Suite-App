import { supabase } from '../lib/supabase';

export type ProfileRole = 'admin' | 'manager' | 'viewer';

export interface ProfileSummary {
  role: ProfileRole;
  organizationId: string | null;
  fullName: string | null;
}

const parseAdminEmails = (): string[] => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const profileService = {
  async getCurrentProfileSummary(): Promise<ProfileSummary | null> {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('role, organization_id, full_name')
      .eq('id', user.id)
      .single();

    if (error) {
      // Allow fallback for first-login state
      return {
        role: this.isEmailAdmin(user.email || '') ? 'admin' : 'viewer',
        organizationId: null,
        fullName: user.user_metadata?.full_name || null
      };
    }

    const role = (data.role || 'viewer') as ProfileRole;
    return {
      role,
      organizationId: data.organization_id || null,
      fullName: data.full_name || null
    };
  },

  isEmailAdmin(email: string): boolean {
    if (!email) return false;
    const normalized = email.toLowerCase();
    return parseAdminEmails().includes(normalized);
  }
};
