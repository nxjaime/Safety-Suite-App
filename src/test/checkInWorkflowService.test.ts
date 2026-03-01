import { describe, expect, it } from 'vitest';
import {
  applyCheckInTransition,
  type CheckInItem,
  type CheckInStatus
} from '../services/checkInWorkflowService';

const buildCheckIns = (): CheckInItem[] => ([
  {
    week: 1,
    assignedTo: 'Safety Manager',
    status: 'Pending',
    notes: '',
    date: '2026-03-01'
  }
]);

describe('checkInWorkflowService', () => {
  it('allows Pending -> In Progress and writes an audit entry', () => {
    const result = applyCheckInTransition({
      checkIns: buildCheckIns(),
      week: 1,
      nextStatus: 'In Progress',
      actor: 'tester'
    });

    expect(result.updated[0].status).toBe('In Progress');
    expect(result.updated[0].auditTrail?.length).toBe(1);
    expect(result.updated[0].auditTrail?.[0].to).toBe('In Progress');
  });

  it('blocks invalid transition Complete -> Pending', () => {
    const complete: CheckInItem[] = [{
      week: 1,
      assignedTo: 'Safety Manager',
      status: 'Complete',
      notes: '',
      date: '2026-03-01'
    }];

    expect(() => applyCheckInTransition({
      checkIns: complete,
      week: 1,
      nextStatus: 'Pending',
      actor: 'tester'
    })).toThrow(/Invalid check-in transition/);
  });

  it('updates notes without forcing a status change', () => {
    const result = applyCheckInTransition({
      checkIns: buildCheckIns(),
      week: 1,
      nextStatus: 'Pending' as CheckInStatus,
      notes: 'Discussed braking trend',
      actor: 'tester'
    });

    expect(result.updated[0].notes).toBe('Discussed braking trend');
    expect(result.updated[0].status).toBe('Pending');
    expect(result.updated[0].auditTrail?.length).toBe(1);
    expect(result.updated[0].auditTrail?.[0].field).toBe('notes');
  });
});
