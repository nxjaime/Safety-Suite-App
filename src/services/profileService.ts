import { supabase } from '../lib/supabase';
import { normalizeRole, type ProfileRole } from './authorizationService';

export interface ProfileSummary {
  role: ProfileRole;
  organizationId: string | null;
  fullName: string | null;
}

export interface ExtendedProfile {
  email: string;
  fullName: string;
  title: string;
  phone: string;
  location: string;
  avatarUrl: string;
  role: ProfileRole;
  organizationId: string | null;
}

export interface ProfileUpdates {
  fullName?: string;
  title?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
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
  async getExtendedProfile(): Promise<ExtendedProfile | null> {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, title, phone, location, avatar_url, role, organization_id')
      .eq('id', user.id)
      .single();

    if (error) {
      return {
        email: user.email || '',
        fullName: user.user_metadata?.full_name || '',
        title: user.user_metadata?.title || '',
        phone: '',
        location: '',
        avatarUrl: user.user_metadata?.avatar_url || '',
        role: this.isEmailAdmin(user.email || '') ? 'platform_admin' : 'readonly',
        organizationId: null,
      };
    }

    return {
      email: user.email || '',
      fullName: data.full_name || '',
      title: data.title || '',
      phone: data.phone || '',
      location: data.location || '',
      avatarUrl: data.avatar_url || '',
      role: normalizeRole((data.role || 'viewer') as ProfileRole),
      organizationId: data.organization_id || null,
    };
  },

  async updateProfile(updates: ProfileUpdates): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        title: updates.title,
        phone: updates.phone,
        location: updates.location,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw new Error(error.message);
  },

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
