import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface IntegrationError {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
  details?: string;
}

interface FetchWithRetryOptions {
  retries?: number;
  timeoutMs?: number;
  backoffMs?: number;
  retryOnStatuses?: number[];
}

export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.VITE_APP_URL || ''
].filter(Boolean);

export const applyCors = (
  req: VercelRequest,
  res: VercelResponse,
  methods: string[] = ['GET', 'OPTIONS']
) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const normalizeIntegrationError = (error: unknown, fallbackMessage: string): IntegrationError => {
  if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
    return {
      code: 'UPSTREAM_TIMEOUT',
      message: `${fallbackMessage} timed out`,
      status: 504,
      retryable: true
    };
  }

  if (error instanceof Error) {
    return {
      code: 'INTEGRATION_ERROR',
      message: fallbackMessage,
      status: 502,
      retryable: true,
      details: error.message
    };
  }

  return {
    code: 'INTEGRATION_ERROR',
    message: fallbackMessage,
    status: 502,
    retryable: true
  };
};

export const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> => {
  const retries = options.retries ?? 2;
  const timeoutMs = options.timeoutMs ?? 8_000;
  const backoffMs = options.backoffMs ?? 300;
  const retryOnStatuses = options.retryOnStatuses ?? [408, 429, 500, 502, 503, 504];

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (response.ok) {
        return response;
      }

      if (!retryOnStatuses.includes(response.status) || attempt === retries) {
        return response;
      }

      await sleep(backoffMs * (attempt + 1));
    } catch (error) {
      clearTimeout(timer);
      lastError = error;

      if (attempt === retries) {
        break;
      }

      await sleep(backoffMs * (attempt + 1));
    }
  }

  throw lastError ?? new Error('Fetch failed after retries');
};

export const sendNormalizedError = (
  res: VercelResponse,
  error: IntegrationError,
  context?: Record<string, unknown>
) => {
  return res.status(error.status).json({
    error: error.message,
    code: error.code,
    retryable: error.retryable,
    ...(error.details ? { details: error.details } : {}),
    ...(context ? { context } : {})
  });
};
