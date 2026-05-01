import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { getInspections, lookupCarrierHealth } = vi.hoisted(() => ({
  getInspections: vi.fn(),
  lookupCarrierHealth: vi.fn(),
}));

vi.mock('../services/inspectionService', () => ({
  inspectionService: {
    getInspections,
  },
}));

vi.mock('../services/carrierService', () => ({
  carrierService: {
    lookupCarrierHealth,
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    __esModule: true,
  },
}));

import CSAPredictor from '../pages/CSAPredictor';

const carrierResult = {
  status: 'success',
  source: 'live',
  message: 'Live FMCSA carrier snapshot loaded.',
  belowThreshold: false,
  threshold: 'CONDITIONAL',
  health: {
    dotNumber: '3114665',
    legalName: 'AERO TRUCKING INC',
    entityType: 'CARRIER',
    operatingStatus: 'AUTHORIZED FOR Property',
    saferRating: 'SATISFACTORY',
    powerUnits: 1,
    drivers: 2,
    lastUpdated: '2026-04-30T00:00:00.000Z',
    inspectionSummary: {
      usInspections: 5,
      canadianInspections: 0,
      totalInspections: 5,
      outOfServiceInspections: 3,
      outOfServiceRate: 60,
      crashes: { fatal: 0, injury: 0, tow: 0, total: 0 },
      derivedAt: '2026-04-30T00:00:00.000Z',
      safetyRatingAsOf: '04/30/2026',
    },
    csaScores: {
      unsafeDriving: 12,
      hoursOfService: 18,
      driverFitness: 9,
      controlledSubstances: 0,
      vehicleMaintenance: 27,
      hazmat: 0,
      crashIndicator: 0,
    },
  },
} as const;

describe('CSA Predictor FMCSA seed flow', () => {
  it('loads an FMCSA carrier snapshot into the predictor', async () => {
    getInspections.mockResolvedValue([]);
    lookupCarrierHealth.mockResolvedValueOnce(carrierResult);

    render(
      <MemoryRouter>
        <CSAPredictor />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/DOT #/i), { target: { value: '3114665' } });
    fireEvent.click(screen.getByRole('button', { name: /Load FMCSA/i }));

    expect(await screen.findByText(/FMCSA crash indicator seed/i)).toBeInTheDocument();
    expect(screen.getByText(/Seeded from real data/i)).toBeInTheDocument();
    expect(screen.getByText(/FMCSA carrier snapshot/i)).toBeInTheDocument();
    expect(lookupCarrierHealth).toHaveBeenCalledWith('3114665');
  });
});
