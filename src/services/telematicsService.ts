import { getCurrentOrganization, supabase } from '../lib/supabase';
import { riskService } from './riskService';
import { withRetry } from './retry';

const EVENT_BUFFER_TABLE = 'telematics_event_buffer';

export type TelematicsBufferStatus = 'buffered' | 'processed' | 'retry' | 'dropped';

export interface TelematicsEventInput {
  provider: string;
  driverId: string;
  eventType: string;
  eventTimestamp: string;
  severity?: number;
  scoreDelta?: number;
  payload?: Record<string, unknown>;
}

export interface TelematicsHealthSummary {
  provider: string;
  lastReceivedAt: string | null;
  lastProcessedAt: string | null;
  bufferedCount: number;
  processedCount: number;
  retryCount: number;
  droppedCount: number;
  dedupCount: number;
  outOfOrderCount: number;
  lastEventKey: string | null;
  lastError: string | null;
}

export interface TelematicsIngestionResult {
  id: string;
  provider: string;
  driverId: string;
  eventType: string;
  eventTimestamp: string;
  eventKey: string;
  status: TelematicsBufferStatus;
  dedupCount: number;
  retryCount: number;
  isOutOfOrder: boolean;
}

type TelematicsServiceDeps = {
  supabase: typeof supabase;
  getCurrentOrganization: () => Promise<string | null>;
  calculateRiskScore: (driverId: string) => Promise<unknown>;
  now: () => Date;
};

const normalizeProvider = (provider: string) => provider.trim().toLowerCase().replace(/\s+/g, '_');

const normalizeEventType = (eventType: string) => eventType.trim();

const toIso = (input: string) => {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Telematics event timestamp must be a valid ISO date');
  }
  return parsed.toISOString();
};

const buildEventKey = (driverId: string, eventType: string, eventTimestamp: string) => {
  return [driverId.trim(), normalizeEventType(eventType).toLowerCase(), toIso(eventTimestamp)].join('::');
};

const getNowIso = (now: () => Date) => now().toISOString();

const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const aggregateHealth = (rows: Array<Record<string, unknown>>): TelematicsHealthSummary[] => {
  const summaries = new Map<string, TelematicsHealthSummary>();

  for (const row of rows) {
    const provider = String(row.provider || 'unknown');
    if (!summaries.has(provider)) {
      summaries.set(provider, {
        provider,
        lastReceivedAt: null,
        lastProcessedAt: null,
        bufferedCount: 0,
        processedCount: 0,
        retryCount: 0,
        droppedCount: 0,
        dedupCount: 0,
        outOfOrderCount: 0,
        lastEventKey: null,
        lastError: null,
      });
    }

    const summary = summaries.get(provider)!;
    const receivedAt = typeof row.received_at === 'string' ? row.received_at : null;
    const processedAt = typeof row.processed_at === 'string' ? row.processed_at : null;
    const eventTimestamp = typeof row.event_timestamp === 'string' ? row.event_timestamp : null;
    const status = String(row.status || 'buffered') as TelematicsBufferStatus;

    if (receivedAt && (!summary.lastReceivedAt || receivedAt > summary.lastReceivedAt)) {
      summary.lastReceivedAt = receivedAt;
      summary.lastEventKey = typeof row.event_key === 'string' ? row.event_key : summary.lastEventKey;
    }

    if (processedAt && (!summary.lastProcessedAt || processedAt > summary.lastProcessedAt)) {
      summary.lastProcessedAt = processedAt;
    }

    summary.bufferedCount += status === 'buffered' ? 1 : 0;
    summary.processedCount += status === 'processed' ? 1 : 0;
    summary.retryCount += status === 'retry' ? 1 : 0;
    summary.droppedCount += status === 'dropped' ? 1 : 0;
    summary.dedupCount += asNumber(row.dedup_count);
    summary.outOfOrderCount += row.is_out_of_order ? 1 : 0;

    const lastError = typeof row.last_error === 'string' ? row.last_error : null;
    if (lastError && (!summary.lastError || (receivedAt && summary.lastReceivedAt === receivedAt))) {
      summary.lastError = lastError;
    }

    if (eventTimestamp && !summary.lastReceivedAt) {
      summary.lastReceivedAt = eventTimestamp;
    }
  }

  return Array.from(summaries.values()).sort((a, b) => (b.lastReceivedAt || '').localeCompare(a.lastReceivedAt || ''));
};

