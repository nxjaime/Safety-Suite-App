import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

export const querySchema = z.object({
    start_time: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // Allow ISO or Date (Motive might support both, but usually ISO for v2)
    end_time: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    page: z.string().optional().default('1').transform(val => parseInt(val)),
    per_page: z.string().optional().default('100').transform(val => parseInt(val))
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const apiKey = process.env.MOTIVE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Motive API Key not configured' });
    }

    // CORS
    const ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.VITE_APP_URL || ''
    ].filter(Boolean);

    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Validate Input with Zod
    const result = querySchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid input',
            details: result.error.format()
        });
    }

    const { start_time, end_time, page, per_page } = result.data;

    try {
        const url = `https://api.gomotive.com/v2/driver_performance_events?start_time=${start_time}&end_time=${end_time}&page_no=${page}&per_page=${per_page}`;
        const response = await fetch(url, {
            headers: { 'X-Api-Key': apiKey }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch events' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Motive Events Proxy Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
