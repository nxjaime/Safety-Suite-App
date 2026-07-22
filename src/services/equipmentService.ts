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
  removedFromFleet: row.removed_from_fleet,
  addedToFleet: row.added_to_fleet,
  divNumber: row.div_number,
  division: row.division,
  corp: row.corp,
  ownLease: row.own_lease,
  owner: row.owner,
  city: row.city,
  state: row.state,
  vehicleNumber: row.vehicle_number,
  vin: row.vin,
  insClass: row.ins_class,
  glAcct: row.gl_acct,
  grossWeight: row.gross_weight,
  geotab: row.geotab,
  tollTransponder: row.toll_transponder,
  driver: row.driver,
  repCode: row.rep_code,
  driverCheckNumber: row.driver_check_number,
  mthLeaseCharge: row.mth_lease_charge,
  mileageCharge: row.mileage_charge,
  followUp: row.follow_up,
  leaseExpirYear: row.lease_expir_year,
  vehicleValue: row.vehicle_value,
  licensePlate: row.license_plate,
  notes: row.notes,
  monthsInService: row.months_in_service,
  asOfDate: row.as_of_date,
  avgMilesPerMonth: row.avg_miles_per_month,
  estimatedOdometer6mo: row.estimated_odometer_6mo,
  mgr: row.mgr,
  eldLogging: row.eld_logging,
  email: row.email,
  phone: row.phone,
  imei: row.imei,
  eldNotes: row.eld_notes,
  vehicleType: row.vehicle_type,
});

export { mapEquipment };

