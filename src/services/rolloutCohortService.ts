import type { ProfileRole } from './profileService';

const ROLLOUT_COHORTS_KEY = 'hypercare_rollout_cohorts_v1';
const ROLLOUT_COHORT_AUDIT_KEY = 'hypercare_rollout_cohort_audit_v1';

export type RolloutCohortStatus = 'Planned' | 'Active' | 'Paused' | 'Completed';

export interface RolloutCohort {
  createdAt: string;
  id: string;
  name: string;
  notes: string;
  owner: string;
  status: RolloutCohortStatus;
  targetDate: string;
  targetOrgCount: number;
}

export interface RolloutCohortAuditEntry {
  action: 'cohort_created' | 'cohort_status_updated';
  at: string;
  id: string;
  role: ProfileRole;
  targetId: string;
  targetName: string;
}

const safeParse = <T>(raw: string | null): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readCohorts = (): RolloutCohort[] => {
  return safeParse<RolloutCohort>(localStorage.getItem(ROLLOUT_COHORTS_KEY));
};

const writeCohorts = (cohorts: RolloutCohort[]) => {
  localStorage.setItem(ROLLOUT_COHORTS_KEY, JSON.stringify(cohorts));
};

const readAuditEntries = (): RolloutCohortAuditEntry[] => {
  return safeParse<RolloutCohortAuditEntry>(localStorage.getItem(ROLLOUT_COHORT_AUDIT_KEY));
};

const writeAuditEntries = (entries: RolloutCohortAuditEntry[]) => {
  localStorage.setItem(ROLLOUT_COHORT_AUDIT_KEY, JSON.stringify(entries));
};

const nextId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const ensureCanMutate = (role: ProfileRole) => {
  if (role === 'viewer') {
    throw new Error('Insufficient permissions for this action');
  }
};

const appendAudit = (entry: Omit<RolloutCohortAuditEntry, 'id' | 'at'>) => {
  const next: RolloutCohortAuditEntry = {
    ...entry,
    at: new Date().toISOString(),
    id: nextId('rollout_audit')
  };
  writeAuditEntries([next, ...readAuditEntries()].slice(0, 250));
};

export const rolloutCohortService = {
  listCohorts(): RolloutCohort[] {
    return readCohorts().sort((a, b) => {
      const byTargetDate = a.targetDate.localeCompare(b.targetDate);
      if (byTargetDate !== 0) return byTargetDate;
      return a.createdAt.localeCompare(b.createdAt);
    });
  },

  createCohort(input: {
    name: string;
    notes: string;
    owner: string;
    role: ProfileRole;
    targetDate: string;
    targetOrgCount: number;
  }): RolloutCohort {
    ensureCanMutate(input.role);

    const name = input.name.trim();
    const owner = input.owner.trim();
    if (!name) {
      throw new Error('Cohort name is required');
    }
    if (!input.targetDate) {
      throw new Error('Target date is required');
    }
    if (!owner) {
      throw new Error('Owner is required');
    }
    if (input.targetOrgCount <= 0) {
      throw new Error('Target organization count must be greater than zero');
    }

    const next: RolloutCohort = {
      createdAt: new Date().toISOString(),
      id: nextId('cohort'),
      name,
      notes: input.notes.trim(),
      owner,
      status: 'Planned',
      targetDate: input.targetDate,
      targetOrgCount: input.targetOrgCount
    };

    writeCohorts([next, ...readCohorts()]);
    appendAudit({
      action: 'cohort_created',
      role: input.role,
      targetId: next.id,
      targetName: next.name
    });

    return next;
  },

  updateStatus(id: string, role: ProfileRole, status: RolloutCohortStatus): void {
    ensureCanMutate(role);

    const existing = readCohorts().find((cohort) => cohort.id === id);
    if (!existing) {
      throw new Error('Cohort not found');
    }

    const cohorts = readCohorts().map((cohort) => {
      if (cohort.id !== id) return cohort;
      return { ...cohort, status };
    });

    writeCohorts(cohorts);
    appendAudit({
      action: 'cohort_status_updated',
      role,
      targetId: id,
      targetName: existing.name
    });
  },

  listAuditEntries(): RolloutCohortAuditEntry[] {
    return readAuditEntries();
  }
};
