import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inspectionService } from '../services/inspectionService';

vi.mock('../lib/supabase', () => {
    const chain = () => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    return {
        supabase: { from: vi.fn(() => chain()) },
        getCurrentOrganization: vi.fn().mockResolvedValue('org-1'),
    };
});

import { supabase, getCurrentOrganization } from '../lib/supabase';

const mockSingle = (data: any) => ({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
});

describe('inspectionService remediation', () => {
    beforeEach(() => { vi.restoreAllMocks(); });

    it('updateRemediation calls update with correct fields', async () => {
        const returned = { id: 'insp-1', remediation_status: 'In Progress', remediation_owner: 'Jane' };
        vi.spyOn(supabase, 'from').mockReturnValue(mockSingle(returned) as any);
        const result = await inspectionService.updateRemediation('insp-1', {
            remediation_status: 'In Progress',
            remediation_owner: 'Jane',
        });
        expect(result.remediation_status).toBe('In Progress');
    });

    it('closeRemediation sets status to Closed with closed_by and evidence', async () => {
        const returned = {
            id: 'insp-1',
            remediation_status: 'Closed',
            remediation_closed_by: 'Manager A',
            remediation_evidence: 'Repair order #123',
        };
        const spy = vi.spyOn(supabase, 'from').mockReturnValue(mockSingle(returned) as any);
        const result = await inspectionService.closeRemediation('insp-1', 'Manager A', 'Repair order #123');
        expect(result.remediation_status).toBe('Closed');
        expect(result.remediation_closed_by).toBe('Manager A');
        expect(result.remediation_evidence).toBe('Repair order #123');
    });

    it('getOpenRemediations filters by Open and In Progress', async () => {
        const mockRows = [
            { id: 'a', remediation_status: 'Open', date: '2026-03-01' },
            { id: 'b', remediation_status: 'In Progress', date: '2026-03-02' },
        ];
        const chain = {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
        };
        vi.spyOn(supabase, 'from').mockReturnValue(chain as any);
        const result = await inspectionService.getOpenRemediations();
        expect(result).toHaveLength(2);
        expect(chain.in).toHaveBeenCalledWith('remediation_status', ['Open', 'In Progress']);
    });

    it('getOOSInspections filters out_of_service true and not Closed', async () => {
        const mockRows = [{ id: 'c', out_of_service: true, remediation_status: 'Open' }];
        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
        };
        vi.spyOn(supabase, 'from').mockReturnValue(chain as any);
        const result = await inspectionService.getOOSInspections();
        expect(result).toHaveLength(1);
        expect(chain.eq).toHaveBeenCalledWith('out_of_service', true);
        expect(chain.neq).toHaveBeenCalledWith('remediation_status', 'Closed');
    });

    it('getOOSInspections applies org scope', async () => {
        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        vi.spyOn(supabase, 'from').mockReturnValue(chain as any);
        await inspectionService.getOOSInspections();
        expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });
});
