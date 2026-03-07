import { describe, expect, it } from 'vitest';

describe('authorizationService', () => {
  it('maps canonical roles to the expected capabilities', async () => {
    const { getRoleCapabilities } = await import('../services/authorizationService');

    const platformAdmin = getRoleCapabilities('platform_admin');
    const full = getRoleCapabilities('full');
    const safety = getRoleCapabilities('safety');
    const coaching = getRoleCapabilities('coaching');
    const maintenance = getRoleCapabilities('maintenance');
    const readonly = getRoleCapabilities('readonly');

    expect(platformAdmin.canAccessPlatformAdmin).toBe(true);
    expect(platformAdmin.canCrossOrganization).toBe(true);

    expect(full.canAccessPlatformAdmin).toBe(false);
    expect(full.canManageFleet).toBe(true);
    expect(full.canManageSafety).toBe(true);
    expect(full.canManageTraining).toBe(true);

    expect(safety.canManageSafety).toBe(true);
    expect(safety.canManageFleet).toBe(false);
    expect(safety.canManageCoaching).toBe(false);

    expect(coaching.canManageCoaching).toBe(true);
    expect(coaching.canManageTraining).toBe(true);
    expect(coaching.canManageSafety).toBe(false);

    expect(maintenance.canManageFleet).toBe(true);
    expect(maintenance.canManageSafety).toBe(false);
    expect(maintenance.canManageTraining).toBe(false);

    expect(readonly.canManageFleet).toBe(false);
    expect(readonly.canManageSafety).toBe(false);
    expect(readonly.canManageCoaching).toBe(false);
    expect(readonly.canManageTraining).toBe(false);
  });

  it('does not grant platform-only capabilities to org roles', async () => {
    const { getRoleCapabilities } = await import('../services/authorizationService');

    for (const role of ['full', 'safety', 'coaching', 'maintenance', 'readonly'] as const) {
      const capabilities = getRoleCapabilities(role);
      expect(capabilities.canAccessPlatformAdmin).toBe(false);
      expect(capabilities.canCrossOrganization).toBe(false);
    }
  });

  it('normalizes legacy roles into the Sprint 21 canonical model', async () => {
    const { normalizeRole } = await import('../services/authorizationService');

    expect(normalizeRole('admin')).toBe('platform_admin');
    expect(normalizeRole('manager')).toBe('full');
    expect(normalizeRole('viewer')).toBe('readonly');
  });
});
