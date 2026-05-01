import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { lookupCarrierHealth } = vi.hoisted(() => ({
  lookupCarrierHealth: vi.fn(),
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
  },
}));

import FMCSA from '../pages/FMCSA';

const sampleResult = {
  status: 'success',
  source: 'live',
  message: 'Live FMCSA carrier snapshot loaded.',
  belowThreshold: true,
  threshold: 'CONDITIONAL',
  health: {
    dotNumber: '3114665',
    legalName: 'AERO TRUCKING INC',
    entityType: 'CARRIER',
    operatingStatus: 'AUTHORIZED FOR Property',
    saferRating: 'UNSATISFACTORY',
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

describe('FMCSA page', () => {
  it('renders live carrier health cards and threshold alerts from FMCSA data', async () => {
    lookupCarrierHealth.mockResolvedValueOnce(sampleResult);

    render(
      <MemoryRouter>
        <FMCSA />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter USDOT number/i), { target: { value: '3114665' } });
    fireEvent.change(screen.getByDisplayValue('Conditional'), { target: { value: 'CONDITIONAL' } });
    fireEvent.click(screen.getByRole('button', { name: /Look Up/i }));

    expect(await screen.findByText('AERO TRUCKING INC')).toBeInTheDocument();
    expect(screen.getByText(/Total inspections/i)).toBeInTheDocument();
    expect(screen.getByText(/Crash total/i)).toBeInTheDocument();
    expect(screen.getByText(/FMCSA-derived CSA seed/i)).toBeInTheDocument();
    expect(screen.getByText(/Below threshold/i)).toBeInTheDocument();
    expect(lookupCarrierHealth).toHaveBeenCalledWith('3114665', expect.objectContaining({ threshold: 'CONDITIONAL' }));
  });
});
