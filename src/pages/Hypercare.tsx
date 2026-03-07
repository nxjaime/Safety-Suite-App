import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import RolloutCohortsPanel from '../components/RolloutCohortsPanel';
import { hypercareService, type HypercareSnapshot } from '../services/hypercareService';

const metricCardClassName = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';

const statusClassNames: Record<HypercareSnapshot['overallStatus'], string> = {
  Stable: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Monitor: 'border-amber-200 bg-amber-50 text-amber-700',
  Escalate: 'border-rose-200 bg-rose-50 text-rose-700'
};

const Hypercare: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<HypercareSnapshot | null>(null);

  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await hypercareService.getSnapshot();
      setSnapshot(next);
    } catch (err) {
      console.error('Failed to load hypercare snapshot', err);
      setError('Failed to load hypercare command center. Retry to refresh the latest launch status.');
      toast.error('Failed to load hypercare snapshot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  const generatedAt = useMemo(() => {
    if (!snapshot?.generatedAt) return 'n/a';
    return new Date(snapshot.generatedAt).toLocaleString();
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Hypercare Command Center</h2>
            <p className="mt-1 text-sm text-slate-500">
              Launch-health cockpit for rollout leads combining KPI drift, support backlog, and escalation triggers.
            </p>
            <p className="mt-1 text-xs text-slate-400">Snapshot generated: {generatedAt}</p>
          </div>
          {snapshot && (
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${statusClassNames[snapshot.overallStatus]}`}
            >
              <AlertTriangle className="h-4 w-4" />
              {snapshot.overallStatus}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          onClick={loadSnapshot}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Snapshot
        </button>
        <Link
          to="/reporting"
          className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Open Reporting Analytics
        </Link>
        <Link
          to="/help"
          className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Open Help & Feedback
        </Link>
      </section>

      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Loading hypercare snapshot...
        </section>
      ) : error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <p className="text-sm text-rose-700">{error}</p>
          <button
            onClick={loadSnapshot}
            className="mt-3 rounded-md border border-rose-300 bg-white px-4 py-2 text-sm text-rose-700 hover:bg-rose-100"
          >
            Retry
          </button>
        </section>
      ) : snapshot ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className={metricCardClassName}>
              <p className="text-sm text-slate-500">Open feedback items</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{snapshot.feedbackSummary.totalOpen}</p>
              <p className="mt-1 text-xs text-slate-400">High-priority open: {snapshot.feedbackSummary.highPriorityOpen}</p>
            </article>
            <article className={metricCardClassName}>
              <p className="text-sm text-slate-500">Open compliance actions</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{snapshot.reportingSnapshot.compliancePosture.openActionItems}</p>
              <p className="mt-1 text-xs text-slate-400">Overdue remediations: {snapshot.reportingSnapshot.compliancePosture.overdueRemediations}</p>
            </article>
            <article className={metricCardClassName}>
              <p className="text-sm text-slate-500">High-risk drivers</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{snapshot.reportingSnapshot.safetyPerformance.highRiskDrivers}</p>
              <p className="mt-1 text-xs text-slate-400">Average risk score: {snapshot.reportingSnapshot.safetyPerformance.averageRiskScore}</p>
            </article>
            <article className={metricCardClassName}>
              <p className="text-sm text-slate-500">Overdue training</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{snapshot.reportingSnapshot.trainingCompletion.overdueAssignments}</p>
              <p className="mt-1 text-xs text-slate-400">Completion rate: {snapshot.reportingSnapshot.trainingCompletion.completionRate}%</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Active Escalation Triggers</h3>
                  <p className="mt-1 text-sm text-slate-500">Runbook-driven launch blockers requiring active command-center review.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {snapshot.activeTriggers.length} active
                </span>
              </div>

              {snapshot.activeTriggers.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  No active escalation triggers. Launch signals are stable for the current window.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {snapshot.activeTriggers.map((trigger) => (
                    <div
                      key={trigger.id}
                      className={`rounded-xl border p-4 ${trigger.severity === 'critical' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-semibold ${trigger.severity === 'critical' ? 'text-rose-700' : 'text-amber-700'}`}>
                            {trigger.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{trigger.reason}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${trigger.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {trigger.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Feedback Backlog</h3>
              <p className="mt-1 text-sm text-slate-500">Support queue mix for launch-day triage.</p>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-slate-500">Open</dt>
                  <dd className="font-medium text-slate-900">{snapshot.feedbackSummary.byStatus.Open}</dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-slate-500">In Review</dt>
                  <dd className="font-medium text-slate-900">{snapshot.feedbackSummary.byStatus['In Review']}</dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-slate-500">Planned</dt>
                  <dd className="font-medium text-slate-900">{snapshot.feedbackSummary.byStatus.Planned}</dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-slate-500">Closed</dt>
                  <dd className="font-medium text-slate-900">{snapshot.feedbackSummary.byStatus.Closed}</dd>
                </div>
              </dl>
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Priority mix</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">High</span>
                    <span className="font-medium text-slate-900">{snapshot.feedbackSummary.byPriority.High}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Medium</span>
                    <span className="font-medium text-slate-900">{snapshot.feedbackSummary.byPriority.Medium}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Low</span>
                    <span className="font-medium text-slate-900">{snapshot.feedbackSummary.byPriority.Low}</span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <RolloutCohortsPanel />
        </>
      ) : null}
    </div>
  );
};

export default Hypercare;
