import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: null, error: { message: 'offline' } }),
        }),
      }),
    }),
    auth: {
      getSession: vi.fn(),
    },
  },
  getCurrentOrganization: async () => 'org-1',
}));

import { webhookService } from '../services/webhookService';

describe('webhookService', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('creates and lists webhooks from fallback storage', async () => {
    const webhook = await webhookService.createWebhook('platform_admin', {
      endpointUrl: 'https://example.com/hooks',
      secret: 'secret',
      eventTypes: ['inspection_failed'],
    });

    const list = await webhookService.listWebhooks();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: webhook.id, endpointUrl: 'https://example.com/hooks', eventTypes: ['inspection_failed'] });
  });

  it('signs payloads and records failed deliveries after retries', async () => {
    const webhook = await webhookService.createWebhook('platform_admin', {
      endpointUrl: 'https://example.com/hooks',
      secret: 'secret',
      eventTypes: ['work_order_closed'],
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const result = await webhookService.deliverWebhook(webhook, 'work_order_closed', { id: 'wo-1' });
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(3);

    const logs = await webhookService.listDeliveryLog(webhook.id);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ webhookId: webhook.id, eventType: 'work_order_closed', attemptCount: 3, status: 'failed' });
  });
});
