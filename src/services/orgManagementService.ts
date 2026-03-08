import { supabase, getCurrentOrganization } from '../lib/supabase';
import { auditLogService } from './auditLogService';
import type { ProfileRole } from './authorizationService';
import { canAccessPlatformAdmin, getRoleCapabilities } from './authorizationService';

export interface OrgUser {
  id: string;
  email: string;
  fullName: string;
  role: ProfileRole;
  status: 'active' | 'invited' | 'deactivated';
  lastSignIn: string | null;
  createdAt: string;
}

export interface OrgConfig {
  id: string;
  organizationId: string;
  companyName: string;
  timezone: string;
  retentionDays: number;
  enableEmailNotifications: boolean;
  enableWeeklyDigest: boolean;
  primaryContactEmail: string;
  updatedAt: string;
}

const DEFAULT_ORG_CONFIG: Omit<OrgConfig, 'id' | 'organizationId' | 'updatedAt'> = {
  companyName: '',
  timezone: 'America/Chicago',
  retentionDays: 365,
  enableEmailNotifications: true,
  enableWeeklyDigest: false,
  primaryContactEmail: '',
};

const mapUser = (row: any): OrgUser => ({
  id: row.id,
  email: row.email || row.user_email || '',
  fullName: row.full_name || row.raw_user_meta_data?.full_name || '',
  role: row.role || 'readonly',
  status: row.status || 'active',
  lastSignIn: row.last_sign_in_at || null,
  createdAt: row.created_at,
});

const ensureAdminAccess = (role: ProfileRole) => {
  if (!canAccessPlatformAdmin(role) && !getRoleCapabilities(role).canManageOrgSettings) {
    throw new Error('Insufficient permissions');
  }
};

export const orgManagementService = {
  /**
   * List all users in the current organization from the profiles table.
   */
  async listUsers(role: ProfileRole): Promise<OrgUser[]> {
    ensureAdminAccess(role);

    const orgId = await getCurrentOrganization();

    let query = supabase
      .from('profiles')
      .select('id, email, full_name, role, status, last_sign_in_at, created_at')
      .order('created_at', { ascending: false });

    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapUser);
  },

  /**
   * Update a user's role and log the action.
   */
  async updateUserRole(
    callerRole: ProfileRole,
    userId: string,
    newRole: ProfileRole,
    userEmail: string,
  ): Promise<void> {
    ensureAdminAccess(callerRole);

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    await auditLogService.log({
      action: 'user.role_changed',
      targetType: 'user',
      targetId: userId,
      targetLabel: userEmail,
      details: { newRole },
    });
  },

  /**
   * Deactivate a user (soft disable).
   */
  async deactivateUser(callerRole: ProfileRole, userId: string, userEmail: string): Promise<void> {
    ensureAdminAccess(callerRole);

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'deactivated' })
      .eq('id', userId);

    if (error) throw error;

    await auditLogService.log({
      action: 'user.deactivated',
      targetType: 'user',
      targetId: userId,
      targetLabel: userEmail,
    });
  },

  /**
   * Reactivate a user.
   */
  async reactivateUser(callerRole: ProfileRole, userId: string, userEmail: string): Promise<void> {
    ensureAdminAccess(callerRole);

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', userId);

    if (error) throw error;

    await auditLogService.log({
      action: 'user.reactivated',
      targetType: 'user',
      targetId: userId,
      targetLabel: userEmail,
    });
  },

  /**
   * Get organization configuration.
   */
  async getOrgConfig(): Promise<OrgConfig | null> {
    const orgId = await getCurrentOrganization();
    if (!orgId) return null;

    const { data, error } = await supabase
      .from('org_config')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      organizationId: data.organization_id,
      companyName: data.company_name || DEFAULT_ORG_CONFIG.companyName,
      timezone: data.timezone || DEFAULT_ORG_CONFIG.timezone,
      retentionDays: data.retention_days ?? DEFAULT_ORG_CONFIG.retentionDays,
      enableEmailNotifications: data.enable_email_notifications ?? DEFAULT_ORG_CONFIG.enableEmailNotifications,
      enableWeeklyDigest: data.enable_weekly_digest ?? DEFAULT_ORG_CONFIG.enableWeeklyDigest,
      primaryContactEmail: data.primary_contact_email || DEFAULT_ORG_CONFIG.primaryContactEmail,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Save (upsert) organization configuration and log the action.
   */
  async saveOrgConfig(callerRole: ProfileRole, config: Partial<OrgConfig>): Promise<void> {
    ensureAdminAccess(callerRole);

    const orgId = await getCurrentOrganization();
    if (!orgId) throw new Error('No organization context');

    const payload = {
      organization_id: orgId,
      company_name: config.companyName ?? DEFAULT_ORG_CONFIG.companyName,
      timezone: config.timezone ?? DEFAULT_ORG_CONFIG.timezone,
      retention_days: config.retentionDays ?? DEFAULT_ORG_CONFIG.retentionDays,
      enable_email_notifications: config.enableEmailNotifications ?? DEFAULT_ORG_CONFIG.enableEmailNotifications,
      enable_weekly_digest: config.enableWeeklyDigest ?? DEFAULT_ORG_CONFIG.enableWeeklyDigest,
      primary_contact_email: config.primaryContactEmail ?? DEFAULT_ORG_CONFIG.primaryContactEmail,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('org_config')
      .upsert(payload, { onConflict: 'organization_id' });

    if (error) throw error;

    await auditLogService.log({
      action: 'org.settings_updated',
      targetType: 'org_config',
      targetId: orgId,
      targetLabel: config.companyName || 'Organization',
      details: payload,
    });
  },

  getDefaultConfig(): typeof DEFAULT_ORG_CONFIG {
    return { ...DEFAULT_ORG_CONFIG };
  },
};
