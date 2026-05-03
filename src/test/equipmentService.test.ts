import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as supa from '../lib/supabase';

vi.mock('../lib/supabase', async () => {
  const actual = await vi.importActual('../lib/supabase');
  return {
    ...actual,
    getCurrentOrganization: vi.fn().mockResolvedValue('org-test'),
    supabase: {
      from: vi.fn()
    }
  };
});

const makeChain = (overrides: Record<string, any> = {}) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnValue({ data: [], error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue({ data: null, error: null }),
    ...overrides
  };
  // make all chainable methods return chain by default
  ['select', 'eq', 'insert', 'update'].forEach(m => {
    if (!overrides[m]) chain[m] = vi.fn().mockReturnValue(chain);
  });
  return chain;
};

describe('equipmentService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supa, 'getCurrentOrganization').mockResolvedValue('org-test');
  });

  describe('getEquipment', () => {
    it('applies organization filter', async () => {
      const eqSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const chain: any = { select: selectSpy, eq: eqSpy, range: vi.fn().mockReturnValue({ data: [], count: 0, error: null }) };
      chain.order = vi.fn().mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue(chain);

      const { equipmentService } = await import('../services/equipmentService');
      await equipmentService.getEquipment();

      expect((supa.supabase as any).from).toHaveBeenCalledWith('equipment');
      expect(eqSpy).toHaveBeenCalledWith('organization_id', 'org-test');
    });

    it('applies type filter when provided', async () => {
      const eqSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const chain: any = { select: selectSpy, eq: eqSpy, range: vi.fn().mockReturnValue({ data: [], count: 0, error: null }) };
      chain.order = vi.fn().mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue(chain);

      const { equipmentService } = await import('../services/equipmentService');
      await equipmentService.getEquipment({ type: 'Truck' });

      expect(eqSpy).toHaveBeenCalledWith('type', 'Truck');
    });
  });

  describe('createEquipment', () => {
    it('rejects safety role from creating equipment', async () => {
      const { equipmentService } = await import('../services/equipmentService');
      await expect(
        equipmentService.createEquipment({ assetTag: 'TRK-001', type: 'Truck' }, 'safety')
      ).rejects.toThrow('Insufficient permissions for this action');
    });

    it('rejects readonly role from creating equipment', async () => {
      const { equipmentService } = await import('../services/equipmentService');
      await expect(
        equipmentService.createEquipment({ assetTag: 'TRK-001', type: 'Truck' }, 'readonly')
      ).rejects.toThrow('Insufficient permissions for this action');
    });

    it('rejects coaching role from creating equipment', async () => {
      const { equipmentService } = await import('../services/equipmentService');
      await expect(
        equipmentService.createEquipment({ assetTag: 'TRK-001', type: 'Truck' }, 'coaching')
      ).rejects.toThrow('Insufficient permissions for this action');
    });

    it('allows maintenance role to create equipment', async () => {
      const insertSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockReturnValue({
        data: {
          id: 'eq-1', organization_id: 'org-test', asset_tag: 'TRK-001',
          type: 'Truck', ownership_type: 'owned', status: 'active',
          make: 'Freightliner', model: 'Cascadia', year: 2022,
          usage_miles: 0, usage_hours: 0
        },
        error: null
      });
      const chain: any = { insert: insertSpy, select: selectSpy, single: singleSpy };
      insertSpy.mockReturnValue(chain);
      selectSpy.mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue(chain);

      const { equipmentService } = await import('../services/equipmentService');
      const result = await equipmentService.createEquipment(
        { assetTag: 'TRK-001', type: 'Truck', make: 'Freightliner', model: 'Cascadia', year: 2022 },
        'maintenance'
      );

      expect(insertSpy).toHaveBeenCalled();
      expect(result.assetTag).toBe('TRK-001');
      expect(result.type).toBe('Truck');
    });

    it('includes organization_id on insert', async () => {
      const insertSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockReturnValue({
        data: { id: 'eq-2', organization_id: 'org-test', asset_tag: 'TRL-001', type: 'Trailer', ownership_type: 'owned', status: 'active' },
        error: null
      });
      const chain: any = { insert: insertSpy, select: selectSpy, single: singleSpy };
      insertSpy.mockReturnValue(chain);
      selectSpy.mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue(chain);

      const { equipmentService } = await import('../services/equipmentService');
      await equipmentService.createEquipment({ assetTag: 'TRL-001', type: 'Trailer' }, 'full');

      const insertArg = insertSpy.mock.calls[0][0][0];
      expect(insertArg.organization_id).toBe('org-test');
      expect(insertArg.asset_tag).toBe('TRL-001');
    });
  });

  describe('updateEquipment', () => {
    it('rejects safety role from updating equipment', async () => {
      const { equipmentService } = await import('../services/equipmentService');
      await expect(
        equipmentService.updateEquipment('eq-1', { make: 'Updated' }, 'safety')
      ).rejects.toThrow('Insufficient permissions for this action');
    });

    it('writes status history when status changes', async () => {
      const currentAsset = {
        id: 'eq-1', organization_id: 'org-test', asset_tag: 'TRK-001',
        type: 'Truck', ownership_type: 'owned', status: 'active',
        make: 'Freightliner', model: 'Cascadia', year: 2022,
        usage_miles: 0, usage_hours: 0
      };
      const updatedAsset = { ...currentAsset, status: 'maintenance' };

      const historyInsertSpy = vi.fn().mockReturnValue({ error: null });

      (supa.supabase as any).from = vi.fn().mockImplementation((table: string) => {
        if (table === 'equipment') {
          const eqSpy = vi.fn().mockReturnThis();
          const updateSpy = vi.fn().mockReturnThis();
          const selectSpy = vi.fn().mockReturnThis();
          const singleSpy = vi.fn().mockReturnValue({ data: updatedAsset, error: null });
          return { eq: eqSpy, update: updateSpy, select: selectSpy, single: singleSpy };
        }
        if (table === 'equipment_status_history') {
          return { insert: historyInsertSpy };
        }
        return {};
      });

      // stub getEquipmentById to return current asset
      const { equipmentService } = await import('../services/equipmentService');
      vi.spyOn(equipmentService, 'getEquipmentById').mockResolvedValue({
        id: 'eq-1', assetTag: 'TRK-001', type: 'Truck', ownershipType: 'owned',
        status: 'active', make: 'Freightliner', model: 'Cascadia', year: 2022
      });

      await equipmentService.updateEquipment('eq-1', { status: 'maintenance' }, 'maintenance');

      expect(historyInsertSpy).toHaveBeenCalled();
      const historyRow = historyInsertSpy.mock.calls[0][0][0];
      expect(historyRow.equipment_id).toBe('eq-1');
      expect(historyRow.previous_status).toBe('active');
      expect(historyRow.new_status).toBe('maintenance');
    });
  });

  describe('archiveEquipment', () => {
    it('sets status to archived', async () => {
      const { equipmentService } = await import('../services/equipmentService');
      const updateSpy = vi.spyOn(equipmentService, 'updateEquipment').mockResolvedValue({
        id: 'eq-1', assetTag: 'TRK-001', type: 'Truck', ownershipType: 'owned',
        status: 'archived', archivedAt: new Date().toISOString()
      });

      await equipmentService.archiveEquipment('eq-1', 'maintenance');

      expect(updateSpy).toHaveBeenCalledWith(
        'eq-1',
        expect.objectContaining({ status: 'archived' }),
        'maintenance'
      );
    });

    it('rejects non-fleet roles', async () => {
      const { equipmentService } = await import('../services/equipmentService');
      await expect(
        equipmentService.archiveEquipment('eq-1', 'readonly')
      ).rejects.toThrow('Insufficient permissions for this action');
    });
  });

  describe('retireEquipment', () => {
    it('sets status to retired', async () => {
      const { equipmentService } = await import('../services/equipmentService');
      const updateSpy = vi.spyOn(equipmentService, 'updateEquipment').mockResolvedValue({
        id: 'eq-1', assetTag: 'TRK-001', type: 'Truck', ownershipType: 'owned',
        status: 'retired', retiredAt: new Date().toISOString()
      });

      await equipmentService.retireEquipment('eq-1', 'full');

      expect(updateSpy).toHaveBeenCalledWith(
        'eq-1',
        expect.objectContaining({ status: 'retired' }),
        'full'
      );
    });
  });

  describe('getLinkedWorkOrders', () => {
    it('queries work_orders table filtered by equipment_id', async () => {
      const eqSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const chain: any = { select: selectSpy, eq: eqSpy, range: vi.fn().mockReturnValue({ data: [], count: 0, error: null }) };
      chain.order = vi.fn().mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue(chain);

      const { equipmentService } = await import('../services/equipmentService');
      await equipmentService.getLinkedWorkOrders('eq-1');

      expect((supa.supabase as any).from).toHaveBeenCalledWith('work_orders');
      expect(eqSpy).toHaveBeenCalledWith('equipment_id', 'eq-1');
      expect(eqSpy).toHaveBeenCalledWith('organization_id', 'org-test');
    });
  });

  describe('getLinkedDocuments', () => {
    it('queries documents table filtered by linked_equipment_id', async () => {
      const eqSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const chain: any = { select: selectSpy, eq: eqSpy, range: vi.fn().mockReturnValue({ data: [], count: 0, error: null }) };
      chain.order = vi.fn().mockReturnValue(chain);
      (supa.supabase as any).from = vi.fn().mockReturnValue(chain);

      const { equipmentService } = await import('../services/equipmentService');
      await equipmentService.getLinkedDocuments('eq-1');

      expect((supa.supabase as any).from).toHaveBeenCalledWith('documents');
      expect(eqSpy).toHaveBeenCalledWith('linked_equipment_id', 'eq-1');
    });
  });
});
