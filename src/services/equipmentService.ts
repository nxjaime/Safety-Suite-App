import { supabase, getCurrentOrganization } from '../lib/supabase';
import { canManageFleet, type ProfileRole } from './authorizationService';
import type { Equipment, EquipmentStatus, EquipmentStatusHistoryEntry } from '../types';

const ensureCanMutate = (role?: ProfileRole) => {
  if (role && !canManageFleet(role)) {
    throw new Error('Insufficient permissions for this action');
  }
};

const mapEquipment = (row: any): Equipment => ({
  id: row.id,
  organizationId: row.organization_id,
  assetTag: row.asset_tag,
  type: row.type,
  ownershipType: row.ownership_type,
  status: row.status as EquipmentStatus,
  make: row.make,
  model: row.model,
  year: row.year,
  usageMiles: row.usage_miles,
  usageHours: row.usage_hours,
  attachments: row.attachments || [],
  forkliftAttachments: row.forklift_attachments || [],
  nextServiceDate: row.next_service_date,
  archivedAt: row.archived_at,
  retiredAt: row.retired_at,
});

export { mapEquipment };

export const equipmentService = {
  async getEquipment(filters?: { status?: string; type?: string }): Promise<Equipment[]> {
    const orgId = await getCurrentOrganization();
    let query = supabase.from('equipment').select('*');
    if (orgId) query = query.eq('organization_id', orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    const { data, error } = await query.order('asset_tag');
    if (error) throw error;
    return (data || []).map(mapEquipment);
  },

  async getEquipmentById(id: string): Promise<Equipment | null> {
    const orgId = await getCurrentOrganization();
    let query = supabase.from('equipment').select('*').eq('id', id);
    if (orgId) query = query.eq('organization_id', orgId);
    const { data, error } = await query.single();
    if (error) return null;
    return mapEquipment(data);
  },

  async createEquipment(asset: Partial<Equipment>, role?: ProfileRole): Promise<Equipment> {
    ensureCanMutate(role);
    const orgId = await getCurrentOrganization();
    const { data, error } = await supabase
      .from('equipment')
      .insert([{
        organization_id: orgId,
        asset_tag: asset.assetTag,
        type: asset.type,
        ownership_type: asset.ownershipType || 'owned',
        status: asset.status || 'active',
        make: asset.make || null,
        model: asset.model || null,
        year: asset.year || null,
        usage_miles: asset.usageMiles || 0,
        usage_hours: asset.usageHours || 0,
        attachments: asset.attachments || null,
        forklift_attachments: asset.forkliftAttachments || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return mapEquipment(data);
  },

  async updateEquipment(
    id: string,
    updates: Partial<Equipment> & { statusNotes?: string },
    role?: ProfileRole
  ): Promise<Equipment> {
    ensureCanMutate(role);
    const orgId = await getCurrentOrganization();

    // Capture current status for history before updating
    const current = await this.getEquipmentById(id);

    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.assetTag !== undefined) dbUpdates.asset_tag = updates.assetTag;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.ownershipType !== undefined) dbUpdates.ownership_type = updates.ownershipType;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.make !== undefined) dbUpdates.make = updates.make;
    if (updates.model !== undefined) dbUpdates.model = updates.model;
    if (updates.year !== undefined) dbUpdates.year = updates.year;
    if (updates.usageMiles !== undefined) dbUpdates.usage_miles = updates.usageMiles;
    if (updates.usageHours !== undefined) dbUpdates.usage_hours = updates.usageHours;
    if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
    if (updates.forkliftAttachments !== undefined) dbUpdates.forklift_attachments = updates.forkliftAttachments;
    if (updates.nextServiceDate !== undefined) dbUpdates.next_service_date = updates.nextServiceDate;
    if (updates.archivedAt !== undefined) dbUpdates.archived_at = updates.archivedAt;
    if (updates.retiredAt !== undefined) dbUpdates.retired_at = updates.retiredAt;

    let query = supabase.from('equipment').update(dbUpdates).eq('id', id);
    if (orgId) query = query.eq('organization_id', orgId);
    const { data, error } = await query.select().single();
    if (error) throw error;

    // Write status history if status changed
    if (updates.status && current && updates.status !== current.status) {
      await supabase.from('equipment_status_history').insert([{
        equipment_id: id,
        organization_id: orgId,
        previous_status: current.status,
        new_status: updates.status,
        notes: updates.statusNotes || null,
      }]);
    }

    return mapEquipment(data);
  },

  async archiveEquipment(id: string, role?: ProfileRole): Promise<Equipment> {
    return this.updateEquipment(id, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
      statusNotes: 'Asset archived',
    }, role);
  },

  async retireEquipment(id: string, role?: ProfileRole): Promise<Equipment> {
    return this.updateEquipment(id, {
      status: 'retired',
      retiredAt: new Date().toISOString(),
      statusNotes: 'Asset retired',
    }, role);
  },

  async getStatusHistory(equipmentId: string): Promise<EquipmentStatusHistoryEntry[]> {
    const { data, error } = await supabase
      .from('equipment_status_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('changed_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      equipmentId: r.equipment_id,
      organizationId: r.organization_id,
      previousStatus: r.previous_status,
      newStatus: r.new_status,
      changedAt: r.changed_at,
      notes: r.notes,
    }));
  },

  // Inspections link via vehicle_name = asset_tag (no FK yet; Sprint 24 will add proper FK)
  async getLinkedInspections(equipmentId: string): Promise<any[]> {
    const asset = await this.getEquipmentById(equipmentId);
    if (!asset) return [];
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('inspections')
      .select('*')
      .eq('vehicle_name', asset.assetTag);
    if (orgId) query = query.eq('organization_id', orgId);
    const { data, error } = await query.order('date', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async getLinkedWorkOrders(equipmentId: string): Promise<any[]> {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('work_orders')
      .select('*')
      .eq('equipment_id', equipmentId);
    if (orgId) query = query.eq('organization_id', orgId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getLinkedDocuments(equipmentId: string): Promise<any[]> {
    const orgId = await getCurrentOrganization();
    let query = supabase
      .from('documents')
      .select('*')
      .eq('linked_equipment_id', equipmentId)
      .eq('status', 'active');
    if (orgId) query = query.eq('organization_id', orgId);
    const { data, error } = await query.order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
