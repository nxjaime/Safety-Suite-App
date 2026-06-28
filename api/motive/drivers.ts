import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMotiveUnsupported } from './placeholder.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return sendMotiveUnsupported(res);
}
