import type { VercelRequest, VercelResponse } from '@vercel/node';

export const MOTIVE_UNSUPPORTED_RESPONSE = {
  error: 'Motive integration is not enabled for this product.',
  code: 'MOTIVE_INTEGRATION_DISABLED',
  retryable: false
};

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json(MOTIVE_UNSUPPORTED_RESPONSE);
}
