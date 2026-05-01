import { beforeEach, describe, expect, it, vi } from 'vitest';
import { carrierService, type CarrierHealth } from '../services/carrierService';

const sampleHealth: CarrierHealth = {
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
    safetyRatingAsOf: '04/30/2026'
  },
  csaScores: {
    unsafeDriving: 12,
    hoursOfService: 18,
    driverFitness: 9,
    controlledSubstances: 0,
    vehicleMaintenance: 27,
    hazmat: 0,
    crashIndicator: 0,
  }
};

describe('carrierService FMCSA integration', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    carrierService.resetCarrierLookupCircuit();
    fetchSpy.mockReset();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(carrierService, 'cacheCarrierHealth').mockResolvedValue(undefined);
    vi.spyOn(carrierService, 'getCachedCarrierHealth').mockResolvedValue(null);
  });

  it('loads live FMCSA data, caches it, and flags carriers below the safety threshold', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ health: sampleHealth }),
    } as Response);

    const result = await carrierService.lookupCarrierHealth('3114665', { retryDelayMs: 0 });

    expect(fetchSpy).toHaveBeenCalledWith('/api/carrier-health?dot=3114665', expect.any(Object));
    expect(result.status).toBe('success');
    expect(result.source).toBe('live');
    expect(result.health?.legalName).toBe('AERO TRUCKING INC');
    expect(result.belowThreshold).toBe(true);
    expect(carrierService.cacheCarrierHealth).toHaveBeenCalledWith(sampleHealth);
  });

  it('retries transient failures before succeeding', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('network down'))
      .mockRejectedValueOnce(new Error('gateway timeout'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ health: sampleHealth }),
      } as Response);

    const result = await carrierService.lookupCarrierHealth('3114665', { retryDelayMs: 0 });

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(result.status).toBe('success');
    expect(result.health?.dotNumber).toBe('3114665');
  });

  it('opens the circuit after repeated failures and serves cached data without another fetch', async () => {
    fetchSpy.mockRejectedValue(new Error('lookup failed'));

    const first = await carrierService.lookupCarrierHealth('3114665', { retryDelayMs: 0 });
    expect(first.status).toBe('unavailable');
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    vi.mocked(carrierService.getCachedCarrierHealth).mockResolvedValueOnce(sampleHealth);

    const second = await carrierService.lookupCarrierHealth('3114665', { retryDelayMs: 0 });
    expect(second.status).toBe('degraded');
    expect(second.source).toBe('circuit-breaker');
    expect(second.health?.saferRating).toBe('UNSATISFACTORY');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
