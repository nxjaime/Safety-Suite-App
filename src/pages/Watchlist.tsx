import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  fetchInterventionQueue,
  recordInterventionAction,
  createCoachingPlanFromIntervention,
  type InterventionQueueItem
} from '../services/interventionQueueService';
import { useAuth } from '../contexts/AuthContext';
import { canManageSafety } from '../services/authorizationService';
import Modal from '../components/UI/Modal';

type FilterTab = 'all' | 'needs_action' | 'has_coaching';

const priorityTier = (score: number): { label: string; className: string } => {
  if (score >= 80) return { label: 'Critical', className: 'bg-red-100 text-red-700' };
  if (score >= 60) return { label: 'High', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Medium', className: 'bg-slate-100 text-slate-600' };
};

const Watchlist: React.FC = () => {
  const { role, capabilities } = useAuth();
  const canAct = capabilities?.canManageSafety ?? canManageSafety(role);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InterventionQueueItem[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');

  // Coaching plan modal
  const [coachingDriver, setCoachingDriver] = useState<InterventionQueueItem | null>(null);
  const [coachingForm, setCoachingForm] = useState({
    type: 'Performance',
    durationWeeks: 4,
    startDate: new Date().toISOString().split('T')[0]
  });

  // Dismiss modal
  const [dismissDriver, setDismissDriver] = useState<InterventionQueueItem | null>(null);
  const [dismissReason, setDismissReason] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const queue = await fetchInterventionQueue(100);
      setItems(queue);
    } catch (e) {
      console.error('Failed to load watchlist', e);
      setError('Failed to load watchlist');
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: items.length,
    critical: items.filter(i => i.priorityScore >= 80).length,
    hasCoaching: items.filter(i => i.hasActiveCoaching).length,
  }), [items]);

  const filtered = useMemo(() => {
    if (filter === 'needs_action') return items.filter(i => !i.hasActiveCoaching);
    if (filter === 'has_coaching') return items.filter(i => i.hasActiveCoaching);
    return items;
  }, [items, filter]);

  const handleStartCoaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachingDriver) return;
    try {
      await createCoachingPlanFromIntervention(coachingDriver.driverId, {
        ...coachingForm,
        actor: role || undefined,
      });
      toast.success(`Coaching plan started for ${coachingDriver.driverName}`);
      setCoachingDriver(null);
      load();
    } catch (err) {
      console.error('Start coaching', err);
      toast.error('Failed to start coaching plan');
    }
  };

  const handleDismiss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dismissDriver) return;
    try {
      await recordInterventionAction(dismissDriver.driverId, 'dismissed', {
        reason: dismissReason,
        actor: role || undefined,
      });
      toast.success(`Intervention dismissed for ${dismissDriver.driverName}`);
      setDismissDriver(null);
      setDismissReason('');
      load();
    } catch (err) {
      console.error('Dismiss intervention', err);
      toast.error('Failed to dismiss intervention');
    }
  };

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: `All (${stats.total})` },
    { id: 'needs_action', label: `Needs Action (${stats.total - stats.hasCoaching})` },
    { id: 'has_coaching', label: `Has Coaching (${stats.hasCoaching})` },
  ];

  return (
    <div className="space-y-6" data-testid="watchlist-page">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Intervention Watchlist</h2>
            <p className="mt-1 text-sm text-slate-500">
              Prioritized intervention queue. Coach, dismiss, or escalate high-risk drivers.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">In Queue</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{loading ? '—' : stats.total}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-600">Critical Priority</p>
          <p className="mt-1 text-3xl font-bold text-red-700">{loading ? '—' : stats.critical}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm text-blue-600">Active Coaching</p>
          <p className="mt-1 text-3xl font-bold text-blue-700">{loading ? '—' : stats.hasCoaching}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter Tabs + Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`mr-4 pb-2 text-sm font-medium border-b-2 transition-colors ${
                filter === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading watchlist...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Events</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Max Severity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended Action</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => {
                const tier = priorityTier(item.priorityScore);
                return (
                  <tr key={item.driverId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>{item.driverName}</span>
                        {item.hasActiveCoaching && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            <UserCheck className="h-3 w-3" />
                            Coaching
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.riskScore}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.recentEventCount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.maxSeverity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tier.className}`}>
                        {tier.label}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-slate-600">{item.recommendedAction}</td>
                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap space-x-3">
                      {canAct && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setCoachingForm({ type: 'Performance', durationWeeks: 4, startDate: new Date().toISOString().split('T')[0] });
                              setCoachingDriver(item);
                            }}
                            className="font-medium text-blue-600 hover:text-blue-900"
                          >
                            Coach
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDismissReason(''); setDismissDriver(item); }}
                            className="font-medium text-slate-500 hover:text-slate-700"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      <Link
                        to={`/drivers/${item.driverId}`}
                        className="font-medium text-emerald-700 hover:text-emerald-900"
                      >
                        Profile
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No drivers match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* Start Coaching Plan Modal */}
      <Modal
        isOpen={!!coachingDriver}
        onClose={() => setCoachingDriver(null)}
        title={`Start Coaching — ${coachingDriver?.driverName || ''}`}
      >
        <form onSubmit={handleStartCoaching} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Coaching Type</label>
            <select
              className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
              value={coachingForm.type}
              onChange={e => setCoachingForm(f => ({ ...f, type: e.target.value }))}
            >
              <option>Performance</option>
              <option>Safety</option>
              <option>HOS Compliance</option>
              <option>Defensive Driving</option>
              <option>Accident Follow-up</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Duration (weeks)</label>
            <input
              type="number"
              min={1}
              max={26}
              className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
              value={coachingForm.durationWeeks}
              onChange={e => setCoachingForm(f => ({ ...f, durationWeeks: parseInt(e.target.value) || 4 }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Start Date</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
              value={coachingForm.startDate}
              onChange={e => setCoachingForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setCoachingDriver(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Start Coaching Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Dismiss Intervention Modal */}
      <Modal
        isOpen={!!dismissDriver}
        onClose={() => setDismissDriver(null)}
        title={`Dismiss Intervention — ${dismissDriver?.driverName || ''}`}
      >
        <form onSubmit={handleDismiss} className="space-y-4">
          <p className="text-sm text-slate-600">
            This driver will be removed from the active queue. Provide a reason for audit purposes.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700">Reason</label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
              placeholder="e.g. False positive, already in coaching, no action needed..."
              value={dismissReason}
              onChange={e => setDismissReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setDismissDriver(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit"
              className="rounded-md bg-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-700">
              Dismiss
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Watchlist;
