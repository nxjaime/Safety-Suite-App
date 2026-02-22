import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { applyCors, fetchWithRetry, normalizeIntegrationError, sendNormalizedError } from './lib/http';
import { enforceRateLimit } from './lib/rateLimit';

export const bodySchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  html: z.string().min(1, 'HTML content is required').max(200_000, 'HTML content is too large'),
  from: z.string().email('Invalid sender email').optional()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res, ['POST', 'OPTIONS']);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceRateLimit(req, res, { windowMs: 60_000, maxRequests: 20, keyPrefix: 'send-email' })) {
    return;
  }

  const authHeader = req.headers.authorization;
  const apiSecret = process.env.API_SECRET_KEY;

  if (!apiSecret || authHeader !== `Bearer ${apiSecret}`) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
      retryable: false
    });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({
      error: 'Resend API key not configured',
      code: 'RESEND_NOT_CONFIGURED',
      retryable: false
    });
  }

  const parsedBody = bodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: parsedBody.error.format(),
      code: 'VALIDATION_ERROR'
    });
  }

  const { to, subject, html } = parsedBody.data;
  const from = parsedBody.data.from || 'SafetyHub Connect <onboarding@resend.dev>';

  try {
    const response = await fetchWithRetry(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html
        })
      },
      {
        retries: 2,
        timeoutMs: 10_000
      }
    );

    if (!response.ok) {
      const errorPayload = await response.text();
      return res.status(response.status).json({
        error: 'Failed to send email',
        code: 'RESEND_UPSTREAM_ERROR',
        retryable: response.status >= 500 || response.status === 429,
        details: errorPayload.slice(0, 500)
      });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    const normalized = normalizeIntegrationError(error, 'Failed to send email');
    return sendNormalizedError(res, normalized);
  }
}
