import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/taskService', () => ({
  taskService: {
    fetchTasks: vi.fn().mockResolvedValue([
      {
        id: 't1',
        title: 'Inspection follow-up',
        priority: 'High',
        status: 'Pending',
        dueDate: '2026-02-20',
        type: 'Compliance',
        driverName: 'Driver One'
      },
      {
        id: 't2',
        title: 'Completed task',
        priority: 'Low',
        status: 'Completed',
        dueDate: '2026-02-18',
        type: 'Compliance'
      }
    ])
  }
}));

vi.mock('../services/inspectionService', () => ({
  inspectionService: {
    getInspections: vi.fn().mockResolvedValue([
      {
        id: 'i1',
        report_number: 'RPT-100',
        remediation_status: 'Open',
        remediation_due_date: '2026-02-01',
        driver_name: 'Driver Two'
      }
    ])
  }
}));

vi.mock('../services/driverService', () => ({
  driverService: {
    fetchDrivers: vi.fn().mockResolvedValue([
      {
        id: 'd1',
        name: 'Driver One',
        licenseExpirationDate: '2026-02-10',
        medicalCardExpirationDate: '2026-03-20'
      },
      {
        id: 'd2',
        name: 'Driver Two',
        licenseExpirationDate: null,
        medicalCardExpirationDate: null
      }
    ])
  }
}));

vi.mock('../services/documentService', () => ({
  documentService: {
    listDocuments: vi.fn().mockResolvedValue([
      {
        id: 'doc-1',
        name: 'Fleet Insurance Policy',
        category: 'Insurance',
        storagePath: 'org-1/fleet-insurance.pdf',
        uploadedAt: '2026-01-01T00:00:00.000Z',
        metadata: {
          required: true,
          expirationDate: '2026-12-01'
        }
      }
    ])
  }
}));

import { getComplianceSnapshot } from '../services/complianceService';

describe('complianceService', () => {
  it('builds action queue and expiration summary from live data', async () => {
    const snapshot = await getComplianceSnapshot('2026-03-01');

    expect(snapshot.openComplianceTasks).toBe(1);
    expect(snapshot.overdueRemediations).toBe(1);
    expect(snapshot.expiringCredentials.length).toBe(2);
    expect(snapshot.requiredDocumentGaps.length).toBe(3);
    expect(snapshot.requiredDocumentGaps.some((gap) => gap.requirement === 'Registration')).toBe(true);
    expect(snapshot.requiredDocumentGaps.some((gap) => gap.driverName === 'Driver Two' && gap.requirement === 'CDL')).toBe(true);
    expect(snapshot.actionQueue.length).toBe(5);
  });
});
