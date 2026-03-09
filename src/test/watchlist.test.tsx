import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';

const authState = vi.hoisted(() => ({
  role: 'readonly' as 'readonly' | 'safety'
}));

const mockItems = vi.hoisted(() => [
  {
    driverId: 'driver-1',
    driverName: 'Alice Johnson',
    riskScore: 90,
    recentEventCount: 5,
    maxSeverity: 9,
    hasActiveCoaching: false,
    priorityScore: 85,
    recommendedAction: 'Assign coaching plan and open intervention follow-up task',
  },
  {
    driverId: 'driver-2',
    driverName: 'Bob Smith',
    riskScore: 65,
    recentEventCount: 2,
    maxSeverity: 5,
    hasActiveCoaching: true,
    priorityScore: 62,
    recommendedAction: 'Schedule immediate check-in and review intervention outcomes',
  },
  {
    driverId: 'driver-3',
    driverName: 'Carol White',
    riskScore: 45,
    recentEventCount: 1,
    maxSeverity: 3,
    hasActiveCoaching: false,
    priorityScore: 42,
    recommendedAction: 'Assign coaching plan and open intervention follow-up task',
  },
]);

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    role: authState.role,
    capabilities: {
      canManageSafety: authState.role === 'safety'
    }
  })
}));

vi.mock('../services/interventionQueueService', () => ({
  fetchInterventionQueue: vi.fn().mockResolvedValue(mockItems),
  recordInterventionAction: vi.fn().mockResolvedValue({}),
  createCoachingPlanFromIntervention: vi.fn().mockResolvedValue({ coachingPlanId: 'plan-1', action: {} }),
}));

import Watchlist from '../pages/Watchlist';

describe('Watchlist page', () => {
  beforeEach(() => {
    authState.role = 'readonly';
  });

  it('renders page heading', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    expect(await screen.findByText('Intervention Watchlist')).toBeInTheDocument();
  });

  it('renders all drivers after load', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Carol White')).toBeInTheDocument();
  });

  it('shows Critical badge for priority >= 80', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Alice Johnson');
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('shows High badge for priority 60-79', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Bob Smith');
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows Medium badge for priority < 60', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Carol White');
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('shows Coaching badge for driver with active coaching', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Bob Smith');
    expect(screen.getByText('Coaching')).toBeInTheDocument();
  });

  it('renders summary stats after load', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Alice Johnson');
    expect(screen.getByText('In Queue')).toBeInTheDocument();
    expect(screen.getByText('Critical Priority')).toBeInTheDocument();
    expect(screen.getByText('Active Coaching')).toBeInTheDocument();
  });

  it('does NOT show Coach/Dismiss buttons for readonly role', async () => {
    authState.role = 'readonly';
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Alice Johnson');
    expect(screen.queryAllByRole('button', { name: /^Coach$/i })).toHaveLength(0);
    expect(screen.queryAllByRole('button', { name: /^Dismiss$/i })).toHaveLength(0);
  });

  it('shows Coach and Dismiss buttons for safety role', async () => {
    authState.role = 'safety';
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Alice Johnson');
    const coachButtons = screen.getAllByRole('button', { name: /^Coach$/i });
    expect(coachButtons.length).toBeGreaterThan(0);
    const dismissButtons = screen.getAllByRole('button', { name: /^Dismiss$/i });
    expect(dismissButtons.length).toBeGreaterThan(0);
  });

  it('opens coaching modal when Coach is clicked', async () => {
    authState.role = 'safety';
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Alice Johnson');
    fireEvent.click(screen.getAllByRole('button', { name: /^Coach$/i })[0]);
    expect(await screen.findByRole('dialog', { name: /Start Coaching/i })).toBeInTheDocument();
  });

  it('opens dismiss modal when Dismiss is clicked', async () => {
    authState.role = 'safety';
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Alice Johnson');
    fireEvent.click(screen.getAllByRole('button', { name: /^Dismiss$/i })[0]);
    expect(await screen.findByRole('dialog', { name: /Dismiss Intervention/i })).toBeInTheDocument();
  });

  it('filter tab "Has Coaching" shows only coaching drivers', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Alice Johnson');
    fireEvent.click(screen.getByText(/Has Coaching/i));
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('filter tab "Needs Action" hides coaching drivers', async () => {
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    await screen.findByText('Alice Johnson');
    fireEvent.click(screen.getByText(/Needs Action/i));
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });
});
