// Vercel Serverless Function for sending emails via Resend
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        return res.status(500).json({ error: 'Resend API key not configured' });
    }

    const { to, subject, html, from } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: from || 'SafetyHub Connect <onboarding@resend.dev>',
                to: [to],
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Resend API error:', errorData);
            return res.status(response.status).json({ error: 'Failed to send email', details: errorData });
        }

        const data = await response.json();
        return res.status(200).json({ success: true, id: data.id });
    } catch (error) {
        console.error('Email send error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
