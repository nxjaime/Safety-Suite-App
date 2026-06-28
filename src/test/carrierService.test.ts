import { beforeEach, describe, expect, it, vi } from 'vitest';
import { carrierService, type CarrierHealth } from '../services/carrierService';

const currentOrganizationMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', () => ({
  getCurrentOrganization: currentOrganizationMock,
  supabase: {
    from: fromMock,
  },
}));

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
    currentOrganizationMock.mockReset();
    currentOrganizationMock.mockResolvedValue('org-123');
    fromMock.mockReset();
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

describe('carrierService carrier settings persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    currentOrganizationMock.mockReset();
    currentOrganizationMock.mockResolvedValue('org-123');
    fromMock.mockReset();
  });

  it('saves carrier settings with the current organization id as the settings row id', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });

    await carrierService.saveCarrierSettings({
      id: 'default',
      dotNumber: '3114665',
      mcNumber: 'MC-123',
      companyName: 'SafetyHub Test Carrier',
    });

    expect(fromMock).toHaveBeenCalledWith('carrier_settings');
    expect(upsert).toHaveBeenCalledWith([expect.objectContaining({
      id: 'org-123',
      organization_id: 'org-123',
      dot_number: '3114665',
      mc_number: 'MC-123',
      company_name: 'SafetyHub Test Carrier',
    })], { onConflict: 'id' });
  });

  it('reads carrier settings through the current organization scope', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'org-123',
        organization_id: 'org-123',
        dot_number: '3114665',
        mc_number: 'MC-123',
        company_name: 'SafetyHub Test Carrier',
      },
      error: null,
    });
    const eq = vi.fn(function eq() {
      return chain;
    });
    const chain = {
      select: vi.fn(() => chain),
      eq,
      maybeSingle,
    };
    fromMock.mockReturnValue(chain);

    const settings = await carrierService.getCarrierSettings();

    expect(settings).toEqual({
      id: 'org-123',
      dotNumber: '3114665',
      mcNumber: 'MC-123',
      companyName: 'SafetyHub Test Carrier',
    });
    expect(eq).toHaveBeenCalledWith('id', 'org-123');
    expect(eq).toHaveBeenCalledWith('organization_id', 'org-123');
  });

  it('scopes carrier health cache writes and reads by organization', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValueOnce({ upsert });

    await carrierService.cacheCarrierHealth(sampleHealth);

    expect(upsert).toHaveBeenCalledWith([expect.objectContaining({
      organization_id: 'org-123',
      dot_number: 'org-123:3114665',
      data: sampleHealth,
    })], { onConflict: 'dot_number' });

    const single = vi.fn().mockResolvedValue({ data: { data: sampleHealth }, error: null });
    const eq = vi.fn(function eq() {
      return chain;
    });
    const chain = {
      select: vi.fn(() => chain),
      eq,
      single,
    };
    fromMock.mockReturnValueOnce(chain);

    const cached = await carrierService.getCachedCarrierHealth('3114665');

    expect(cached).toEqual(sampleHealth);
    expect(eq).toHaveBeenCalledWith('dot_number', 'org-123:3114665');
    expect(eq).toHaveBeenCalledWith('organization_id', 'org-123');
  });
});
