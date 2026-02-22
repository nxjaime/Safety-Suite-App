import { describe, it, expect } from 'vitest';
import { querySchema as carrierSchema } from '../../api/carrier-health';
import { querySchema as driversSchema } from '../../api/motive/drivers';
import { querySchema as scoresSchema } from '../../api/motive/scores';
import { querySchema as eventsSchema } from '../../api/motive/events';
import { bodySchema as emailSchema } from '../../api/send-email';

describe('API Schema Validation', () => {
    describe('Carrier Health Schema', () => {
        it('should accept valid numeric DOT number', () => {
            const result = carrierSchema.safeParse({ dot: '1234567' });
            expect(result.success).toBe(true);
        });

        it('should reject non-numeric DOT number', () => {
            const result = carrierSchema.safeParse({ dot: '123abc456' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('DOT number must be numeric');
            }
        });

        it('should reject missing DOT number', () => {
            const result = carrierSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });

    describe('Motive Drivers Schema', () => {
        it('should accept valid page and per_page', () => {
            const result = driversSchema.safeParse({ page: '2', per_page: '50' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(2);
                expect(result.data.per_page).toBe(50);
            }
        });

        it('should use defaults if params missing', () => {
            const result = driversSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(1);
                expect(result.data.per_page).toBe(100);
            }
        });

        it('should reject invalid page numbers', () => {
            const result = driversSchema.safeParse({ page: '0' });
            expect(result.success).toBe(false);
        });

        it('should reject invalid per_page', () => {
            const result = driversSchema.safeParse({ per_page: '101' });
            expect(result.success).toBe(false);
        });
    });

    describe('Motive Scores Schema', () => {
        it('should accept valid dates YYYY-MM-DD', () => {
            const result = scoresSchema.safeParse({ start_date: '2023-01-01', end_date: '2023-01-31' });
            expect(result.success).toBe(true);
        });

        it('should reject invalid date format', () => {
            const result = scoresSchema.safeParse({ start_date: '01-01-2023', end_date: '2023/01/31' });
            expect(result.success).toBe(false);
        });
    });

    describe('Motive Events Schema', () => {
        it('should accept ISO datetime strings', () => {
            const result = eventsSchema.safeParse({
                start_time: '2023-01-01T00:00:00Z',
                end_time: '2023-01-31T23:59:59Z'
            });
            expect(result.success).toBe(true);
        });

        it('should accept YYYY-MM-DD strings', () => {
            const result = eventsSchema.safeParse({
                start_time: '2023-01-01',
                end_time: '2023-01-31'
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid strings', () => {
            const result = eventsSchema.safeParse({
                start_time: 'invalid',
                end_time: 'also-invalid'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Send Email Schema', () => {
        it('accepts valid email payload', () => {
            const result = emailSchema.safeParse({
                to: 'driver@example.com',
                subject: 'Reminder',
                html: '<p>Safety reminder</p>'
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid recipient email', () => {
            const result = emailSchema.safeParse({
                to: 'invalid',
                subject: 'Reminder',
                html: '<p>Safety reminder</p>'
            });
            expect(result.success).toBe(false);
        });
    });
});
