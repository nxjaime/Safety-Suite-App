export type CanonicalRole =
  | 'platform_admin'
  | 'full'
  | 'safety'
  | 'coaching'
  | 'maintenance'
  | 'readonly';

export type LegacyRole = 'admin' | 'manager' | 'viewer';
export type ProfileRole = CanonicalRole | LegacyRole;

export interface RoleCapabilities {
  canAccessPlatformAdmin: boolean;
  canCrossOrganization: boolean;
  canManageCoaching: boolean;
  canManageFleet: boolean;
  canManageHypercare: boolean;
  canManageOrgSettings: boolean;
  canManageReportingPreferences: boolean;
  canManageSafety: boolean;
  canManageTraining: boolean;
  canReadOrgData: boolean;
}

const ROLE_CAPABILITIES: Record<CanonicalRole, RoleCapabilities> = {
  platform_admin: {
    canAccessPlatformAdmin: true,
    canCrossOrganization: true,
    canManageCoaching: true,
    canManageFleet: true,
    canManageHypercare: true,
    canManageOrgSettings: true,
    canManageReportingPreferences: true,
    canManageSafety: true,
    canManageTraining: true,
    canReadOrgData: true
  },
  full: {
    canAccessPlatformAdmin: false,
    canCrossOrganization: false,
    canManageCoaching: true,
    canManageFleet: true,
    canManageHypercare: true,
    canManageOrgSettings: true,
    canManageReportingPreferences: true,
    canManageSafety: true,
    canManageTraining: true,
    canReadOrgData: true
  },
  safety: {
    canAccessPlatformAdmin: false,
    canCrossOrganization: false,
    canManageCoaching: false,
    canManageFleet: false,
    canManageHypercare: true,
    canManageOrgSettings: false,
    canManageReportingPreferences: true,
    canManageSafety: true,
    canManageTraining: false,
    canReadOrgData: true
  },
  coaching: {
    canAccessPlatformAdmin: false,
    canCrossOrganization: false,
    canManageCoaching: true,
    canManageFleet: false,
    canManageHypercare: true,
    canManageOrgSettings: false,
    canManageReportingPreferences: true,
    canManageSafety: false,
    canManageTraining: true,
    canReadOrgData: true
  },
  maintenance: {
    canAccessPlatformAdmin: false,
    canCrossOrganization: false,
    canManageCoaching: false,
    canManageFleet: true,
    canManageHypercare: true,
    canManageOrgSettings: false,
    canManageReportingPreferences: true,
    canManageSafety: false,
    canManageTraining: false,
    canReadOrgData: true
  },
  readonly: {
    canAccessPlatformAdmin: false,
    canCrossOrganization: false,
    canManageCoaching: false,
    canManageFleet: false,
    canManageHypercare: false,
    canManageOrgSettings: false,
    canManageReportingPreferences: false,
    canManageSafety: false,
    canManageTraining: false,
    canReadOrgData: true
  }
};

export const normalizeRole = (role: ProfileRole | null | undefined): CanonicalRole => {
  switch (role) {
    case 'platform_admin':
    case 'full':
    case 'safety':
    case 'coaching':
    case 'maintenance':
    case 'readonly':
      return role;
    case 'admin':
      return 'platform_admin';
    case 'manager':
      return 'full';
    case 'viewer':
    default:
      return 'readonly';
  }
};

export const getRoleCapabilities = (role: ProfileRole | null | undefined): RoleCapabilities => {
  return ROLE_CAPABILITIES[normalizeRole(role)];
};

export const canAccessPlatformAdmin = (role: ProfileRole | null | undefined): boolean => {
  return getRoleCapabilities(role).canAccessPlatformAdmin;
};

export const canManageFleet = (role: ProfileRole | null | undefined): boolean => {
  return getRoleCapabilities(role).canManageFleet;
};

export const canManageSafety = (role: ProfileRole | null | undefined): boolean => {
  return getRoleCapabilities(role).canManageSafety;
};

export const canManageCoaching = (role: ProfileRole | null | undefined): boolean => {
  return getRoleCapabilities(role).canManageCoaching;
};

export const canManageTraining = (role: ProfileRole | null | undefined): boolean => {
  return getRoleCapabilities(role).canManageTraining;
};

export const canManageReportingPreferences = (role: ProfileRole | null | undefined): boolean => {
  return getRoleCapabilities(role).canManageReportingPreferences;
};

export const canManageHypercare = (role: ProfileRole | null | undefined): boolean => {
  return getRoleCapabilities(role).canManageHypercare;
};
