import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const authState = vi.hoisted(() => ({
  role: 'manager'
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ role: authState.role })
}));

import HypercareDailyReviewsPanel from '../components/HypercareDailyReviewsPanel';

describe('HypercareDailyReviewsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.role = 'manager';
  });

  it('renders the latest published review summary and manager controls', async () => {
    const { hypercareReviewService } = await import('../services/hypercareReviewService');

    const review = hypercareReviewService.createReview({
      reviewDate: '2026-03-07',
      reviewWindow: 'AM',
      owner: 'Ops Lead',
      overallHealth: 'Monitor',
      incidentSummary: 'No P0 incidents; one auth regression under watch',
      topRisks: 'Training lag in Wave 1',
      mitigationActions: 'Customer success owner assigned follow-up outreach',
      cohortDecision: 'Hold',
      role: 'manager'
    });

    hypercareReviewService.publishReview(review.id, 'manager');

    render(<HypercareDailyReviewsPanel />);

    expect(screen.getByRole('heading', { name: /Daily Reviews/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log Review/i })).toBeInTheDocument();
    expect(await screen.findByText(/Latest Published Update/i)).toBeInTheDocument();
    expect(screen.getByText(/No P0 incidents; one auth regression under watch/i)).toBeInTheDocument();
  });

  it('allows manager users to add a draft review', async () => {
    render(<HypercareDailyReviewsPanel />);

    fireEvent.change(screen.getByLabelText(/Review Date/i), { target: { value: '2026-03-07' } });
    fireEvent.change(screen.getByLabelText(/Review Window/i), { target: { value: 'PM' } });
    fireEvent.change(screen.getByLabelText(/Owner/i), { target: { value: 'Ops Lead' } });
    fireEvent.change(screen.getByLabelText(/Overall Health/i), { target: { value: 'Stable' } });
    fireEvent.change(screen.getByLabelText(/Incident Summary/i), {
      target: { value: 'Critical blockers resolved before end-of-day review' }
    });
    fireEvent.change(screen.getByLabelText(/Top Risks/i), {
      target: { value: 'Low-priority support tickets remain open' }
    });
    fireEvent.change(screen.getByLabelText(/Mitigation Actions/i), {
      target: { value: 'Support queue owner closing remaining items' }
    });
    fireEvent.change(screen.getByLabelText(/Cohort Decision/i), { target: { value: 'Proceed' } });
    fireEvent.click(screen.getByRole('button', { name: /Log Review/i }));

    expect(await screen.findByText(/Critical blockers resolved before end-of-day review/i)).toBeInTheDocument();
    expect(screen.getByText(/Draft/i)).toBeInTheDocument();
  });

  it('renders viewer role as read-only', async () => {
    const { hypercareReviewService } = await import('../services/hypercareReviewService');

    const review = hypercareReviewService.createReview({
      reviewDate: '2026-03-07',
      reviewWindow: 'AM',
      owner: 'Ops Lead',
      overallHealth: 'Stable',
      incidentSummary: 'No launch blockers open',
      topRisks: 'Training closeout for final pilot drivers',
      mitigationActions: 'Manager follow-up scheduled',
      cohortDecision: 'Proceed',
      role: 'admin'
    });

    hypercareReviewService.publishReview(review.id, 'admin');
    authState.role = 'viewer';

    render(<HypercareDailyReviewsPanel />);

    expect(screen.getByText(/Viewer role has read-only access to daily reviews/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Log Review/i })).not.toBeInTheDocument();
    expect(await screen.findByText(/No launch blockers open/i)).toBeInTheDocument();
  });
});
