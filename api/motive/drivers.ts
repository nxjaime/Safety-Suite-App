import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

export const querySchema = z.object({
    page: z.string().optional().default('1').transform(val => parseInt(val)).refine(val => !isNaN(val) && val > 0, "Page must be a positive number"),
    per_page: z.string().optional().default('100').transform(val => parseInt(val)).refine(val => !isNaN(val) && val > 0 && val <= 100, "Per page must be between 1 and 100")
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

    const { page, per_page } = result.data;

    try {
        const response = await fetch(`https://api.gomotive.com/v1/drivers?page_no=${page}&per_page=${per_page}`, {
            headers: {
                'X-Api-Key': apiKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Motive API Error:', response.status, errorText);
            return res.status(response.status).json({ error: 'Failed to fetch drivers from Motive' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Motive Proxy Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
