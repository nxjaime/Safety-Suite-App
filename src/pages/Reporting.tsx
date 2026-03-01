import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { reportingService, type ReportingSnapshot, type ReportingWindow } from '../services/reportingService';
import { useAuth } from '../contexts/AuthContext';
import {
  reportingPreferencesService,
  type ReportingExportSchedule,
  type ReportingPreferenceAuditEntry,
  type ReportingSavedView
} from '../services/reportingPreferencesService';

const windowOptions: Array<{ value: ReportingWindow; label: string }> = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '365d', label: 'Last 12 Months' }
];

const metricCardClassName = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';

const Reporting: React.FC = () => {
  const { role } = useAuth();
  const [window, setWindow] = useState<ReportingWindow>('90d');
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<ReportingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<ReportingSavedView[]>([]);
  const [auditEntries, setAuditEntries] = useState<ReportingPreferenceAuditEntry[]>([]);
  const [viewName, setViewName] = useState('');
  const [schedules, setSchedules] = useState<ReportingExportSchedule[]>([]);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [scheduleRecipients, setScheduleRecipients] = useState('');
  const canManagePreferences = role !== 'viewer';

  const refreshPreferences = () => {
    setSavedViews(reportingPreferencesService.listSavedViews(role));
    setSchedules(reportingPreferencesService.listExportSchedules(role));
    setAuditEntries(reportingPreferencesService.listAuditEntries(role));
  };

  const loadSnapshot = async (selectedWindow: ReportingWindow = window) => {
    setLoading(true);
    setError(null);
    try {
      const next = await reportingService.getSnapshot(selectedWindow);
      setSnapshot(next);
    } catch (e) {
      console.error('Failed to load reporting snapshot', e);
      setError('Failed to load reporting metrics. Retry to refresh data.');
      toast.error('Failed to load reporting metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot(window);
  }, [window]);

  useEffect(() => {
    refreshPreferences();
  }, [role]);

  const generatedAt = useMemo(() => {
    if (!snapshot?.generatedAt) return 'n/a';
    return new Date(snapshot.generatedAt).toLocaleString();
  }, [snapshot]);

  const exportCsv = () => {
    if (!snapshot) {
      toast.error('No report data to export');
      return;
    }

    const rows = [
      ['Section', 'Metric', 'Value'],
      ['Fleet Reliability', 'Total Work Orders', String(snapshot.fleetReliability.totalWorkOrders)],
      ['Fleet Reliability', 'Backlog Work Orders', String(snapshot.fleetReliability.backlogWorkOrders)],
      ['Fleet Reliability', 'Overdue Work Orders', String(snapshot.fleetReliability.overdueWorkOrders)],
      ['Fleet Reliability', 'MTTR Days', snapshot.fleetReliability.mttrDays?.toString() ?? 'n/a'],
      ['Fleet Reliability', 'Completion Rate %', String(snapshot.fleetReliability.completionRate)],
      ['Safety Performance', 'Total Drivers', String(snapshot.safetyPerformance.totalDrivers)],
      ['Safety Performance', 'Average Risk Score', String(snapshot.safetyPerformance.averageRiskScore)],
      ['Safety Performance', 'High Risk Drivers', String(snapshot.safetyPerformance.highRiskDrivers)],
      ['Compliance Posture', 'Open Action Items', String(snapshot.compliancePosture.openActionItems)],
      ['Compliance Posture', 'Overdue Remediations', String(snapshot.compliancePosture.overdueRemediations)],
      ['Compliance Posture', 'Required Document Gaps', String(snapshot.compliancePosture.requiredDocumentGaps)],
      ['Compliance Posture', 'Critical Credentials', String(snapshot.compliancePosture.criticalCredentials)],
      ['Training Completion', 'Total Assignments', String(snapshot.trainingCompletion.totalAssignments)],
      ['Training Completion', 'Completed Assignments', String(snapshot.trainingCompletion.completedAssignments)],
      ['Training Completion', 'Overdue Assignments', String(snapshot.trainingCompletion.overdueAssignments)],
      ['Training Completion', 'Completion Rate %', String(snapshot.trainingCompletion.completionRate)]
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporting_snapshot_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Reporting snapshot exported');
  };

  const handleSaveView = () => {
    try {
      reportingPreferencesService.saveView({
        name: viewName,
        role,
        window
      });
      setViewName('');
      refreshPreferences();
      toast.success('Saved reporting view');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save view';
      toast.error(message);
    }
  };

  const handleCreateSchedule = () => {
    try {
      reportingPreferencesService.createExportSchedule({
        name: scheduleName,
        role,
        window,
        frequency: scheduleFrequency,
        recipients: scheduleRecipients.split(',').map((item) => item.trim()).filter(Boolean)
      });
      setScheduleName('');
      setScheduleFrequency('weekly');
      setScheduleRecipients('');
      refreshPreferences();
      toast.success('Export schedule saved');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save schedule';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Reporting & Analytics</h2>
            <p className="mt-1 text-sm text-slate-500">
              Unified leadership dashboard for fleet reliability, safety performance, compliance posture, and training outcomes.
            </p>
            <p className="mt-1 text-xs text-slate-400">Snapshot generated: {generatedAt}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                const selected = savedViews.find((view) => view.id === e.target.value);
                if (!selected) return;
                setWindow(selected.window);
                toast.success(`Applied view: ${selected.name}`);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Apply saved view...</option>
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>{view.name} ({view.window})</option>
              ))}
            </select>
            <select
              value={window}
              onChange={(e) => setWindow(e.target.value as ReportingWindow)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {windowOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => loadSnapshot(window)}
              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Loading reporting metrics...
        </section>
      ) : error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <p className="text-sm text-rose-700">{error}</p>
          <button
            onClick={() => loadSnapshot(window)}
            className="mt-3 rounded-md border border-rose-300 bg-white px-4 py-2 text-sm text-rose-700 hover:bg-rose-100"
          >
            Retry
          </button>
        </section>
      ) : snapshot ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Saved Views (Role Scoped: {role})</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="View name"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                disabled={!canManagePreferences}
              />
              <button
                onClick={handleSaveView}
                disabled={!canManagePreferences}
                className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Current View
              </button>
            </div>
            {!canManagePreferences && (
              <p className="mt-2 text-xs text-slate-500">Viewer role has read-only access to saved views and schedules.</p>
            )}
            <div className="mt-3 space-y-2">
              {savedViews.length === 0 ? (
                <p className="text-sm text-slate-500">No saved views for this role yet.</p>
              ) : (
                savedViews.map((view) => (
                  <div key={view.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{view.name}</p>
                      <p className="text-xs text-slate-500">Window: {view.window}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setWindow(view.window);
                          toast.success(`Applied view: ${view.name}`);
                        }}
                        className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => {
                          reportingPreferencesService.deleteView(view.id, role);
                          refreshPreferences();
                          toast.success('View deleted');
                        }}
                        disabled={!canManagePreferences}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <article className={metricCardClassName}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Fleet Backlog</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.fleetReliability.backlogWorkOrders}</p>
              <p className="mt-1 text-xs text-slate-500">Overdue: {snapshot.fleetReliability.overdueWorkOrders}</p>
            </article>
            <article className={metricCardClassName}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Fleet Completion Rate</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.fleetReliability.completionRate}%</p>
              <p className="mt-1 text-xs text-slate-500">MTTR: {snapshot.fleetReliability.mttrDays ?? 'n/a'} days</p>
            </article>
            <article className={metricCardClassName}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Safety Risk</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.safetyPerformance.averageRiskScore}</p>
              <p className="mt-1 text-xs text-slate-500">High risk drivers: {snapshot.safetyPerformance.highRiskDrivers}</p>
            </article>
            <article className={metricCardClassName}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Training Completion</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.trainingCompletion.completionRate}%</p>
              <p className="mt-1 text-xs text-slate-500">Overdue assignments: {snapshot.trainingCompletion.overdueAssignments}</p>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-800">Compliance Action Queue</h3>
              </header>
              <div className="grid grid-cols-2 gap-3 p-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Open Action Items</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{snapshot.compliancePosture.openActionItems}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Overdue Remediations</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{snapshot.compliancePosture.overdueRemediations}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Required Doc Gaps</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{snapshot.compliancePosture.requiredDocumentGaps}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Critical Credentials</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{snapshot.compliancePosture.criticalCredentials}</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-800">Monthly Trends (6 Months)</h3>
              </header>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Completed Work Orders</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Completed Training</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {snapshot.trends.map((point) => (
                      <tr key={point.month}>
                        <td className="px-4 py-3 text-sm text-slate-700">{point.month}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{point.completedWorkOrders}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{point.completedTraining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-800">Coaching Effectiveness Cohorts</h3>
              </header>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Band</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Drivers</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Average Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {snapshot.cohortReporting.riskBandCohorts.map((row) => (
                      <tr key={row.band}>
                        <td className="px-4 py-3 text-sm capitalize text-slate-700">{row.band}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.drivers}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.avgScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-800">Defect Recurrence</h3>
              </header>
              <div className="grid grid-cols-2 gap-3 p-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Inspection-Linked Work Orders</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {snapshot.cohortReporting.defectRecurrence.inspectionLinkedOrders}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Recurring Inspection Groups</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {snapshot.cohortReporting.defectRecurrence.recurringInspectionGroups}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Recurring Orders</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {snapshot.cohortReporting.defectRecurrence.recurringOrders}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Recurrence Rate</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {snapshot.cohortReporting.defectRecurrence.recurrenceRate}%
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">KPI Data Dictionary</h3>
            </header>
            <div className="divide-y divide-slate-100">
              {snapshot.kpiDefinitions.map((item) => (
                <div key={item.key} className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.definition}</p>
                  <p className="mt-1 text-xs text-slate-500">Formula: {item.formula}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Scheduled Exports (Scaffolding)</h3>
            <p className="mt-1 text-sm text-slate-500">
              Configure recurring CSV delivery metadata by role. Delivery execution hooks are pending backend job orchestration.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="Schedule name"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                disabled={!canManagePreferences}
              />
              <select
                value={scheduleFrequency}
                onChange={(e) => setScheduleFrequency(e.target.value as 'weekly' | 'monthly')}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                disabled={!canManagePreferences}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input
                type="text"
                value={scheduleRecipients}
                onChange={(e) => setScheduleRecipients(e.target.value)}
                placeholder="Recipients (comma-separated)"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                disabled={!canManagePreferences}
              />
            </div>
            <div className="mt-3">
              <button
                onClick={handleCreateSchedule}
                disabled={!canManagePreferences}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Schedule
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {schedules.length === 0 ? (
                <p className="text-sm text-slate-500">No export schedules configured for this role.</p>
              ) : (
                schedules.map((schedule) => (
                  <div key={schedule.id} className="flex flex-col gap-2 rounded-md border border-slate-200 px-3 py-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {schedule.name} ({schedule.frequency}, {schedule.window}, {schedule.format.toUpperCase()})
                      </p>
                      <p className="text-xs text-slate-500">Recipients: {schedule.recipients.join(', ')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          reportingPreferencesService.setScheduleEnabled(schedule.id, role, !schedule.enabled);
                          refreshPreferences();
                        }}
                        disabled={!canManagePreferences}
                        className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {schedule.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => {
                          reportingPreferencesService.deleteSchedule(schedule.id, role);
                          refreshPreferences();
                          toast.success('Schedule deleted');
                        }}
                        disabled={!canManagePreferences}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Reporting Preference Audit Trail</h3>
            <p className="mt-1 text-sm text-slate-500">
              Captures saved view and export schedule configuration actions.
            </p>
            <div className="mt-3 space-y-2">
              {auditEntries.length === 0 ? (
                <p className="text-sm text-slate-500">No audit entries found.</p>
              ) : (
                auditEntries.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="rounded-md border border-slate-200 px-3 py-2">
                    <p className="text-sm font-medium text-slate-800">{entry.action}</p>
                    <p className="text-xs text-slate-500">
                      {entry.targetName || entry.targetId} • role: {entry.role} • {new Date(entry.at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">
              Need scenario forecasting? Use the dedicated predictor for inspection-driven risk analysis.
            </p>
            <Link
              to="/reporting/csa-predictor"
              className="mt-3 inline-flex rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Open CSA Predictor
            </Link>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default Reporting;
