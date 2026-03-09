import { describe, expect, it, vi, beforeEach } from 'vitest';
import { formatBadgeCount } from '../services/notificationService';

const mockOrgId = vi.hoisted(() => 'org-123');
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
const inFiveDays = new Date(Date.now() + 5 * 86_400_000).toISOString().split('T')[0];
const inTwentyDays = new Date(Date.now() + 20 * 86_400_000).toISOString().split('T')[0];

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
  getCurrentOrganization: vi.fn().mockResolvedValue(mockOrgId),
}));

vi.mock('../services/documentService', () => ({
  documentService: {
    listDocuments: vi.fn().mockResolvedValue([]),
    getExpiringDocuments: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('../services/trainingService', () => ({
  trainingService: {
    getUnreviewedCompletions: vi.fn().mockResolvedValue([]),
  },
}));

import { supabase } from '../lib/supabase';
import { documentService } from '../services/documentService';
import { trainingService } from '../services/trainingService';

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
const mockListDocs = documentService.listDocuments as ReturnType<typeof vi.fn>;
const mockGetExpiring = documentService.getExpiringDocuments as ReturnType<typeof vi.fn>;
const mockGetUnreviewed = trainingService.getUnreviewedCompletions as ReturnType<typeof vi.fn>;

function buildTasksChain(rows: object[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return chain;
}

function buildCoachingChain(rows: object[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  // last .eq returns the promise
  chain.eq.mockImplementation(function (this: typeof chain) {
    return { ...this, then: undefined };
  });
  // override to return the resolved value on last call
  let callCount = 0;
  chain.eq = vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount >= 2) return Promise.resolve({ data: rows, error: null });
    return chain;
  });
  return chain;
}

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListDocs.mockResolvedValue([]);
    mockGetExpiring.mockReturnValue([]);
    mockGetUnreviewed.mockResolvedValue([]);
  });

  it('returns overdue_task notifications with correct severity', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return buildTasksChain([
          { id: 't1', title: 'Fix brake lights', due_date: yesterday, priority: 'High', status: 'Pending' },
          { id: 't2', title: 'Update logs', due_date: yesterday, priority: 'Medium', status: 'In Progress' },
        ]);
      }
      return buildCoachingChain([]);
    });

    const { notificationService } = await import('../services/notificationService');
    const result = await notificationService.getNotifications();
    const tasks = result.filter((n) => n.type === 'overdue_task');

    expect(tasks).toHaveLength(2);
    expect(tasks.find((n) => n.id === 'task-t1')?.severity).toBe('critical');
    expect(tasks.find((n) => n.id === 'task-t2')?.severity).toBe('warning');
    expect(tasks[0].href).toBe('/tasks');
  });

  it('returns expiring_document notifications grouped by severity', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'tasks') return buildTasksChain([]);
      return buildCoachingChain([]);
    });
    const docRows = [
      { id: 'd1', name: 'CDL License', expirationDate: inFiveDays },
      { id: 'd2', name: 'Medical Cert', expirationDate: inTwentyDays },
    ];
    mockListDocs.mockResolvedValue(docRows);
    mockGetExpiring.mockReturnValue(docRows);

    const { notificationService } = await import('../services/notificationService');
    const result = await notificationService.getNotifications();
    const docs = result.filter((n) => n.type === 'expiring_document');

    expect(docs).toHaveLength(2);
    expect(docs.find((n) => n.id === 'doc-d1')?.severity).toBe('critical');
    expect(docs.find((n) => n.id === 'doc-d2')?.severity).toBe('warning');
    expect(docs[0].href).toBe('/documents');
  });

  it('returns unreviewed_training notifications with info severity', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'tasks') return buildTasksChain([]);
      return buildCoachingChain([]);
    });
    mockGetUnreviewed.mockResolvedValue([
      { id: 'a1', module_name: 'HOS Basics', completed_at: today },
      { id: 'a2', module_name: 'DVIR 101', completed_at: today },
    ]);

    const { notificationService } = await import('../services/notificationService');
    const result = await notificationService.getNotifications();
    const training = result.filter((n) => n.type === 'unreviewed_training');

    expect(training).toHaveLength(2);
    expect(training[0].severity).toBe('info');
    expect(training[0].href).toBe('/training');
  });

  it('returns pending_checkin only for past-due Pending check-ins on active plans', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'tasks') return buildTasksChain([]);
      // coaching_plans
      return buildCoachingChain([
        {
          id: 'plan-1',
          driver_id: 'drv-1',
          weekly_check_ins: [
            { week: 1, status: 'Pending', date: yesterday, assignedTo: 'Coach A' },
            { week: 2, status: 'Complete', date: yesterday, assignedTo: 'Coach A' },
          ],
        },
      ]);
    });

    const { notificationService } = await import('../services/notificationService');
    const result = await notificationService.getNotifications();
    const checkIns = result.filter((n) => n.type === 'pending_checkin');

    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].id).toBe('checkin-plan-1-1');
    expect(checkIns[0].href).toBe('/safety');
  });

  it('returns empty array when all sources error', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      eq: vi.fn().mockRejectedValue(new Error('DB down')),
    }));
    mockListDocs.mockRejectedValue(new Error('DB down'));
    mockGetUnreviewed.mockRejectedValue(new Error('DB down'));

    const { notificationService } = await import('../services/notificationService');
    const result = await notificationService.getNotifications();

    expect(result).toEqual([]);
  });

  describe('formatBadgeCount', () => {
    it('returns the number as string when <= 99', () => {
      expect(formatBadgeCount(1)).toBe('1');
      expect(formatBadgeCount(99)).toBe('99');
    });

    it('returns 99+ when count exceeds 99', () => {
      expect(formatBadgeCount(100)).toBe('99+');
      expect(formatBadgeCount(999)).toBe('99+');
    });
  });
});
