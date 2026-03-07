import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  hypercareReviewService,
  type HypercareCohortDecision,
  type HypercareReview,
  type HypercareReviewHealth,
  type HypercareReviewWindow
} from '../services/hypercareReviewService';

const statusClassNames = {
  Draft: 'bg-slate-100 text-slate-700',
  Published: 'bg-emerald-100 text-emerald-700'
} as const;

const healthClassNames = {
  Stable: 'bg-emerald-50 text-emerald-700',
  Monitor: 'bg-amber-50 text-amber-700',
  Escalate: 'bg-rose-50 text-rose-700'
} as const;

const HypercareDailyReviewsPanel: React.FC = () => {
  const { role } = useAuth();
  const canManage = role !== 'viewer';
  const [reviews, setReviews] = useState<HypercareReview[]>([]);
  const [reviewDate, setReviewDate] = useState('');
  const [reviewWindow, setReviewWindow] = useState<HypercareReviewWindow>('AM');
  const [owner, setOwner] = useState('');
  const [overallHealth, setOverallHealth] = useState<HypercareReviewHealth>('Monitor');
  const [incidentSummary, setIncidentSummary] = useState('');
  const [topRisks, setTopRisks] = useState('');
  const [mitigationActions, setMitigationActions] = useState('');
  const [cohortDecision, setCohortDecision] = useState<HypercareCohortDecision>('Hold');

  const refreshReviews = () => {
    setReviews(hypercareReviewService.listReviews());
  };

  useEffect(() => {
    refreshReviews();
  }, []);

  const latestPublishedReview = useMemo(() => {
    return reviews.find((review) => review.status === 'Published') ?? null;
  }, [reviews]);

  const historyReviews = useMemo(() => {
    if (!latestPublishedReview) {
      return reviews;
    }

    return reviews.filter((review) => review.id !== latestPublishedReview.id);
  }, [latestPublishedReview, reviews]);

  const resetForm = () => {
    setReviewDate('');
    setReviewWindow('AM');
    setOwner('');
    setOverallHealth('Monitor');
    setIncidentSummary('');
    setTopRisks('');
    setMitigationActions('');
    setCohortDecision('Hold');
  };

  const handleCreateReview = () => {
    try {
      hypercareReviewService.createReview({
        cohortDecision,
        incidentSummary,
        mitigationActions,
        overallHealth,
        owner,
        reviewDate,
        reviewWindow,
        role,
        topRisks
      });
      refreshReviews();
      resetForm();
      toast.success('Daily review logged');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to log daily review';
      toast.error(message);
    }
  };

  const handlePublishReview = (id: string) => {
    try {
      hypercareReviewService.publishReview(id, role);
      refreshReviews();
      toast.success('Status update published');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish status update';
      toast.error(message);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Daily Reviews</h3>
          <p className="mt-1 text-sm text-slate-500">
            Capture AM/PM hypercare reviews, publish internal status, and keep cohort go/no-go decisions attached to the launch record.
          </p>
        </div>
        {latestPublishedReview && (
          <div className={`rounded-xl px-4 py-3 text-sm ${healthClassNames[latestPublishedReview.overallHealth]}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">Published Status</p>
            <p className="mt-1 font-medium">
              {latestPublishedReview.reviewDate} {latestPublishedReview.reviewWindow} · {latestPublishedReview.owner}
            </p>
            <p className="mt-1 text-xs">Cohort decision: {latestPublishedReview.cohortDecision}</p>
          </div>
        )}
      </div>

      {canManage ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm text-slate-600">
            Review Date
            <input
              type="date"
              value={reviewDate}
              onChange={(event) => setReviewDate(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600">
            Review Window
            <select
              value={reviewWindow}
              onChange={(event) => setReviewWindow(event.target.value as HypercareReviewWindow)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
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
          <label className="text-sm text-slate-600">
            Overall Health
            <select
              value={overallHealth}
              onChange={(event) => setOverallHealth(event.target.value as HypercareReviewHealth)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="Stable">Stable</option>
              <option value="Monitor">Monitor</option>
              <option value="Escalate">Escalate</option>
            </select>
          </label>
          <label className="text-sm text-slate-600 md:col-span-2 xl:col-span-2">
            Incident Summary
            <textarea
              value={incidentSummary}
              onChange={(event) => setIncidentSummary(event.target.value)}
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600 md:col-span-2 xl:col-span-1">
            Top Risks
            <textarea
              value={topRisks}
              onChange={(event) => setTopRisks(event.target.value)}
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600 md:col-span-2 xl:col-span-1">
            Mitigation Actions
            <textarea
              value={mitigationActions}
              onChange={(event) => setMitigationActions(event.target.value)}
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600 xl:col-span-1">
            Cohort Decision
            <select
              value={cohortDecision}
              onChange={(event) => setCohortDecision(event.target.value as HypercareCohortDecision)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="Proceed">Proceed</option>
              <option value="Hold">Hold</option>
              <option value="Escalate">Escalate</option>
            </select>
          </label>
          <div className="md:col-span-2 xl:col-span-4">
            <button
              onClick={handleCreateReview}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Log Review
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Viewer role has read-only access to daily reviews.</p>
      )}

      {latestPublishedReview ? (
        <article className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Latest Published Update</p>
              <p className="mt-1 text-sm text-emerald-700">
                {latestPublishedReview.reviewDate} {latestPublishedReview.reviewWindow} · {latestPublishedReview.owner}
              </p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusClassNames[latestPublishedReview.status]}`}>
              {latestPublishedReview.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-700">{latestPublishedReview.incidentSummary}</p>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="font-medium text-slate-800">Top Risks</p>
              <p className="mt-1 text-slate-600">{latestPublishedReview.topRisks}</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Mitigation Actions</p>
              <p className="mt-1 text-slate-600">{latestPublishedReview.mitigationActions}</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Cohort Decision</p>
              <p className="mt-1 text-slate-600">{latestPublishedReview.cohortDecision}</p>
            </div>
          </div>
        </article>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          No published status update yet.
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          No daily reviews logged yet.
        </div>
      ) : historyReviews.length > 0 ? (
        <div className="mt-5 space-y-3">
          {historyReviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {review.reviewDate} {review.reviewWindow}
                    </p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusClassNames[review.status]}`}>
                      {review.status}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${healthClassNames[review.overallHealth]}`}>
                      {review.overallHealth}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Owner {review.owner} · Cohort decision {review.cohortDecision}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{review.incidentSummary}</p>
                </div>
                {canManage && review.status !== 'Published' && (
                  <button
                    onClick={() => handlePublishReview(review.id)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Publish Update
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default HypercareDailyReviewsPanel;
