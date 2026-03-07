import { beforeEach, describe, expect, it } from 'vitest';

describe('hypercareReviewService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates reviews and lists newest review window first', async () => {
    const { hypercareReviewService } = await import('../services/hypercareReviewService');

    hypercareReviewService.createReview({
      reviewDate: '2026-03-07',
      reviewWindow: 'AM',
      owner: 'Ops Lead',
      overallHealth: 'Monitor',
      incidentSummary: 'No P0 incidents; one permissions issue under triage',
      topRisks: 'Training completion lag for Wave 1',
      mitigationActions: 'Assigned enablement owner and follow-up check',
      cohortDecision: 'Hold',
      role: 'manager'
    });

    hypercareReviewService.createReview({
      reviewDate: '2026-03-07',
      reviewWindow: 'PM',
      owner: 'Ops Lead',
      overallHealth: 'Stable',
      incidentSummary: 'Critical blockers resolved before end-of-day check',
      topRisks: 'Minor support backlog remains open',
      mitigationActions: 'Support team to close remaining low-priority tickets',
      cohortDecision: 'Proceed',
      role: 'admin'
    });

    const reviews = hypercareReviewService.listReviews();
    expect(reviews).toHaveLength(2);
    expect(reviews[0].reviewWindow).toBe('PM');
    expect(reviews[1].reviewWindow).toBe('AM');
  });

  it('blocks viewer mutations', async () => {
    const { hypercareReviewService } = await import('../services/hypercareReviewService');

    expect(() =>
      hypercareReviewService.createReview({
        reviewDate: '2026-03-07',
        reviewWindow: 'AM',
        owner: 'Ops Lead',
        overallHealth: 'Monitor',
        incidentSummary: 'Permissions issue under triage',
        topRisks: 'Training completion lag',
        mitigationActions: 'Assigned owner',
        cohortDecision: 'Hold',
        role: 'readonly'
      })
    ).toThrow('Insufficient permissions for this action');
  });

  it('publishes a review and records audit activity', async () => {
    const { hypercareReviewService } = await import('../services/hypercareReviewService');

    const review = hypercareReviewService.createReview({
      reviewDate: '2026-03-07',
      reviewWindow: 'AM',
      owner: 'Ops Lead',
      overallHealth: 'Escalate',
      incidentSummary: 'One integration outage remains open',
      topRisks: 'Cohort activation blocked by open auth defect',
      mitigationActions: 'Engineering hotfix assigned with noon ETA',
      cohortDecision: 'Escalate',
      role: 'admin'
    });

    hypercareReviewService.publishReview(review.id, 'manager');

    const updated = hypercareReviewService.listReviews()[0];
    expect(updated.status).toBe('Published');
    expect(updated.publishedAt).toBeTruthy();

    const audit = hypercareReviewService.listAuditEntries();
    expect(audit.some((entry) => entry.action === 'review_created')).toBe(true);
    expect(audit.some((entry) => entry.action === 'review_published' && entry.targetId === review.id)).toBe(true);
  });

  it('allows coaching users to create and publish hypercare reviews', async () => {
    const { hypercareReviewService } = await import('../services/hypercareReviewService');

    const review = hypercareReviewService.createReview({
      reviewDate: '2026-03-08',
      reviewWindow: 'PM',
      owner: 'Enablement Lead',
      overallHealth: 'Monitor',
      incidentSummary: 'Training backlog elevated after launch huddle',
      topRisks: 'Completion lag in newly activated cohort',
      mitigationActions: 'Coaching team assigned follow-up outreach',
      cohortDecision: 'Hold',
      role: 'coaching'
    });

    hypercareReviewService.publishReview(review.id, 'coaching');

    expect(hypercareReviewService.listReviews()[0].status).toBe('Published');
  });
});
