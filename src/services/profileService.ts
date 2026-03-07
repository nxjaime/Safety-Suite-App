import { supabase } from '../lib/supabase';
import { normalizeRole, type ProfileRole } from './authorizationService';

export interface ProfileSummary {
  role: ProfileRole;
  organizationId: string | null;
  fullName: string | null;
}

const OWNER_ADMIN_EMAILS = ['nxjaime@gmail.com'];

const parseAdminEmails = (): string[] => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS;
  const configured = raw
    ? raw
        .split(',')
        .map((email: string) => email.trim().toLowerCase())
        .filter(Boolean)
    : [];

  return Array.from(new Set([...OWNER_ADMIN_EMAILS, ...configured]));
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
        role: this.isEmailAdmin(user.email || '') ? 'platform_admin' : 'readonly',
        organizationId: null,
        fullName: user.user_metadata?.full_name || null
      };
    }

    const role = normalizeRole((data.role || 'viewer') as ProfileRole);
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
