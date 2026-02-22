import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, fetchWithRetry } from '../lib/http';
import { enforceRateLimit } from '../lib/rateLimit';

type HealthStatus = 'healthy' | 'degraded' | 'down';

interface IntegrationHealth {
  name: string;
  status: HealthStatus;
  message: string;
  checkedAt: string;
}

const probeMotive = async (): Promise<IntegrationHealth> => {
  const apiKey = process.env.MOTIVE_API_KEY;
  const checkedAt = new Date().toISOString();

  if (!apiKey) {
    return {
      name: 'motive',
      status: 'down',
      message: 'MOTIVE_API_KEY is missing',
      checkedAt
    };
  }

  try {
    const response = await fetchWithRetry('https://api.gomotive.com/v1/drivers?page_no=1&per_page=1', {
      headers: { 'X-Api-Key': apiKey }
    }, {
      retries: 1,
      timeoutMs: 5_000
    });

    if (!response.ok) {
      return {
        name: 'motive',
        status: 'degraded',
        message: `Motive responded with status ${response.status}`,
        checkedAt
      };
    }

    return {
      name: 'motive',
      status: 'healthy',
      message: 'Motive API reachable',
      checkedAt
    };
  } catch {
    return {
      name: 'motive',
      status: 'degraded',
      message: 'Motive probe timed out or failed',
      checkedAt
    };
  }
};

const probeResend = async (): Promise<IntegrationHealth> => {
  const apiKey = process.env.RESEND_API_KEY;
  const checkedAt = new Date().toISOString();

  if (!apiKey) {
    return {
      name: 'resend',
      status: 'down',
      message: 'RESEND_API_KEY is missing',
      checkedAt
    };
  }

  return {
    name: 'resend',
    status: 'healthy',
    message: 'Resend key configured',
    checkedAt
  };
};

const probeFmcsa = async (): Promise<IntegrationHealth> => {
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetchWithRetry('https://ai.fmcsa.dot.gov/SMS/', {
      method: 'GET',
      headers: {
        'User-Agent': 'SafetyHub-HealthCheck/1.0'
      }
    }, {
      retries: 1,
      timeoutMs: 5_000
    });

    if (!response.ok) {
      return {
        name: 'fmcsa',
        status: 'degraded',
        message: `FMCSA responded with status ${response.status}`,
        checkedAt
      };
    }

    return {
      name: 'fmcsa',
      status: 'healthy',
      message: 'FMCSA endpoint reachable',
      checkedAt
    };
  } catch {
    return {
      name: 'fmcsa',
      status: 'degraded',
      message: 'FMCSA probe timed out or failed',
      checkedAt
    };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res, ['GET', 'OPTIONS']);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!enforceRateLimit(req, res, { windowMs: 60_000, maxRequests: 20, keyPrefix: 'integrations-health' })) {
    return;
  }

  const checks = await Promise.all([
    probeMotive(),
    probeResend(),
    probeFmcsa()
  ]);

  const overallStatus: HealthStatus = checks.some((check) => check.status === 'down')
    ? 'down'
    : checks.some((check) => check.status === 'degraded')
      ? 'degraded'
      : 'healthy';

  return res.status(200).json({
    status: overallStatus,
    checkedAt: new Date().toISOString(),
    integrations: checks
  });
}
