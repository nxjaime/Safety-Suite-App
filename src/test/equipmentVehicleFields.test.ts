import { describe, it, expect } from 'vitest';
import { buildEquipmentRow, ELD_LOGGING_OPTIONS, OWN_LEASE_OPTIONS, US_STATE_OPTIONS, VEHICLE_TYPE_OPTIONS, VEHICLE_LEASING_FIELD_LABELS } from '../pages/Equipment';

describe('equipment vehicle fields', () => {
  it('builds equipment row with numeric coercion', () => {
    const row = buildEquipmentRow({
      id: 'TRK-999',
      type: 'Truck',
      make: 'Test',
      model: 'Unit',
      year: '2024',
      ownLease: 'Own',
      status: 'active',
      usageMiles: '1200',
      usageHours: '45',
      attachments: 'Camera, Tablet',
      forkliftAttachments: [],
      removedFromFleet: '',
      addedToFleet: '2026-02-01',
      divNumber: '10',
      division: 'Ops',
      corp: 'HQ',
      owner: 'Nick',
      city: 'Austin',
      state: 'TX',
      vehicleNumber: '1001',
      vin: 'VIN123',
      insClass: 'A',
      glAcct: '4000',
      grossWeight: '80000',
      geotab: 'GT-100',
      tollTransponder: 'TT-200',
      driver: 'Sam',
      repCode: 'R1',
      driverCheckNumber: 'CHK-9',
      mthLeaseCharge: '1200.50',
      mileageCharge: '0.12',
      followUp: '',
      leaseExpirYear: '2029',
      vehicleValue: '100000',
      licensePlate: 'ABC-123',
      notes: 'Test notes',
      monthsInService: '12',
      asOfDate: '2026-02-01',
      avgMilesPerMonth: '2500',
      estimatedOdometer6mo: '15000',
      mgr: 'Alex',
      eldLogging: 'Enabled',
      email: 'fleet@company.com',
      phone: '512-555-1000',
      imei: 'IMEI-1',
      eldNotes: 'ELD OK',
      vehicleType: 'Truck'
    }, 'Trucks', 'Pending');

    expect(row.grossWeight).toBe(80000);
    expect(row.mthLeaseCharge).toBe(1200.5);
    expect(row.leaseExpirYear).toBe(2029);
    expect(row.avgMilesPerMonth).toBe(2500);
    expect(row.state).toBe('TX');
  });

  it('exposes enum options', () => {
    expect(OWN_LEASE_OPTIONS).toContain('Own');
    expect(ELD_LOGGING_OPTIONS).toContain('Enabled');
    expect(VEHICLE_TYPE_OPTIONS).toContain('Truck');
    expect(US_STATE_OPTIONS.length).toBe(50);
  });

  it('defines vehicle & leasing field labels', () => {
    expect(VEHICLE_LEASING_FIELD_LABELS).toContain('Vehicle #');
    expect(VEHICLE_LEASING_FIELD_LABELS).toContain('ELD Logging');
    expect(VEHICLE_LEASING_FIELD_LABELS).toContain('Ins. Class');
  });
});
