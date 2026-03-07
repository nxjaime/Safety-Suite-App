import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { rolloutCohortService } from '../services/rolloutCohortService';

const authState = vi.hoisted(() => ({
  role: 'maintenance'
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ role: authState.role })
}));

import RolloutCohortsPanel from '../components/RolloutCohortsPanel';

describe('RolloutCohortsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.role = 'maintenance';
  });

  it('allows hypercare-capable users to add a rollout cohort', async () => {
    render(<RolloutCohortsPanel />);

    expect(screen.getByText(/No rollout cohorts configured yet/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Cohort Name/i), { target: { value: 'Wave 1 - West' } });
    fireEvent.change(screen.getByLabelText(/Target Date/i), { target: { value: '2026-03-20' } });
    fireEvent.change(screen.getByLabelText(/Target Orgs/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Owner/i), { target: { value: 'Ops Lead' } });
    fireEvent.change(screen.getByLabelText(/Notes/i), { target: { value: 'Pilot launch group' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Cohort/i }));

    expect((await screen.findAllByText(/Wave 1 - West/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Planned/i).length).toBeGreaterThan(0);
  });

  it('renders readonly role as read-only', () => {
    rolloutCohortService.createCohort({
      name: 'Wave 1 - West',
      targetDate: '2026-03-20',
      targetOrgCount: 5,
      owner: 'Ops Lead',
      notes: 'Pilot launch group',
      role: 'admin'
    });

    authState.role = 'readonly';
    render(<RolloutCohortsPanel />);

    expect(screen.getByText(/Readonly role has read-only access to rollout cohorts/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Cohort/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Wave 1 - West/i).length).toBeGreaterThan(0);
  });
});
