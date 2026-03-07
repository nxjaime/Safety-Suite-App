import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const authState = vi.hoisted(() => ({
  role: 'readonly' as 'readonly' | 'safety'
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    role: authState.role,
    capabilities: {
      canManageSafety: authState.role === 'safety'
    }
  })
}));

vi.mock('../services/interventionQueueService', () => ({
  fetchInterventionQueue: vi.fn().mockResolvedValue([])
}));

vi.mock('../services/driverService', () => ({
  driverService: {
    fetchSafetyStats: vi.fn().mockResolvedValue({
      riskScore: 42,
      incidentCount: 3,
      coachingCount: 1,
      riskDistribution: { green: 2, yellow: 1, red: 0 },
      topIncidentTypes: [],
      scoreTrend: []
    }),
    fetchDriversPaginated: vi.fn().mockResolvedValue({ data: [] }),
    fetchDrivers: vi.fn().mockResolvedValue([]),
    addRiskEvent: vi.fn().mockResolvedValue(undefined)
  }
}));

import Safety from '../pages/Safety';

describe('Safety page', () => {
  beforeEach(() => {
    authState.role = 'readonly';
  });

  it('renders readonly users as read-only for risk logging', async () => {
    render(
      <MemoryRouter>
        <Safety />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Safety Intelligence Center/i })).toBeInTheDocument();
    expect(screen.getByText(/Readonly role has read-only access to safety event logging/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Log Event/i })).not.toBeInTheDocument();
  });

  it('allows safety users to open the risk logging flow', async () => {
    authState.role = 'safety';

    render(
      <MemoryRouter>
        <Safety />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Safety Intelligence Center/i })).toBeInTheDocument();
    const logButton = screen.getByRole('button', { name: /Log Event/i });
    fireEvent.click(logButton);
    expect(await screen.findByRole('dialog', { name: /Log Risk Event/i })).toBeInTheDocument();
  });
});
