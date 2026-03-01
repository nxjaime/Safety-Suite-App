import type { ProfileRole } from './profileService';
import type { ReportingWindow } from './reportingService';

const SAVED_VIEWS_KEY = 'reporting_saved_views_v1';
const EXPORT_SCHEDULES_KEY = 'reporting_export_schedules_v1';
const AUDIT_LOGS_KEY = 'reporting_preferences_audit_v1';

export interface ReportingSavedView {
  id: string;
  name: string;
  role: ProfileRole;
  window: ReportingWindow;
  createdAt: string;
}

export interface ReportingExportSchedule {
  id: string;
  name: string;
  role: ProfileRole;
  window: ReportingWindow;
  format: 'csv';
  frequency: 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  createdAt: string;
}

export interface ReportingPreferenceAuditEntry {
  id: string;
  role: ProfileRole;
  action:
    | 'view_saved'
    | 'view_deleted'
    | 'schedule_created'
    | 'schedule_enabled'
    | 'schedule_disabled'
    | 'schedule_deleted';
  targetId: string;
  targetName?: string;
  at: string;
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

const readViews = (): ReportingSavedView[] => {
  return safeParse<ReportingSavedView>(localStorage.getItem(SAVED_VIEWS_KEY));
};

const writeViews = (views: ReportingSavedView[]) => {
  localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
};

const readSchedules = (): ReportingExportSchedule[] => {
  return safeParse<ReportingExportSchedule>(localStorage.getItem(EXPORT_SCHEDULES_KEY));
};

const writeSchedules = (schedules: ReportingExportSchedule[]) => {
  localStorage.setItem(EXPORT_SCHEDULES_KEY, JSON.stringify(schedules));
};

const readAuditEntries = (): ReportingPreferenceAuditEntry[] => {
  return safeParse<ReportingPreferenceAuditEntry>(localStorage.getItem(AUDIT_LOGS_KEY));
};

const writeAuditEntries = (entries: ReportingPreferenceAuditEntry[]) => {
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(entries));
};

const nextId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const ensureCanMutate = (role: ProfileRole) => {
  if (role === 'viewer') {
    throw new Error('Insufficient permissions for this action');
  }
};

const appendAudit = (entry: Omit<ReportingPreferenceAuditEntry, 'id' | 'at'>) => {
  const next: ReportingPreferenceAuditEntry = {
    ...entry,
    id: nextId('audit'),
    at: new Date().toISOString()
  };
  writeAuditEntries([next, ...readAuditEntries()].slice(0, 250));
};

export const reportingPreferencesService = {
  listSavedViews(role: ProfileRole): ReportingSavedView[] {
    return readViews()
      .filter((view) => view.role === role)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  saveView(input: { name: string; role: ProfileRole; window: ReportingWindow }): ReportingSavedView {
    ensureCanMutate(input.role);
    const name = input.name.trim();
    if (!name) {
      throw new Error('View name is required');
    }

    const next: ReportingSavedView = {
      id: nextId('view'),
      name,
      role: input.role,
      window: input.window,
      createdAt: new Date().toISOString()
    };
    const views = readViews();
    writeViews([next, ...views]);
    appendAudit({
      role: input.role,
      action: 'view_saved',
      targetId: next.id,
      targetName: next.name
    });
    return next;
  },

  deleteView(id: string, role: ProfileRole): void {
    ensureCanMutate(role);
    const existing = readViews().find((view) => view.id === id && view.role === role);
    const filtered = readViews().filter((view) => !(view.id === id && view.role === role));
    writeViews(filtered);
    if (existing) {
      appendAudit({
        role,
        action: 'view_deleted',
        targetId: id,
        targetName: existing.name
      });
    }
  },

  listExportSchedules(role: ProfileRole): ReportingExportSchedule[] {
    return readSchedules()
      .filter((schedule) => schedule.role === role)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createExportSchedule(input: {
    name: string;
    role: ProfileRole;
    window: ReportingWindow;
    frequency: 'weekly' | 'monthly';
    recipients: string[];
  }): ReportingExportSchedule {
    ensureCanMutate(input.role);
    const name = input.name.trim();
    if (!name) {
      throw new Error('Schedule name is required');
    }
    const recipients = input.recipients.map((item) => item.trim()).filter(Boolean);
    if (recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    const next: ReportingExportSchedule = {
      id: nextId('schedule'),
      name,
      role: input.role,
      window: input.window,
      format: 'csv',
      frequency: input.frequency,
      recipients,
      enabled: true,
      createdAt: new Date().toISOString()
    };
    const schedules = readSchedules();
    writeSchedules([next, ...schedules]);
    appendAudit({
      role: input.role,
      action: 'schedule_created',
      targetId: next.id,
      targetName: next.name
    });
    return next;
  },

  setScheduleEnabled(id: string, role: ProfileRole, enabled: boolean): void {
    ensureCanMutate(role);
    const existing = readSchedules().find((schedule) => schedule.id === id && schedule.role === role);
    const schedules = readSchedules().map((schedule) => {
      if (schedule.id !== id || schedule.role !== role) return schedule;
      return { ...schedule, enabled };
    });
    writeSchedules(schedules);
    if (existing) {
      appendAudit({
        role,
        action: enabled ? 'schedule_enabled' : 'schedule_disabled',
        targetId: id,
        targetName: existing.name
      });
    }
  },

  deleteSchedule(id: string, role: ProfileRole): void {
    ensureCanMutate(role);
    const existing = readSchedules().find((schedule) => schedule.id === id && schedule.role === role);
    const schedules = readSchedules().filter((schedule) => !(schedule.id === id && schedule.role === role));
    writeSchedules(schedules);
    if (existing) {
      appendAudit({
        role,
        action: 'schedule_deleted',
        targetId: id,
        targetName: existing.name
      });
    }
  },

  listAuditEntries(role?: ProfileRole): ReportingPreferenceAuditEntry[] {
    const all = readAuditEntries();
    if (!role || role === 'admin') {
      return all;
    }
    return all.filter((entry) => entry.role === role);
  }
};
