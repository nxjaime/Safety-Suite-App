import { beforeEach, describe, expect, it } from 'vitest';

describe('rolloutCohortService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates and lists cohorts sorted by target date', async () => {
    const { rolloutCohortService } = await import('../services/rolloutCohortService');

    rolloutCohortService.createCohort({
      name: 'Wave 2 - Southeast',
      targetDate: '2026-04-15',
      targetOrgCount: 8,
      owner: 'Ops Lead',
      notes: 'Depends on mobile training completion',
      role: 'manager'
    });

    rolloutCohortService.createCohort({
      name: 'Wave 1 - West',
      targetDate: '2026-03-20',
      targetOrgCount: 5,
      owner: 'Ops Lead',
      notes: 'Pilot launch group',
      role: 'admin'
    });

    const cohorts = rolloutCohortService.listCohorts();
    expect(cohorts).toHaveLength(2);
    expect(cohorts[0].name).toBe('Wave 1 - West');
    expect(cohorts[1].name).toBe('Wave 2 - Southeast');
  });

  it('blocks viewer mutations', async () => {
    const { rolloutCohortService } = await import('../services/rolloutCohortService');

    expect(() => rolloutCohortService.createCohort({
      name: 'Blocked Wave',
      targetDate: '2026-04-01',
      targetOrgCount: 3,
      owner: 'Ops Lead',
      notes: '',
      role: 'readonly'
    })).toThrow('Insufficient permissions for this action');
  });

  it('updates cohort status and records audit activity', async () => {
    const { rolloutCohortService } = await import('../services/rolloutCohortService');

    const cohort = rolloutCohortService.createCohort({
      name: 'Wave 1 - West',
      targetDate: '2026-03-20',
      targetOrgCount: 5,
      owner: 'Ops Lead',
      notes: 'Pilot launch group',
      role: 'admin'
    });

    rolloutCohortService.updateStatus(cohort.id, 'manager', 'Active');
    rolloutCohortService.updateStatus(cohort.id, 'manager', 'Completed');

    const updated = rolloutCohortService.listCohorts()[0];
    expect(updated.status).toBe('Completed');

    const audit = rolloutCohortService.listAuditEntries();
    expect(audit.some((entry) => entry.action === 'cohort_created')).toBe(true);
    expect(audit.some((entry) => entry.action === 'cohort_status_updated' && entry.targetName === 'Wave 1 - West')).toBe(true);
  });

  it('allows maintenance users to manage rollout cohorts', async () => {
    const { rolloutCohortService } = await import('../services/rolloutCohortService');

    const cohort = rolloutCohortService.createCohort({
      name: 'Wave 3 - Maintenance Pilot',
      targetDate: '2026-04-30',
      targetOrgCount: 2,
      owner: 'Fleet Ops',
      notes: 'Maintenance-led launch validation',
      role: 'maintenance'
    });

    rolloutCohortService.updateStatus(cohort.id, 'maintenance', 'Active');

    expect(rolloutCohortService.listCohorts()[0].status).toBe('Active');
  });
});
