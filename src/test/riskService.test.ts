import { describe, expect, it } from 'vitest';
import { createRiskService, getRiskBand } from '../services/riskService';

const buildSupabaseMock = (events: Array<any>, motiveId: string | null = 'motive-1') => {
  const inserts: Array<any> = [];
  const updates: Array<any> = [];

  const makeSingle = (data: any) => ({
    single: async () => ({ data, error: null })
  });

  const makeMaybeSingle = (data: any) => ({
    maybeSingle: async () => ({ data, error: null })
  });

  const driversSelect = {
    eq: (_field: string, _value: string) => makeMaybeSingle({ motive_id: motiveId })
  };

  const driversUpdate = {
    eq: async (_field: string, _value: string) => ({ data: null, error: null })
  };

  const historySelect = {
    eq: (_field: string, _value: string) => ({
      order: (_orderField: string, _opts: any) => ({
        limit: async (_limit: number) => ({ data: [], error: null })
      })
    })
  };

  const riskEventsSelect = {
    eq: (_field: string, _value: string) => ({
      gte: async (_gteField: string, _cutoff: string) => ({ data: events, error: null })
    })
  };

  return {
    inserts,
    updates,
    from: (table: string) => {
      if (table === 'drivers') {
        return {
          select: () => driversSelect,
          update: (payload: any) => {
            updates.push(payload);
            return driversUpdate;
          }
        };
      }

      if (table === 'risk_events') {
        return {
          select: () => riskEventsSelect,
          insert: (payload: any) => {
            inserts.push({ table, payload });
            return makeSingle(payload[0]);
          }
        };
      }

      if (table === 'driver_risk_scores') {
        return {
          insert: (payload: any) => {
            inserts.push({ table, payload });
            return makeSingle(payload[0]);
          },
          select: () => historySelect
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }
  } as any;
};

describe('riskService', () => {
  it('blends motive and local events with 0.6/0.4 weighting', async () => {
    const supabase = buildSupabaseMock([{ event_type: 'Speeding', severity: 4 }]);

    const service = createRiskService({
      supabase,
      getCurrentOrganization: async () => 'org-1',
      getMotiveScores: async () => ({
        users: [{ driver: { id: 'motive-1' }, safety_score: 80 }]
      }),
      now: () => new Date('2026-02-22T00:00:00Z')
    });

    const result = await service.calculateScore('driver-1');

    expect(result.score).toBe(69);
    expect(result.parts.motive).toBe(80);
    expect(result.parts.local).toBe(52);

    const historyInsert = supabase.inserts.find((insert: any) => insert.table === 'driver_risk_scores');
    expect(historyInsert).toBeTruthy();
    expect(historyInsert.payload[0].score).toBe(69);
  });

  it('uses motive fallback of 60 when motive score is missing', async () => {
    const supabase = buildSupabaseMock([{ event_type: 'Speeding', severity: 2 }], null);

    const service = createRiskService({
      supabase,
      getCurrentOrganization: async () => 'org-1',
      getMotiveScores: async () => ({ users: [] }),
      now: () => new Date('2026-02-22T00:00:00Z')
    });

    const result = await service.calculateScore('driver-1');

    expect(result.parts.motive).toBe(60);
    expect(result.score).toBe(50);
  });

  it('maps score bands correctly', () => {
    expect(getRiskBand(49)).toBe('green');
    expect(getRiskBand(50)).toBe('yellow');
    expect(getRiskBand(79)).toBe('yellow');
    expect(getRiskBand(80)).toBe('red');
  });

  it('updates drivers.risk_score and persists history when score is calculated', async () => {
    const supabase = buildSupabaseMock([{ event_type: 'Citation', severity: 1 }]);

    const service = createRiskService({
      supabase,
      getCurrentOrganization: async () => 'org-1',
      getMotiveScores: async () => ({
        users: [{ driver: { id: 'motive-1' }, safety_score: 70 }]
      }),
      now: () => new Date('2026-02-22T00:00:00Z')
    });

    await service.calculateScore('driver-1', '90d');

    expect(supabase.updates).toHaveLength(1);
    expect(supabase.updates[0]).toEqual({ risk_score: 52 });

    const historyInsert = supabase.inserts.find((insert: any) => insert.table === 'driver_risk_scores');
    expect(historyInsert.payload[0].source_window).toBe('90d');
    expect(historyInsert.payload[0].organization_id).toBe('org-1');
    expect(historyInsert.payload[0].driver_id).toBe('driver-1');
  });
});
