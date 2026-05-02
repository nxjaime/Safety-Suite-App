import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Clock3, GraduationCap, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { driverService } from '../services/driverService';
import { trainingService } from '../services/trainingService';
import type { Driver, TrainingAssignment } from '../types';

const DriverPortal: React.FC = () => {
  const { user, role } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedPlans, setAcknowledgedPlans] = useState<Record<string, boolean>>({});
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [drivers, allAssignments] = await Promise.all([
          driverService.fetchDriversDetailed(),
          trainingService.listAssignments(),
        ]);
        if (cancelled) return;
        const currentDriver = drivers.find((item) => item.email && item.email.toLowerCase() === (user?.email || '').toLowerCase())
          || drivers.find((item) => item.id === user?.id)
          || null;
        setDriver(currentDriver);
        setAssignments(allAssignments.filter((assignment) => !currentDriver || assignment.assignee_id === currentDriver.id || assignment.assignee_id === user?.id));
      } catch (err) {
        console.warn('Failed to load driver portal', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.email, user?.id]);

  const openTraining = useMemo(() => assignments.filter((a) => a.status !== 'Completed').length, [assignments]);
  const completed = useMemo(() => assignments.filter((a) => a.status === 'Completed').length, [assignments]);
  const dueSoon = useMemo(() => assignments.filter((a) => a.due_date && a.status !== 'Completed').slice(0, 3), [assignments]);
  const coachingPlans = driver?.coachingPlans || [];

  const handleAcknowledgePlan = (planId: string) => {
    setAcknowledgedPlans((prev) => ({ ...prev, [planId]: true }));
    toast.success('Coaching plan acknowledged');
  };

  const handleCompleteTraining = async (assignment: TrainingAssignment) => {
    if (completingId) return;
    setCompletingId(assignment.id);
    try {
      const updated = await trainingService.updateAssignment(assignment.id, {
        status: 'Completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        completed_by: user?.id ?? undefined,
        completion_notes: 'Completed from driver portal',
      }, role);
      setAssignments((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      toast.success('Training marked complete');
    } catch (err) {
      console.error('Failed to complete training', err);
      toast.error('Could not complete training');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading driver portal…</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" /> Driver Portal
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-slate-900">Welcome{driver?.name ? `, ${driver.name}` : ''}</h1>
              <p className="mt-1 text-sm text-slate-500">Your assigned training, coaching acknowledgements, and safety history in one place.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm sm:min-w-[260px]">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xl font-semibold text-slate-900">{driver?.riskScore ?? '—'}</div>
                <div className="text-xs text-slate-500">Risk score</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xl font-semibold text-slate-900">{openTraining}</div>
                <div className="text-xs text-slate-500">Open training</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xl font-semibold text-slate-900">{completed}</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><GraduationCap className="h-4 w-4 text-emerald-600" /> Open training</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{openTraining}</div>
            <div className="mt-1 text-sm text-slate-500">Assignments waiting for your review.</div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><ClipboardCheck className="h-4 w-4 text-sky-600" /> Coaching plans</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{coachingPlans.length}</div>
            <div className="mt-1 text-sm text-slate-500">Active plans waiting for acknowledgement.</div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><Clock3 className="h-4 w-4 text-amber-600" /> Due soon</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{dueSoon.length}</div>
            <div className="mt-1 text-sm text-slate-500">Visible items due next.</div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Your training assignments</h2>
            <div className="mt-4 space-y-3">
              {assignments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No training assignments are currently assigned to you.</div>
              ) : assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{assignment.module_name}</div>
                      <div className="text-sm text-slate-500">Due {assignment.due_date || '—'} · Status {assignment.status}</div>
                    </div>
                    <button
                      type="button"
                      disabled={assignment.status === 'Completed' || completingId === assignment.id}
                      onClick={() => handleCompleteTraining(assignment)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <CheckCircle2 className="h-4 w-4" /> {assignment.status === 'Completed' ? 'Completed' : 'Mark complete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Coaching acknowledgements</h2>
            <div className="mt-4 space-y-3">
              {coachingPlans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No active coaching plans were found.</div>
              ) : coachingPlans.map((plan) => (
                <div key={plan.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{plan.type}</div>
                      <div className="text-sm text-slate-500">Started {plan.startDate} · {plan.durationWeeks} weeks</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAcknowledgePlan(plan.id)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {acknowledgedPlans[plan.id] ? 'Acknowledged' : 'Acknowledge'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming items</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {dueSoon.map((assignment) => (
              <div key={assignment.id} className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-900">{assignment.module_name}</div>
                <div className="mt-1 text-sm text-slate-500">Due {assignment.due_date || '—'}</div>
              </div>
            ))}
            {dueSoon.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 md:col-span-3">Nothing due soon.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><ShieldAlert className="h-4 w-4 text-rose-600" /> Safety reminder</div>
          <p className="mt-2 text-sm text-slate-600">If you see missing or incorrect assignments, contact your safety manager. Your portal is intentionally read-focused and optimized for mobile use.</p>
        </section>
      </div>
    </main>
  );
};

export default DriverPortal;
