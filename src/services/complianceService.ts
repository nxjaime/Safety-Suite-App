import { driverService } from './driverService';
import { documentService } from './documentService';
import { inspectionService } from './inspectionService';
import { taskService } from './taskService';

type CompliancePriority = 'High' | 'Medium' | 'Low';
type ComplianceStatus = 'Pending' | 'In Progress' | 'Completed';
type CredentialStatus = 'Good' | 'Warning' | 'Critical';
type RequiredDocumentStatus = 'Missing' | 'Expired';

export interface ComplianceQueueItem {
  id: string;
  title: string;
  source: 'Task' | 'Inspection' | 'Required Document';
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

export interface RequiredDocumentGap {
  id: string;
  requirement: string;
  scope: 'Organization' | 'Driver';
  status: RequiredDocumentStatus;
  driverName?: string;
  dueDate?: string;
}

export interface ComplianceSnapshot {
  openComplianceTasks: number;
  overdueRemediations: number;
  expiringCredentials: ExpiringCredentialItem[];
  requiredDocumentGaps: RequiredDocumentGap[];
  actionQueue: ComplianceQueueItem[];
}

const REQUIRED_ORG_DOCUMENTS = ['Insurance', 'Registration'];

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
  const [tasks, inspections, drivers, documents] = await Promise.all([
    taskService.fetchTasks(),
    inspectionService.getInspections(),
    driverService.fetchDrivers(),
    documentService.listDocuments()
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

  const requiredDocumentGaps: RequiredDocumentGap[] = [];

  for (const category of REQUIRED_ORG_DOCUMENTS) {
    const matching = documents.filter((doc) => doc.category === category);
    const active = matching.find((doc) => {
      const expirationDate = String((doc.metadata || {}).expirationDate || '');
      if (!expirationDate) return true;
      return expirationDate >= todayISO;
    });

    if (!active) {
      const hasExpiredOnly = matching.length > 0;
      requiredDocumentGaps.push({
        id: `org-${category.toLowerCase().replace(/\s+/g, '-')}`,
        requirement: category,
        scope: 'Organization',
        status: hasExpiredOnly ? 'Expired' : 'Missing'
      });
    }
  }

  for (const driver of drivers) {
    if (!driver.licenseExpirationDate) {
      requiredDocumentGaps.push({
        id: `driver-${driver.id}-cdl`,
        requirement: 'CDL',
        scope: 'Driver',
        status: 'Missing',
        driverName: driver.name
      });
    }
    if (!driver.medicalCardExpirationDate) {
      requiredDocumentGaps.push({
        id: `driver-${driver.id}-medical-card`,
        requirement: 'Medical Card',
        scope: 'Driver',
        status: 'Missing',
        driverName: driver.name
      });
    }
  }

  const overdueRemediations = inspections.filter(
    (inspection) => inspection.remediation_status !== 'Closed'
      && inspection.remediation_due_date
      && inspection.remediation_due_date < todayISO
  ).length;

  const requiredDocQueue: ComplianceQueueItem[] = requiredDocumentGaps.map((gap) => ({
    id: `required-${gap.id}`,
    title: gap.scope === 'Driver'
      ? `${gap.driverName}: missing ${gap.requirement}`
      : `Missing required ${gap.requirement} document`,
    source: 'Required Document',
    priority: 'High',
    status: 'Pending',
    dueDate: gap.dueDate,
    driverName: gap.driverName
  }));

  const actionQueue = [...taskQueue, ...inspectionQueue, ...requiredDocQueue].sort((a, b) => {
    const rank = { High: 0, Medium: 1, Low: 2 };
    if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
    return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
  });

  return {
    openComplianceTasks: openTasks.length,
    overdueRemediations,
    expiringCredentials,
    requiredDocumentGaps,
    actionQueue
  };
}
