import { driverService } from './driverService';
import { inspectionService } from './inspectionService';
import { taskService } from './taskService';

type CompliancePriority = 'High' | 'Medium' | 'Low';
type ComplianceStatus = 'Pending' | 'In Progress' | 'Completed';
type CredentialStatus = 'Good' | 'Warning' | 'Critical';

export interface ComplianceQueueItem {
  id: string;
  title: string;
  source: 'Task' | 'Inspection';
  priority: CompliancePriority;
  status: ComplianceStatus;
  dueDate?: string;
  driverName?: string;
}

export interface ExpiringCredentialItem {
  id: string;
  driver: string;
  type: string;
  date: string;
  status: CredentialStatus;
}

export interface ComplianceSnapshot {
  openComplianceTasks: number;
  overdueRemediations: number;
  expiringCredentials: ExpiringCredentialItem[];
  actionQueue: ComplianceQueueItem[];
}

const getCredentialStatus = (date: string, today: Date): CredentialStatus => {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return 'Good';
  const diffMs = target.getTime() - today.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 0) return 'Critical';
  if (days <= 30) return 'Warning';
  return 'Good';
};

export async function getComplianceSnapshot(todayISO = new Date().toISOString().split('T')[0]): Promise<ComplianceSnapshot> {
  const [tasks, inspections, drivers] = await Promise.all([
    taskService.fetchTasks(),
    inspectionService.getInspections(),
    driverService.fetchDrivers()
  ]);

  const today = new Date(todayISO);
  const openTasks = tasks.filter((task) => task.type === 'Compliance' && task.status !== 'Completed');

  const inspectionQueue: ComplianceQueueItem[] = inspections
    .filter((inspection) => inspection.remediation_status !== 'Closed')
    .map((inspection) => {
      const overdue = inspection.remediation_due_date && inspection.remediation_due_date < todayISO;
      return {
        id: `inspection-${inspection.id}`,
        title: `Inspection ${inspection.report_number || inspection.id} remediation`,
        source: 'Inspection',
        priority: overdue ? 'High' : 'Medium',
        status: inspection.remediation_status === 'In Progress' ? 'In Progress' : 'Pending',
        dueDate: inspection.remediation_due_date,
        driverName: inspection.driver_name || undefined
      };
    });

  const taskQueue: ComplianceQueueItem[] = openTasks.map((task) => ({
    id: `task-${task.id}`,
    title: task.title,
    source: 'Task',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    driverName: task.driverName
  }));

  const expiringCredentials: ExpiringCredentialItem[] = [];
  for (const driver of drivers) {
    if (driver.licenseExpirationDate) {
      expiringCredentials.push({
        id: `${driver.id}-license`,
        driver: driver.name,
        type: 'CDL',
        date: driver.licenseExpirationDate,
        status: getCredentialStatus(driver.licenseExpirationDate, today)
      });
    }
    if (driver.medicalCardExpirationDate) {
      expiringCredentials.push({
        id: `${driver.id}-medical`,
        driver: driver.name,
        type: 'Medical Card',
        date: driver.medicalCardExpirationDate,
        status: getCredentialStatus(driver.medicalCardExpirationDate, today)
      });
    }
  }

  expiringCredentials.sort((a, b) => a.date.localeCompare(b.date));

  const overdueRemediations = inspections.filter(
    (inspection) => inspection.remediation_status !== 'Closed'
      && inspection.remediation_due_date
      && inspection.remediation_due_date < todayISO
  ).length;

  const actionQueue = [...taskQueue, ...inspectionQueue].sort((a, b) => {
    const rank = { High: 0, Medium: 1, Low: 2 };
    if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
    return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
  });

  return {
    openComplianceTasks: openTasks.length,
    overdueRemediations,
    expiringCredentials,
    actionQueue
  };
}
