// Email Service using Resend API
// Note: This requires a server-side implementation for production
// For Vite frontend, we'll create API endpoints or use Supabase Edge Functions
// The actual API key is stored in environment variables on the server side


interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

interface TrainingNotification {
    driverName: string;
    driverEmail: string;
    moduleName: string;
    dueDate: string;
}

interface CoachingReminder {
    driverName: string;
    driverEmail: string;
    coachingType: string;
    checkInDate: string;
    week: number;
}

const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export const emailService = {
    // For client-side, we'll use Supabase Edge Function or a simple fetch to an API route
    // In production, this would be a server-side call

    async sendEmail(options: EmailOptions): Promise<boolean> {
        // ... (keep existing sendEmail logic)
        // In development mode, simulate email sending
        if (import.meta.env.DEV) {
            console.info('📧 DEV MODE: Simulating email send');
            console.info('To:', options.to);
            console.info('Subject:', options.subject);
            console.info('✅ Email would be sent in production');
            // Return true so the UI shows success feedback
            return true;
        }

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);
            let response: Response;
            try {
                // Using Vercel serverless function endpoint
                response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_API_SECRET_KEY}`
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        ...options,
                        from: options.from || 'SafetyHub Connect <noreply@safetyhub.com>'
                    })
                });
            } finally {
                clearTimeout(timer);
            }

            // Handle non-OK responses with detailed error logging
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Email API Error:', response.status, errorText);

                // Check if API endpoint is not deployed
                if (response.status === 404) {
                    console.warn('Email API endpoint not found. Ensure the /api/send-email endpoint is deployed on Vercel.');
                    return false;
                }

                throw new Error(`Failed to send email: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Email send failed:', error);
            return false;
        }
    },

    async sendTrainingNotification(data: TrainingNotification): Promise<boolean> {
        const safeName = escapeHtml(data.driverName);
        const safeModule = escapeHtml(data.moduleName);
        const safeDate = escapeHtml(data.dueDate);

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">SafetyHub Connect</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #1f2937;">Training Assignment Notification</h2>
                    <p style="color: #4b5563;">Hello ${safeName},</p>
                    <p style="color: #4b5563;">You have been assigned a new training module:</p>
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0;">${safeModule}</h3>
                        <p style="color: #6b7280; margin: 0;">Due Date: <strong>${safeDate}</strong></p>
                    </div>
                    <p style="color: #4b5563;">Please complete this training before the due date.</p>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        - SafetyHub Connect Team
                    </p>
                </div>
            </div>
        `;

        return this.sendEmail({
            to: data.driverEmail,
            subject: `Training Assignment: ${data.moduleName}`,
            html
        });
    },

    async sendCoachingReminder(data: CoachingReminder): Promise<boolean> {
        const safeName = escapeHtml(data.driverName);
        const safeType = escapeHtml(data.coachingType);
        const safeDate = escapeHtml(data.checkInDate);
        const safeWeek = escapeHtml(data.week.toString());

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">SafetyHub Connect</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #1f2937;">Coaching Check-in Reminder</h2>
                    <p style="color: #4b5563;">Hello ${safeName},</p>
                    <p style="color: #4b5563;">This is a reminder about your upcoming coaching check-in:</p>
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3B82F6;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0;">${safeType} - Week ${safeWeek}</h3>
                        <p style="color: #6b7280; margin: 0;">Scheduled: <strong>${safeDate}</strong></p>
                    </div>
                    <p style="color: #4b5563;">Please be prepared to discuss your progress and any challenges you've faced.</p>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        - SafetyHub Connect Team
                    </p>
                </div>
            </div>
        `;

        return this.sendEmail({
            to: data.driverEmail,
            subject: `Coaching Reminder: ${data.coachingType} Week ${data.week}`,
            html
        });
    }
};