export const equipmentService = {
  async getEquipment(filters?: { status?: string; type?: string | string[] }): Promise<Equipment[]> {
    const { data } = await this.getEquipmentPaginated(1, 1000, filters);
    return data;
  },

  async getEquipmentPaginated(
    page: number,
    pageSize: number,
    filters?: { status?: string; type?: string | string[] }
  ): Promise<{ data: Equipment[]; count: number }> {
    const orgId = await getCurrentOrganization();
    let query = supabase.from('equipment').select('*', { count: 'exact' });
    if (orgId) query = query.eq('organization_id', orgId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (Array.isArray(filters?.type)) {
      query = query.in('type', filters.type);
    } else if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await query.order('asset_tag').range(from, to);
    if (error) throw error;
    return { data: (data || []).map(mapEquipment), count: count || 0 };
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
        removed_from_fleet: asset.removedFromFleet || null,
        added_to_fleet: asset.addedToFleet || null,
        div_number: asset.divNumber || null,
        division: asset.division || null,
        corp: asset.corp || null,
        own_lease: asset.ownLease || null,
        owner: asset.owner || null,
        city: asset.city || null,
        state: asset.state || null,
        vehicle_number: asset.vehicleNumber || null,
        vin: asset.vin || null,
        ins_class: asset.insClass || null,
        gl_acct: asset.glAcct || null,
        gross_weight: asset.grossWeight ?? null,
        geotab: asset.geotab || null,
        toll_transponder: asset.tollTransponder || null,
        driver: asset.driver || null,
        rep_code: asset.repCode || null,
        driver_check_number: asset.driverCheckNumber || null,
        mth_lease_charge: asset.mthLeaseCharge ?? null,
        mileage_charge: asset.mileageCharge ?? null,
        follow_up: asset.followUp || null,
        lease_expir_year: asset.leaseExpirYear ?? null,
        vehicle_value: asset.vehicleValue ?? null,
        license_plate: asset.licensePlate || null,
        notes: asset.notes || null,
        months_in_service: asset.monthsInService ?? null,
        as_of_date: asset.asOfDate || null,
        avg_miles_per_month: asset.avgMilesPerMonth ?? null,
        estimated_odometer_6mo: asset.estimatedOdometer6mo ?? null,
        mgr: asset.mgr || null,
        eld_logging: asset.eldLogging || null,
        email: asset.email || null,
        phone: asset.phone || null,
        imei: asset.imei || null,
        eld_notes: asset.eldNotes || null,
        vehicle_type: asset.vehicleType || null,
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
    if (updates.removedFromFleet !== undefined) dbUpdates.removed_from_fleet = updates.removedFromFleet || null;
    if (updates.addedToFleet !== undefined) dbUpdates.added_to_fleet = updates.addedToFleet || null;
    if (updates.divNumber !== undefined) dbUpdates.div_number = updates.divNumber || null;
    if (updates.division !== undefined) dbUpdates.division = updates.division || null;
    if (updates.corp !== undefined) dbUpdates.corp = updates.corp || null;
    if (updates.ownLease !== undefined) dbUpdates.own_lease = updates.ownLease || null;
    if (updates.owner !== undefined) dbUpdates.owner = updates.owner || null;
    if (updates.city !== undefined) dbUpdates.city = updates.city || null;
    if (updates.state !== undefined) dbUpdates.state = updates.state || null;
    if (updates.vehicleNumber !== undefined) dbUpdates.vehicle_number = updates.vehicleNumber || null;
    if (updates.vin !== undefined) dbUpdates.vin = updates.vin || null;
    if (updates.insClass !== undefined) dbUpdates.ins_class = updates.insClass || null;
    if (updates.glAcct !== undefined) dbUpdates.gl_acct = updates.glAcct || null;
    if (updates.grossWeight !== undefined) dbUpdates.gross_weight = updates.grossWeight;
    if (updates.geotab !== undefined) dbUpdates.geotab = updates.geotab || null;
    if (updates.tollTransponder !== undefined) dbUpdates.toll_transponder = updates.tollTransponder || null;
    if (updates.driver !== undefined) dbUpdates.driver = updates.driver || null;
    if (updates.repCode !== undefined) dbUpdates.rep_code = updates.repCode || null;
    if (updates.driverCheckNumber !== undefined) dbUpdates.driver_check_number = updates.driverCheckNumber || null;
    if (updates.mthLeaseCharge !== undefined) dbUpdates.mth_lease_charge = updates.mthLeaseCharge;
    if (updates.mileageCharge !== undefined) dbUpdates.mileage_charge = updates.mileageCharge;
    if (updates.followUp !== undefined) dbUpdates.follow_up = updates.followUp || null;
    if (updates.leaseExpirYear !== undefined) dbUpdates.lease_expir_year = updates.leaseExpirYear;
    if (updates.vehicleValue !== undefined) dbUpdates.vehicle_value = updates.vehicleValue;
    if (updates.licensePlate !== undefined) dbUpdates.license_plate = updates.licensePlate || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    if (updates.monthsInService !== undefined) dbUpdates.months_in_service = updates.monthsInService;
    if (updates.asOfDate !== undefined) dbUpdates.as_of_date = updates.asOfDate || null;
    if (updates.avgMilesPerMonth !== undefined) dbUpdates.avg_miles_per_month = updates.avgMilesPerMonth;
    if (updates.estimatedOdometer6mo !== undefined) dbUpdates.estimated_odometer_6mo = updates.estimatedOdometer6mo;
    if (updates.mgr !== undefined) dbUpdates.mgr = updates.mgr || null;
    if (updates.eldLogging !== undefined) dbUpdates.eld_logging = updates.eldLogging || null;
    if (updates.email !== undefined) dbUpdates.email = updates.email || null;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
    if (updates.imei !== undefined) dbUpdates.imei = updates.imei || null;
    if (updates.eldNotes !== undefined) dbUpdates.eld_notes = updates.eldNotes || null;
    if (updates.vehicleType !== undefined) dbUpdates.vehicle_type = updates.vehicleType || null;

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

  // Inspections link via vehicle_name = asset_tag where present. Older rows may only
  // have the unit stored in the generated description fallback.
  async getLinkedInspections(equipmentId: string): Promise<any[]> {
    const asset = await this.getEquipmentById(equipmentId);
    if (!asset) return [];
    const orgId = await getCurrentOrganization();

    let query = supabase
      .from('inspections')
      .select('*');
    if (orgId) query = query.eq('organization_id', orgId);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) return [];

    return (data || []).filter((inspection) => {
      if (inspection.vehicle_name === asset.assetTag) return true;
      const vehicleMatch = String(inspection.description || '').match(/Vehicle:\s*(.*)$/);
      return vehicleMatch?.[1]?.trim() === asset.assetTag;
    });
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
