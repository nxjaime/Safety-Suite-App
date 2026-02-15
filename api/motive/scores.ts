import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

export const querySchema = z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD")
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

    const { start_date, end_date } = result.data;

    try {
        const url = `https://api.gomotive.com/v1/scorecard_summary?start_date=${start_date}&end_date=${end_date}`;
        const response = await fetch(url, {
            headers: { 'X-Api-Key': apiKey }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch scores' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Motive Scores Proxy Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
