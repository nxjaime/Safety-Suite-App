import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { canManageHypercare } from '../services/authorizationService';
import {
  rolloutCohortService,
  type RolloutCohort,
  type RolloutCohortStatus
} from '../services/rolloutCohortService';

const statusClassNames: Record<RolloutCohortStatus, string> = {
  Planned: 'bg-slate-100 text-slate-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Paused: 'bg-amber-100 text-amber-700',
  Completed: 'bg-blue-100 text-blue-700'
};

const RolloutCohortsPanel: React.FC = () => {
  const { capabilities, role } = useAuth();
  const canManage = capabilities?.canManageHypercare ?? canManageHypercare(role);
  const [cohorts, setCohorts] = useState<RolloutCohort[]>([]);
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetOrgCount, setTargetOrgCount] = useState('1');
  const [owner, setOwner] = useState('');
  const [notes, setNotes] = useState('');

  const refreshCohorts = () => {
    setCohorts(rolloutCohortService.listCohorts());
  };

  useEffect(() => {
    refreshCohorts();
  }, []);

  const nextCohort = useMemo(() => {
    return cohorts.find((cohort) => cohort.status !== 'Completed') || null;
  }, [cohorts]);

  const resetForm = () => {
    setName('');
    setTargetDate('');
    setTargetOrgCount('1');
    setOwner('');
    setNotes('');
  };

  const handleCreate = () => {
    try {
      rolloutCohortService.createCohort({
        name,
        notes,
        owner,
        role,
        targetDate,
        targetOrgCount: Number(targetOrgCount)
      });
      refreshCohorts();
      resetForm();
      toast.success('Rollout cohort added');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add rollout cohort';
      toast.error(message);
    }
  };

  const handleStatusChange = (id: string, status: RolloutCohortStatus) => {
    try {
      rolloutCohortService.updateStatus(id, role, status);
      refreshCohorts();
      toast.success(`Cohort marked ${status.toLowerCase()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update rollout cohort';
      toast.error(message);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Rollout Cohorts</h3>
          <p className="mt-1 text-sm text-slate-500">
            Track phased org activation waves and keep the next go/no-go decision visible in Hypercare.
          </p>
        </div>
        {nextCohort && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Next cohort</p>
            <p className="mt-1 font-medium text-slate-900">{nextCohort.name}</p>
            <p className="text-xs text-slate-500">
              {nextCohort.status} • target {new Date(nextCohort.targetDate).toLocaleDateString()} • {nextCohort.targetOrgCount} orgs
            </p>
          </div>
        )}
      </div>

      {canManage ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm text-slate-600">
            Cohort Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600">
            Target Date
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600">
            Target Orgs
            <input
              type="number"
              min="1"
              value={targetOrgCount}
              onChange={(event) => setTargetOrgCount(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600">
            Owner
            <input
              type="text"
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600 xl:col-span-1">
            Notes
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <div className="md:col-span-2 xl:col-span-5">
            <button
              onClick={handleCreate}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Add Cohort
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Readonly role has read-only access to rollout cohorts.</p>
      )}

      {cohorts.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          No rollout cohorts configured yet.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {cohorts.map((cohort) => (
            <article key={cohort.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{cohort.name}</p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusClassNames[cohort.status]}`}>
                      {cohort.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Target {new Date(cohort.targetDate).toLocaleDateString()} • {cohort.targetOrgCount} orgs • owner {cohort.owner}
                  </p>
                  {cohort.notes && <p className="mt-2 text-sm text-slate-600">{cohort.notes}</p>}
                </div>
                {canManage && cohort.status !== 'Completed' && (
                  <div className="flex flex-wrap gap-2">
                    {cohort.status !== 'Active' && (
                      <button
                        onClick={() => handleStatusChange(cohort.id, 'Active')}
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        Mark Active
                      </button>
                    )}
                    {cohort.status !== 'Paused' && (
                      <button
                        onClick={() => handleStatusChange(cohort.id, 'Paused')}
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(cohort.id, 'Completed')}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Complete
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default RolloutCohortsPanel;
