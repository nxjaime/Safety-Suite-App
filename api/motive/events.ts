import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MOTIVE_UNSUPPORTED_RESPONSE } from './drivers';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json(MOTIVE_UNSUPPORTED_RESPONSE);
}