const validateEvent = (input: TelematicsEventInput) => {
  if (!input.provider?.trim()) throw new Error('Provider is required');
  if (!input.driverId?.trim()) throw new Error('Driver ID is required');
  if (!input.eventType?.trim()) throw new Error('Event type is required');
  if (!input.eventTimestamp?.trim()) throw new Error('Event timestamp is required');
  return {
    provider: normalizeProvider(input.provider),
    driverId: input.driverId.trim(),
    eventType: normalizeEventType(input.eventType),
    eventTimestamp: toIso(input.eventTimestamp),
  };
};

const createRetryStatus = (retryCount: number) => (retryCount >= 3 ? 'dropped' : 'retry');

export const createTelematicsService = (deps: TelematicsServiceDeps) => {
  return {
    async getIngestionHealthSummaries(): Promise<TelematicsHealthSummary[]> {
      const organizationId = await deps.getCurrentOrganization();
      if (!organizationId) return [];

      const { data, error } = await withRetry(async () => {
        return deps.supabase
          .from(EVENT_BUFFER_TABLE)
          .select('*')
          .eq('organization_id', organizationId);
      });

      if (error) throw error;
      return aggregateHealth((data || []) as Array<Record<string, unknown>>);
    },

    async ingestEvent(input: TelematicsEventInput): Promise<TelematicsIngestionResult> {
      const organizationId = await deps.getCurrentOrganization();
      if (!organizationId) throw new Error('No organization context available');

      const normalized = validateEvent(input);
      const nowIso = getNowIso(deps.now);
      const eventKey = buildEventKey(normalized.driverId, normalized.eventType, normalized.eventTimestamp);

      const { data: existing, error: lookupError } = await withRetry(async () => {
        return deps.supabase
          .from(EVENT_BUFFER_TABLE)
          .select('id, provider, driver_id, event_type, event_timestamp, event_key, status, dedup_count, retry_count, is_out_of_order')
          .eq('organization_id', organizationId)
          .eq('provider', normalized.provider)
          .eq('event_key', eventKey)
          .maybeSingle();
      });
      if (lookupError) throw lookupError;

      if (existing) {
        const dedupCount = asNumber(existing.dedup_count) + 1;
        const { error: dedupError } = await withRetry(async () => {
          return deps.supabase
            .from(EVENT_BUFFER_TABLE)
            .update({
              dedup_count: dedupCount,
              last_attempt_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', existing.id);
        });
        if (dedupError) throw dedupError;

        return {
          id: String(existing.id),
          provider: String(existing.provider),
          driverId: String(existing.driver_id),
          eventType: String(existing.event_type),
          eventTimestamp: String(existing.event_timestamp),
          eventKey: String(existing.event_key),
          status: String(existing.status || 'buffered') as TelematicsBufferStatus,
          dedupCount,
          retryCount: asNumber(existing.retry_count),
          isOutOfOrder: Boolean(existing.is_out_of_order),
        };
      }

      const { data: latestProcessed } = await withRetry(async () => {
        return deps.supabase
          .from(EVENT_BUFFER_TABLE)
          .select('event_timestamp')
          .eq('organization_id', organizationId)
          .eq('provider', normalized.provider)
          .eq('driver_id', normalized.driverId)
          .eq('status', 'processed')
          .order('event_timestamp', { ascending: false })
          .limit(1);
      });

      const latestProcessedTimestamp = Array.isArray(latestProcessed) && latestProcessed.length > 0
        ? String(latestProcessed[0].event_timestamp || '')
        : null;
      const isOutOfOrder = Boolean(latestProcessedTimestamp && normalized.eventTimestamp < latestProcessedTimestamp);

      const payload = {
        organization_id: organizationId,
        provider: normalized.provider,
        driver_id: normalized.driverId,
        event_type: normalized.eventType,
        event_timestamp: normalized.eventTimestamp,
        event_key: eventKey,
        payload: input.payload ?? {},
        status: 'buffered' as TelematicsBufferStatus,
        retry_count: 0,
        dedup_count: 0,
        is_out_of_order: isOutOfOrder,
        received_at: nowIso,
        updated_at: nowIso,
        last_attempt_at: null,
        processed_at: null,
        last_error: null,
        dropped_reason: null,
      };

      const { data, error } = await withRetry(async () => {
        return deps.supabase
          .from(EVENT_BUFFER_TABLE)
          .insert([payload])
          .select()
          .single();
      });
      if (error) throw error;

      return {
        id: String(data.id),
        provider: String(data.provider),
        driverId: String(data.driver_id),
        eventType: String(data.event_type),
        eventTimestamp: String(data.event_timestamp),
        eventKey: String(data.event_key),
        status: String(data.status || 'buffered') as TelematicsBufferStatus,
        dedupCount: asNumber(data.dedup_count),
        retryCount: asNumber(data.retry_count),
        isOutOfOrder: Boolean(data.is_out_of_order),
      };
    },

    async flushProviderBuffer(provider: string, driverId?: string) {
      const organizationId = await deps.getCurrentOrganization();
      if (!organizationId) throw new Error('No organization context available');

      const normalizedProvider = normalizeProvider(provider);
      const { data: rows, error } = await withRetry(async () => {
        return deps.supabase
          .from(EVENT_BUFFER_TABLE)
          .select('*')
          .eq('organization_id', organizationId)
          .eq('provider', normalizedProvider);
      });
      if (error) throw error;

      const bufferedRows = ((rows || []) as Array<Record<string, unknown>>)
        .filter((row) => ['buffered', 'retry'].includes(String(row.status || 'buffered')))
        .filter((row) => (driverId ? String(row.driver_id) === driverId : true))
        .sort((a, b) => {
          const aTime = String(a.event_timestamp || a.received_at || '');
          const bTime = String(b.event_timestamp || b.received_at || '');
          return aTime.localeCompare(bTime) || String(a.received_at || '').localeCompare(String(b.received_at || ''));
        });

      const processedEventKeys = new Set<string>();
      const results: Array<{ id: string; status: TelematicsBufferStatus; error?: string }> = [];

      for (const row of bufferedRows) {
        const eventKey = String(row.event_key || '');
        if (!eventKey || processedEventKeys.has(eventKey)) continue;
        processedEventKeys.add(eventKey);

        const retryCount = asNumber(row.retry_count);
        const nextAttempt = retryCount + 1;
        const nowIso = getNowIso(deps.now);

        try {
          await deps.calculateRiskScore(String(row.driver_id));

          const { error: processedError } = await withRetry(async () => {
            return deps.supabase
              .from(EVENT_BUFFER_TABLE)
              .update({
                status: 'processed',
                processed_at: nowIso,
                last_attempt_at: nowIso,
                retry_count: retryCount,
                updated_at: nowIso,
                last_error: null,
                dropped_reason: null,
              })
              .eq('id', row.id);
          });
          if (processedError) throw processedError;

          results.push({ id: String(row.id), status: 'processed' });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Telematics ingestion failed';
          const status = createRetryStatus(nextAttempt);
          const { error: retryError } = await withRetry(async () => {
            return deps.supabase
              .from(EVENT_BUFFER_TABLE)
              .update({
                status,
                retry_count: nextAttempt,
                last_attempt_at: nowIso,
                updated_at: nowIso,
                last_error: message,
                dropped_reason: status === 'dropped' ? message : null,
              })
              .eq('id', row.id);
          });
          if (retryError) throw retryError;

          results.push({ id: String(row.id), status, error: message });
        }
      }

      return results;
    },
  };
};

export const telematicsService = createTelematicsService({
  supabase,
  getCurrentOrganization,
  calculateRiskScore: (driverId: string) => riskService.calculateScore(driverId),
  now: () => new Date(),
});
