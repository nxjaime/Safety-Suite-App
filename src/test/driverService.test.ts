import { describe, it, expect, vi } from 'vitest';
import { driverService } from '../services/driverService';
import * as supa from '../lib/supabase';

describe('driverService', () => {
  describe('updateCoachingPlan', () => {
    it('maps camelCase to snake_case and includes weekly_check_ins and filters by org', async () => {
      const orgId = 'org-xyz';
      vi.spyOn(driverService as any, '_getOrgId').mockResolvedValue(orgId);

      const eqMock = vi.fn().mockReturnThis();
      const selectMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockReturnValue({ data: {}, error: null });

      const chain: any = { eq: eqMock, select: selectMock, single: singleMock };
      const updateSpy = vi.fn().mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue({ update: updateSpy });

      const updates = { status: 'Completed', weeklyCheckIns: [{ week: 1, status: 'Complete' }] };
      await driverService.updateCoachingPlan('plan-1', updates);

      expect(updateSpy).toHaveBeenCalledWith({ status: 'Completed', weekly_check_ins: updates.weeklyCheckIns });
      // should have applied org filter before final id filter
      expect(eqMock).toHaveBeenCalledWith('organization_id', orgId);
      expect(eqMock).toHaveBeenCalledWith('id', 'plan-1');
    });

    it('does not crash if weeklyCheckIns is empty array', async () => {
      // ensure orgId is null so we don't hit the eq branch
      vi.spyOn(driverService as any, '_getOrgId').mockResolvedValue(null);
      const eqSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockReturnValue({ data: {}, error: null });
      const chain: any = { eq: eqSpy, select: selectSpy, single: singleSpy };
      const updateSpy = vi.fn().mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue({ update: updateSpy });

      await driverService.updateCoachingPlan('plan-1', { status: 'Active', weeklyCheckIns: [] });
      expect(updateSpy).toHaveBeenCalled();
    });

    it('persists outcome when provided', async () => {
      vi.spyOn(driverService as any, '_getOrgId').mockResolvedValue('org-abc');
      const eqSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockReturnValue({ data: {}, error: null });
      const chain: any = { eq: eqSpy, select: selectSpy, single: singleSpy };
      const updateSpy = vi.fn().mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue({ update: updateSpy });

      await driverService.updateCoachingPlan('plan-9', {
        status: 'Completed',
        outcome: '12 points improved'
      });

      expect(updateSpy).toHaveBeenCalledWith({
        status: 'Completed',
        outcome: '12 points improved'
      });
    });
  });

  describe('addCoachingPlan', () => {
    it('includes organization_id on insert', async () => {
      const orgId = 'org-123';
      // stub _getOrgId
      vi.spyOn(driverService as any, '_getOrgId').mockResolvedValue(orgId);
      const insertSpy = vi.fn().mockReturnValue({ select: () => ({ single: () => ({ data: { id: 'plan-1' }, error: null }) }) });
      const taskInsertSpy = vi.fn().mockReturnValue({ error: null });
      (supa.supabase as any).from = vi.fn().mockImplementation((table: string) => {
        if (table === 'coaching_plans') {
          return { insert: insertSpy };
        }
        if (table === 'tasks') {
          return { insert: taskInsertSpy };
        }
        return {};
      });

      const plan = {
        type: 'Speeding',
        startDate: '2023-01-01',
        durationWeeks: 4,
        status: 'Active',
        weeklyCheckIns: [{ week: 1, date: '2023-01-08' }]
      };

      await driverService.addCoachingPlan('driver-1', 'Alice', plan);

      expect(insertSpy).toHaveBeenCalled();
      const firstArg = insertSpy.mock.calls[0][0][0];
      expect(firstArg.organization_id).toBe(orgId);
    });

    it('continues when task creation fails', async () => {
      vi.spyOn(driverService as any, '_getOrgId').mockResolvedValue('org-123');
      const insertSpy = vi.fn().mockReturnValue({ select: () => ({ single: () => ({ data: { id: 'plan-2' }, error: null }) }) });
      const taskInsertSpy = vi.fn().mockReturnValue({ error: { message: 'fail' } });
      (supa.supabase as any).from = vi.fn().mockImplementation((table: string) => {
        if (table === 'coaching_plans') return { insert: insertSpy };
        if (table === 'tasks') return { insert: taskInsertSpy };
        return {};
      });

      const plan = { type: 'Braking', startDate: '2023-02-01', durationWeeks: 2, status: 'Active', weeklyCheckIns: [] };
      await expect(driverService.addCoachingPlan('driver-2', 'Bob', plan)).resolves.not.toThrow();
      expect(taskInsertSpy).toHaveBeenCalled();
    });
  });
});
