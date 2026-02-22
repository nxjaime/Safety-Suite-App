import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { applyCors, fetchWithRetry, normalizeIntegrationError, sendNormalizedError } from '../lib/http';
import { enforceRateLimit } from '../lib/rateLimit';

export const querySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD')
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res, ['GET', 'OPTIONS']);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!enforceRateLimit(req, res, { windowMs: 60_000, maxRequests: 60, keyPrefix: 'motive-scores' })) {
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

  const { start_date, end_date } = result.data;

  try {
    const response = await fetchWithRetry(
      `https://api.gomotive.com/v1/scorecard_summary?start_date=${start_date}&end_date=${end_date}`,
      {
        headers: { 'X-Api-Key': apiKey }
      },
      {
        retries: 2,
        timeoutMs: 8_000
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Failed to fetch scores from Motive',
        code: 'MOTIVE_UPSTREAM_ERROR',
        retryable: response.status >= 500 || response.status === 429,
        details: errorText.slice(0, 300)
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    const normalized = normalizeIntegrationError(error, 'Failed to fetch scores from Motive');
    return sendNormalizedError(res, normalized);
  }
}
