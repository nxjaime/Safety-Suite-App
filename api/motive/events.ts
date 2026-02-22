import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { applyCors, fetchWithRetry, normalizeIntegrationError, sendNormalizedError } from '../lib/http';
import { enforceRateLimit } from '../lib/rateLimit';

export const querySchema = z.object({
  start_time: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  end_time: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  page: z.string().optional().default('1').transform((val) => parseInt(val, 10)).refine((val) => !Number.isNaN(val) && val > 0, 'Page must be a positive number'),
  per_page: z.string().optional().default('100').transform((val) => parseInt(val, 10)).refine((val) => !Number.isNaN(val) && val > 0 && val <= 100, 'Per page must be between 1 and 100')
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res, ['GET', 'OPTIONS']);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!enforceRateLimit(req, res, { windowMs: 60_000, maxRequests: 60, keyPrefix: 'motive-events' })) {
    return;
  }

  const apiKey = process.env.MOTIVE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Motive API key not configured',
      code: 'MOTIVE_NOT_CONFIGURED',
      retryable: false
    });
  }

  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: result.error.format(),
      code: 'VALIDATION_ERROR'
    });
  }

  const { start_time, end_time, page, per_page } = result.data;

  try {
    const response = await fetchWithRetry(
      `https://api.gomotive.com/v2/driver_performance_events?start_time=${start_time}&end_time=${end_time}&page_no=${page}&per_page=${per_page}`,
      {
        headers: { 'X-Api-Key': apiKey }
      },
      {
        retries: 2,
        timeoutMs: 10_000
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Failed to fetch events from Motive',
        code: 'MOTIVE_UPSTREAM_ERROR',
        retryable: response.status >= 500 || response.status === 429,
        details: errorText.slice(0, 300)
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    const normalized = normalizeIntegrationError(error, 'Failed to fetch events from Motive');
    return sendNormalizedError(res, normalized);
  }
}
