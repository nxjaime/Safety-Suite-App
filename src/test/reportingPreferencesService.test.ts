import { beforeEach, describe, expect, it } from 'vitest';
import { reportingPreferencesService } from '../services/reportingPreferencesService';

describe('reportingPreferencesService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and lists saved views scoped by role', () => {
    reportingPreferencesService.saveView({ name: 'Ops Weekly', role: 'manager', window: '30d' });
    reportingPreferencesService.saveView({ name: 'Leadership', role: 'admin', window: '90d' });

    const managerViews = reportingPreferencesService.listSavedViews('manager');
    const adminViews = reportingPreferencesService.listSavedViews('admin');

    expect(managerViews).toHaveLength(1);
    expect(managerViews[0].name).toBe('Ops Weekly');
    expect(adminViews).toHaveLength(1);
    expect(adminViews[0].name).toBe('Leadership');
  });

  it('creates and toggles export schedules', () => {
    const schedule = reportingPreferencesService.createExportSchedule({
      name: 'Monthly Compliance',
      role: 'manager',
      window: '365d',
      frequency: 'monthly',
      recipients: ['ops@example.com', 'lead@example.com']
    });

    let schedules = reportingPreferencesService.listExportSchedules('manager');
    expect(schedules).toHaveLength(1);
    expect(schedules[0].enabled).toBe(true);
    expect(schedules[0].recipients).toEqual(['ops@example.com', 'lead@example.com']);

    reportingPreferencesService.setScheduleEnabled(schedule.id, 'manager', false);
    schedules = reportingPreferencesService.listExportSchedules('manager');
    expect(schedules[0].enabled).toBe(false);
  });

  it('blocks viewer mutations and records audit entries for manager actions', () => {
    expect(() => reportingPreferencesService.saveView({
      name: 'Readonly View',
      role: 'readonly',
      window: '30d'
    })).toThrow('Insufficient permissions for this action');

    const saved = reportingPreferencesService.saveView({
      name: 'Manager View',
      role: 'manager',
      window: '90d'
    });

    const schedule = reportingPreferencesService.createExportSchedule({
      name: 'Weekly Export',
      role: 'manager',
      window: '90d',
      frequency: 'weekly',
      recipients: ['ops@example.com']
    });

    reportingPreferencesService.setScheduleEnabled(schedule.id, 'manager', false);
    reportingPreferencesService.deleteView(saved.id, 'manager');
    reportingPreferencesService.deleteSchedule(schedule.id, 'manager');

    const managerAudit = reportingPreferencesService.listAuditEntries('manager');
    expect(managerAudit.some((entry) => entry.action === 'view_saved')).toBe(true);
    expect(managerAudit.some((entry) => entry.action === 'schedule_created')).toBe(true);
    expect(managerAudit.some((entry) => entry.action === 'schedule_disabled')).toBe(true);
    expect(managerAudit.some((entry) => entry.action === 'view_deleted')).toBe(true);
    expect(managerAudit.some((entry) => entry.action === 'schedule_deleted')).toBe(true);
  });

  it('allows safety users to manage reporting preferences under the Sprint 21 model', () => {
    const saved = reportingPreferencesService.saveView({
      name: 'Safety Risk Review',
      role: 'safety',
      window: '30d'
    });

    const schedule = reportingPreferencesService.createExportSchedule({
      name: 'Safety Weekly Export',
      role: 'safety',
      window: '90d',
      frequency: 'weekly',
      recipients: ['safety@example.com']
    });

    expect(saved.role).toBe('safety');
    expect(schedule.role).toBe('safety');
    expect(reportingPreferencesService.listSavedViews('safety')).toHaveLength(1);
    expect(reportingPreferencesService.listExportSchedules('safety')).toHaveLength(1);
  });
});
