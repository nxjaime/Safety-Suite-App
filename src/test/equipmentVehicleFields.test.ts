import { describe, expect, it } from 'vitest';
import {
  buildInspectionStartUrl,
  buildEquipmentPayload,
  ELD_LOGGING_OPTIONS,
  OWN_LEASE_OPTIONS,
  US_STATE_OPTIONS,
  VEHICLE_LEASING_FIELD_LABELS,
  VEHICLE_TYPE_OPTIONS,
} from '../pages/Equipment';

describe('equipment vehicle fields', () => {
  it('builds equipment payload with numeric coercion', () => {
    const payload = buildEquipmentPayload({
      assetTag: 'TRK-999',
      type: 'Truck',
      make: 'Test',
      model: 'Unit',
      year: '2024',
      ownershipType: 'owned',
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
      ownLease: 'Own',
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
      vehicleType: 'Truck',
    }, 'Truck');

    expect(payload.grossWeight).toBe(80000);
    expect(payload.mthLeaseCharge).toBe(1200.5);
    expect(payload.leaseExpirYear).toBe(2029);
    expect(payload.avgMilesPerMonth).toBe(2500);
    expect(payload.state).toBe('TX');
  });

  it('exposes enum options', () => {
    expect(OWN_LEASE_OPTIONS).toContain('Own');
    expect(ELD_LOGGING_OPTIONS).toContain('Enabled');
    expect(VEHICLE_TYPE_OPTIONS).toContain('Truck');
    expect(US_STATE_OPTIONS.length).toBe(50);
  });

  it('defines vehicle and leasing field labels', () => {
    expect(VEHICLE_LEASING_FIELD_LABELS).toContain('Vehicle #');
    expect(VEHICLE_LEASING_FIELD_LABELS).toContain('ELD Logging');
    expect(VEHICLE_LEASING_FIELD_LABELS).toContain('Ins. Class');
  });

  it('builds a compliance DVER start URL for the selected asset', () => {
    expect(buildInspectionStartUrl({ assetTag: 'TRK S67/847855' } as any)).toBe('/compliance?view=inspections&start=1&vehicle=TRK+S67%2F847855');
  });
});
