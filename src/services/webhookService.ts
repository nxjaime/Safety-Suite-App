import { supabase, getCurrentOrganization } from '../lib/supabase';
import { canAccessPlatformAdmin, getRoleCapabilities, type ProfileRole } from './authorizationService';

export type WebhookEventType = 'inspection_failed' | 'work_order_closed' | 'risk_score_changed';

export interface WebhookRegistration {
  id: string;
  organizationId: string;
  endpointUrl: string;
  secret: string;
  eventTypes: WebhookEventType[];
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  organizationId: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  attemptCount: number;
  status: 'pending' | 'delivered' | 'failed';
  responseStatus: number | null;
  failureReason: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface WebhookInput {
  endpointUrl: string;
  secret: string;
  eventTypes: WebhookEventType[];
  active?: boolean;
}

export interface WebhookDeliveryResult {
  ok: boolean;
  status: number;
  attempts: number;
  failureReason: string | null;
}

const WEBHOOKS_STORAGE_KEY = 'safety-suite.webhooks';
const DELIVERY_STORAGE_KEY = 'safety-suite.webhook-deliveries';

const getStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);
const readJson = <T>(key: string, fallback: T): T => {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = <T>(key: string, value: T) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
};
const resolveOrganizationId = async () => (await getCurrentOrganization()) || 'global';
const sortByUpdatedAt = (items: WebhookRegistration[]) => [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

async function signPayload(secret: string, payload: string) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return btoa(`${secret}:${payload}`);
  const key = await subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export const webhookService = {
  async listWebhooks(): Promise<WebhookRegistration[]> {
    const orgId = await resolveOrganizationId();
    const { data, error } = await supabase.from('webhooks').select('*').eq('organization_id', orgId).order('updated_at', { ascending: false });
    if (!error && data) {
      return sortByUpdatedAt(data.map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
        endpointUrl: row.endpoint_url,
        secret: row.secret,
        eventTypes: row.event_types ?? [],
        active: row.active ?? true,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })));
    }
    return sortByUpdatedAt(readJson<Record<string, WebhookRegistration[]>>(WEBHOOKS_STORAGE_KEY, {})[orgId] || []);
  },
  async createWebhook(role: ProfileRole, input: WebhookInput): Promise<WebhookRegistration> {
    if (!canAccessPlatformAdmin(role) && !getRoleCapabilities(role).canManageOrgSettings) throw new Error('Insufficient permissions');
    const orgId = await resolveOrganizationId();
    const now = new Date().toISOString();
    const webhook: WebhookRegistration = { id: crypto.randomUUID(), organizationId: orgId, endpointUrl: input.endpointUrl, secret: input.secret, eventTypes: input.eventTypes, active: input.active ?? true, createdBy: role, createdAt: now, updatedAt: now };
    const all = readJson<Record<string, WebhookRegistration[]>>(WEBHOOKS_STORAGE_KEY, {});
    all[orgId] = sortByUpdatedAt([...(all[orgId] || []), webhook]);
    writeJson(WEBHOOKS_STORAGE_KEY, all);
    return webhook;
  },
  async deleteWebhook(webhookId: string) {
    const orgId = await resolveOrganizationId();
    const all = readJson<Record<string, WebhookRegistration[]>>(WEBHOOKS_STORAGE_KEY, {});
    all[orgId] = (all[orgId] || []).filter((webhook) => webhook.id !== webhookId);
    writeJson(WEBHOOKS_STORAGE_KEY, all);
  },
  async listDeliveryLog(webhookId?: string): Promise<WebhookDeliveryLog[]> {
    const orgId = await resolveOrganizationId();
    const all = readJson<Record<string, WebhookDeliveryLog[]>>(DELIVERY_STORAGE_KEY, {});
    const rows = all[orgId] || [];
    return webhookId ? rows.filter((row) => row.webhookId === webhookId) : rows;
  },
  async deliverWebhook(webhook: WebhookRegistration, eventType: WebhookEventType, payload: Record<string, unknown>): Promise<WebhookDeliveryResult> {
    const body = JSON.stringify(payload);
    const signature = await signPayload(webhook.secret, body);
    let attempts = 0;
    let lastStatus = 0;
    let failureReason: string | null = null;

    while (attempts < 3) {
      attempts += 1;
      try {
        const response = await fetch(webhook.endpointUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-webhook-signature': signature, 'x-webhook-event': eventType },
          body,
        });
        lastStatus = response.status;
        if (response.ok) {
          await this.recordDelivery(webhook, eventType, payload, attempts, 'delivered', response.status, null);
          return { ok: true, status: response.status, attempts, failureReason: null };
        }
        failureReason = `HTTP ${response.status}`;
      } catch (error) {
        failureReason = error instanceof Error ? error.message : 'Unknown delivery failure';
      }
    }

    await this.recordDelivery(webhook, eventType, payload, attempts, 'failed', lastStatus || null, failureReason);
    return { ok: false, status: lastStatus || 0, attempts, failureReason };
  },
  async recordDelivery(webhook: WebhookRegistration, eventType: WebhookEventType, payload: Record<string, unknown>, attemptCount: number, status: WebhookDeliveryLog['status'], responseStatus: number | null, failureReason: string | null) {
    const orgId = await resolveOrganizationId();
    const all = readJson<Record<string, WebhookDeliveryLog[]>>(DELIVERY_STORAGE_KEY, {});
    const entry: WebhookDeliveryLog = {
      id: crypto.randomUUID(),
      webhookId: webhook.id,
      organizationId: orgId,
      eventType,
      payload,
      attemptCount,
      status,
      responseStatus,
      failureReason,
      deliveredAt: status === 'delivered' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    all[orgId] = [entry, ...(all[orgId] || [])];
    writeJson(DELIVERY_STORAGE_KEY, all);
    return entry;
  },
  async signPayload(secret: string, payload: string) {
    return signPayload(secret, payload);
  },
};
