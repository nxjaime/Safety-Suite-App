import { describe, it, expect } from 'vitest';
import { querySchema as carrierSchema } from '../../api/carrier-health';
import { MOTIVE_UNSUPPORTED_RESPONSE } from '../../api/motive/drivers';
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

    describe('Motive Placeholder Contract', () => {
        it('returns a stable unsupported integration response', () => {
            expect(MOTIVE_UNSUPPORTED_RESPONSE).toEqual({
                error: 'Motive integration is not enabled for this product.',
                code: 'MOTIVE_INTEGRATION_DISABLED',
                retryable: false
            });
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
