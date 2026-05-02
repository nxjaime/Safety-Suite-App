import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { trainingService } from '../services/trainingService';

const authState = vi.hoisted(() => ({
  role: 'driver' as 'driver' | 'readonly',
  user: { id: 'driver-user', email: 'driver@example.com', user_metadata: { role: 'driver' } },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authState.user,
    role: authState.role,
    capabilities: { canManageTraining: false },
  }),
}));

vi.mock('../services/driverService', () => ({
  driverService: {
    fetchDriversDetailed: vi.fn().mockResolvedValue([
      {
        id: 'driver-1',
        name: 'Alex Driver',
        email: 'driver@example.com',
        riskScore: 41,
        coachingPlans: [
          { id: 'plan-1', type: 'Defensive Driving', startDate: '2026-05-01', durationWeeks: 4, weeklyCheckIns: [] },
        ],
      },
    ]),
  },
}));

vi.mock('../services/trainingService', () => ({
  trainingService: {
    listAssignments: vi.fn().mockResolvedValue([
      { id: 'a1', module_name: 'Hours of Service', assignee_id: 'driver-1', due_date: '2026-05-10', status: 'Active', progress: 0 },
      { id: 'a2', module_name: 'Completed Refresher', assignee_id: 'driver-1', due_date: '2026-05-02', status: 'Completed', progress: 100 },
    ]),
    updateAssignment: vi.fn().mockResolvedValue({ id: 'a1', module_name: 'Hours of Service', assignee_id: 'driver-1', due_date: '2026-05-10', status: 'Completed', progress: 100 }),
  },
}));

import DriverPortal from '../pages/DriverPortal';

describe('DriverPortal', () => {
  beforeEach(() => {
    authState.role = 'driver';
    authState.user = { id: 'driver-user', email: 'driver@example.com', user_metadata: { role: 'driver' } };
  });

  it('shows driver metrics and supports training completion', async () => {
    render(<DriverPortal />);

    expect(await screen.findByRole('heading', { name: /Welcome, Alex Driver/i })).toBeInTheDocument();
    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.getByText(/Assignments waiting for your review/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Your training assignments/i })).toBeInTheDocument();

    const completeButtons = screen.getAllByRole('button', { name: /Mark complete/i });
    fireEvent.click(completeButtons[0]);

    await waitFor(() => {
      expect(trainingService.updateAssignment).toHaveBeenCalledWith('a1', expect.objectContaining({ status: 'Completed', progress: 100 }), 'driver');
    });
  });

  it('renders coaching acknowledgements', async () => {
    render(<DriverPortal />);

    expect(await screen.findByRole('heading', { name: /Coaching acknowledgements/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Acknowledge/i }));
    expect(await screen.findByText(/Acknowledged/i)).toBeInTheDocument();
  });
});
