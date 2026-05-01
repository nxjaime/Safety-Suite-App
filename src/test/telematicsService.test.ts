import { describe, expect, it, vi } from 'vitest';
import { createTelematicsService } from '../services/telematicsService';

const buildSupabaseMock = (rows: Array<any> = []) => {
  const data = rows;

  const filterRows = (filters: Record<string, unknown>) => {
    return data.filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value));
  };

  const makeQuery = (filters: Record<string, unknown> = {}, selected = '*') => {
    const resolve = () => {
      const results = filterRows(filters);
      return selected === '*' ? results : results.map((row) => row);
    };

    const chain: any = {
      eq(field: string, value: unknown) {
        return makeQuery({ ...filters, [field]: value }, selected);
      },
      order(field: string, opts: { ascending?: boolean } = {}) {
        return {
          limit: async (limit: number) => {
            const results = [...filterRows(filters)].sort((a, b) => {
              const aValue = String(a[field] || '');
              const bValue = String(b[field] || '');
              return opts.ascending === false ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
            }).slice(0, limit);
            return { data: results, error: null };
          },
        };
      },
      async maybeSingle() {
        const results = filterRows(filters);
        return { data: results[0] ?? null, error: null };
      },
      async single() {
        const results = filterRows(filters);
        return { data: results[0] ?? null, error: null };
      },
      then(resolveFn: (value: any) => unknown, rejectFn: (reason?: unknown) => unknown) {
        return Promise.resolve({ data: resolve(), error: null }).then(resolveFn, rejectFn);
      },
    };

    if (selected === '*') {
      chain.limit = async (limit: number) => ({ data: filterRows(filters).slice(0, limit), error: null });
    }

    return chain;
  };

  return {
    rows,
    from: (table: string) => {
      if (table !== 'telematics_event_buffer') throw new Error(`Unexpected table ${table}`);
      return {
        select: (selected = '*') => makeQuery({}, selected),
        insert: (payload: Array<any>) => ({
          select: () => ({
            single: async () => {
              data.push(...payload);
              return { data: payload[0], error: null };
            },
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: async (field: string, value: unknown) => {
            const row = data.find((entry) => entry[field] === value);
            if (row) Object.assign(row, payload);
            return { data: row ?? null, error: null };
          },
        }),
      };
    },
  } as any;
};

describe('telematicsService', () => {
  it('deduplicates by driver/type/timestamp and increments the dedup counter', async () => {
    const rows: any[] = [
      {
        id: 'event-1',
        organization_id: 'org-1',
        provider: 'motive',
        driver_id: 'driver-1',
        event_type: 'Speeding',
        event_timestamp: '2026-05-01T00:00:00.000Z',
        event_key: 'driver-1::speeding::2026-05-01T00:00:00.000Z',
        status: 'buffered',
        retry_count: 0,
        dedup_count: 0,
        is_out_of_order: false,
        received_at: '2026-05-01T00:00:00.000Z',
      },
    ];

    const supabase = buildSupabaseMock(rows);
    const service = createTelematicsService({
      supabase,
      getCurrentOrganization: async () => 'org-1',
      calculateRiskScore: vi.fn(),
      now: () => new Date('2026-05-01T01:00:00.000Z'),
    });

    const result = await service.ingestEvent({
      provider: 'motive',
      driverId: 'driver-1',
      eventType: 'Speeding',
      eventTimestamp: '2026-05-01T00:00:00.000Z',
    });

    expect(result.dedupCount).toBe(1);
    expect(supabase.rows).toHaveLength(1);
    expect(supabase.rows[0].dedup_count).toBe(1);

    const health = await service.getIngestionHealthSummaries();
    expect(health[0].dedupCount).toBe(1);
  });

  it('processes buffered events in timestamp order so out-of-order arrivals do not corrupt score history', async () => {
    const rows: any[] = [
      {
        id: 'newer',
        organization_id: 'org-1',
        provider: 'motive',
        driver_id: 'driver-1',
        event_type: 'Harsh Braking',
        event_timestamp: '2026-05-01T00:10:00.000Z',
        event_key: 'driver-1::harsh braking::2026-05-01T00:10:00.000Z',
        status: 'buffered',
        retry_count: 0,
        dedup_count: 0,
        is_out_of_order: false,
        received_at: '2026-05-01T00:11:00.000Z',
      },
      {
        id: 'older',
        organization_id: 'org-1',
        provider: 'motive',
        driver_id: 'driver-1',
        event_type: 'Speeding',
        event_timestamp: '2026-05-01T00:00:00.000Z',
        event_key: 'driver-1::speeding::2026-05-01T00:00:00.000Z',
        status: 'buffered',
        retry_count: 0,
        dedup_count: 0,
        is_out_of_order: false,
        received_at: '2026-05-01T00:12:00.000Z',
      },
    ];

    const calls: string[] = [];
    const supabase = buildSupabaseMock(rows);
    const service = createTelematicsService({
      supabase,
      getCurrentOrganization: async () => 'org-1',
      calculateRiskScore: async (driverId: string) => {
        calls.push(driverId);
        return { score: 72 };
      },
      now: () => new Date('2026-05-01T01:00:00.000Z'),
    });

    const results = await service.flushProviderBuffer('motive');

    expect(calls).toEqual(['driver-1', 'driver-1']);
    expect(results.map((item) => item.status)).toEqual(['processed', 'processed']);
    expect(rows.every((row) => row.status === 'processed')).toBe(true);
    expect(rows.every((row) => row.processed_at)).toBe(true);
  });

  it('marks failed ingestion attempts for retry and then drop after repeated failures', async () => {
    const rows: any[] = [
      {
        id: 'failing',
        organization_id: 'org-1',
        provider: 'motive',
        driver_id: 'driver-1',
        event_type: 'Speeding',
        event_timestamp: '2026-05-01T00:00:00.000Z',
        event_key: 'driver-1::speeding::2026-05-01T00:00:00.000Z',
        status: 'buffered',
        retry_count: 2,
        dedup_count: 0,
        is_out_of_order: false,
        received_at: '2026-05-01T00:00:00.000Z',
      },
    ];

    const supabase = buildSupabaseMock(rows);
    const service = createTelematicsService({
      supabase,
      getCurrentOrganization: async () => 'org-1',
      calculateRiskScore: async () => {
        throw new Error('risk engine unavailable');
      },
      now: () => new Date('2026-05-01T01:00:00.000Z'),
    });

    const results = await service.flushProviderBuffer('motive');

    expect(results[0]).toMatchObject({ status: 'dropped' });
    expect(rows[0].status).toBe('dropped');
    expect(rows[0].retry_count).toBe(3);
    expect(rows[0].dropped_reason).toBe('risk engine unavailable');
  });
});
