import { describe, expect, it } from 'vitest';
import { buildInspectionComplianceTasks, type ViolationItem } from '../services/inspectionService';

describe('inspection compliance task generation', () => {
  it('creates high-priority OOS task when inspection is out of service', () => {
    const tasks = buildInspectionComplianceTasks({
      id: 'insp-1',
      report_number: 'RPT-100',
      out_of_service: true,
      vehicle_name: 'TRK-1',
      organization_id: 'org-1'
    }, []);

    expect(tasks.length).toBe(1);
    expect(tasks[0].type).toBe('Compliance');
    expect(tasks[0].priority).toBe('High');
  });

  it('creates one task per violation and prioritizes OOS violations', () => {
    const violations: ViolationItem[] = [
      { code: '395.8', description: 'Log book violation', type: 'Driver', oos: false },
      { code: '393.47', description: 'Brake defect', type: 'Vehicle', oos: true }
    ];

    const tasks = buildInspectionComplianceTasks({
      id: 'insp-2',
      report_number: 'RPT-200',
      out_of_service: false,
      organization_id: 'org-1'
    }, violations);

    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe('Medium');
    expect(tasks[1].priority).toBe('High');
    expect(tasks[1].title).toContain('393.47');
  });
});
