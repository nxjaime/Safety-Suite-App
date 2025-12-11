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

export const emailService = {
    // For client-side, we'll use Supabase Edge Function or a simple fetch to an API route
    // In production, this would be a server-side call

    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            // Using Supabase Edge Function endpoint
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...options,
                    from: options.from || 'SafetyHub Connect <noreply@safetyhub.com>'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            return true;
        } catch (error) {
            console.error('Email send failed:', error);
            return false;
        }
    },

    async sendTrainingNotification(data: TrainingNotification): Promise<boolean> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">SafetyHub Connect</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #1f2937;">Training Assignment Notification</h2>
                    <p style="color: #4b5563;">Hello ${data.driverName},</p>
                    <p style="color: #4b5563;">You have been assigned a new training module:</p>
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0;">${data.moduleName}</h3>
                        <p style="color: #6b7280; margin: 0;">Due Date: <strong>${data.dueDate}</strong></p>
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
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">SafetyHub Connect</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #1f2937;">Coaching Check-in Reminder</h2>
                    <p style="color: #4b5563;">Hello ${data.driverName},</p>
                    <p style="color: #4b5563;">This is a reminder about your upcoming coaching check-in:</p>
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3B82F6;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0;">${data.coachingType} - Week ${data.week}</h3>
                        <p style="color: #6b7280; margin: 0;">Scheduled: <strong>${data.checkInDate}</strong></p>
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
