import { supabase, getCurrentOrganization } from '../lib/supabase';
import { documentService } from './documentService';
import { trainingService } from './trainingService';
import type { WeeklyCheckIn } from '../types';

export interface Notification {
  id: string;
  type: 'overdue_task' | 'expiring_document' | 'unreviewed_training' | 'pending_checkin';
  title: string;
  detail: string;
  href: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

export function formatBadgeCount(n: number): string {
  return n > 99 ? '99+' : String(n);
}

async function collectOverdueTasks(): Promise<Notification[]> {
  const orgId = await getCurrentOrganization();
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('tasks')
    .select('id, title, due_date, priority, status')
    .neq('status', 'Completed')
    .lt('due_date', today);

  if (orgId) query = query.eq('organization_id', orgId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((t) => ({
    id: `task-${t.id}`,
    type: 'overdue_task' as const,
    title: 'Overdue task',
    detail: t.title,
    href: '/tasks',
    severity: t.priority === 'High' ? 'critical' : 'warning',
    createdAt: t.due_date,
  }));
}

async function collectExpiringDocuments(): Promise<Notification[]> {
  const docs = await documentService.listDocuments();
  const expiring = documentService.getExpiringDocuments(docs, 30);
  const today = new Date().toISOString().split('T')[0];

  return expiring.map((doc) => {
    const expirationDate = String((doc.metadata || {}).expirationDate || '');
    const daysOut = expirationDate
      ? Math.floor(
          (new Date(expirationDate).getTime() - new Date(today).getTime()) /
            (24 * 60 * 60 * 1000)
        )
      : 30;

    return {
      id: `doc-${doc.id}`,
      type: 'expiring_document' as const,
      title: 'Document expiring soon',
      detail: doc.name,
      href: '/documents',
      severity: daysOut <= 7 ? 'critical' : 'warning',
      createdAt: expirationDate || today,
    };
  });
}

async function collectUnreviewedTraining(): Promise<Notification[]> {
  const assignments = await trainingService.getUnreviewedCompletions();

  return assignments.map((a) => ({
    id: `training-${a.id}`,
    type: 'unreviewed_training' as const,
    title: 'Training review needed',
    detail: a.module_name,
    href: '/training',
    severity: 'info' as const,
    createdAt: a.completed_at || new Date().toISOString(),
  }));
}

async function collectPendingCheckIns(): Promise<Notification[]> {
  const orgId = await getCurrentOrganization();
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('coaching_plans')
    .select('id, driver_id, weekly_check_ins')
    .eq('status', 'Active');

  if (orgId) query = query.eq('organization_id', orgId);

  const { data, error } = await query;
  if (error) throw error;

  const notifications: Notification[] = [];
  for (const plan of data || []) {
    const checkIns: WeeklyCheckIn[] = Array.isArray(plan.weekly_check_ins)
      ? plan.weekly_check_ins
      : [];

    for (const ci of checkIns) {
      if (ci.status === 'Pending' && ci.date <= today) {
        notifications.push({
          id: `checkin-${plan.id}-${ci.week}`,
          type: 'pending_checkin' as const,
          title: 'Coaching check-in due',
          detail: `Week ${ci.week} — assigned to ${ci.assignedTo}`,
          href: '/safety',
          severity: 'warning',
          createdAt: ci.date,
        });
      }
    }
  }
  return notifications;
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const results = await Promise.allSettled([
      collectOverdueTasks(),
      collectExpiringDocuments(),
      collectUnreviewedTraining(),
      collectPendingCheckIns(),
    ]);

    const all: Notification[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        all.push(...result.value);
      }
    }

    // Sort: critical first, then warning, then info; within tier by createdAt desc
    const order = { critical: 0, warning: 1, info: 2 };
    return all.sort(
      (a, b) =>
        order[a.severity] - order[b.severity] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};
