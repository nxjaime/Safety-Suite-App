import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateStore = new Map<string, RateEntry>();

const getClientIp = (req: VercelRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) {
    return forwarded[0] ?? 'unknown';
  }
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.socket.remoteAddress || 'unknown';
};

export const enforceRateLimit = (
  req: VercelRequest,
  res: VercelResponse,
  config: RateLimitConfig
): boolean => {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${config.keyPrefix}:${ip}`;

  const entry = rateStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rateStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    });

    res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(config.maxRequests - 1));
    return true;
  }

  if (entry.count >= config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));
    res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryable: true
    });
    return false;
  }

  entry.count += 1;
  rateStore.set(key, entry);

  res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(config.maxRequests - entry.count, 0)));
  return true;
};
