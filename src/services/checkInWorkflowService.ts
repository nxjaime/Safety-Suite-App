export type CheckInStatus = 'Pending' | 'In Progress' | 'Complete' | 'Missed';

export interface CheckInAuditEntry {
  at: string;
  actor: string;
  field: 'status' | 'notes';
  from: string;
  to: string;
}

export interface CheckInItem {
  week: number;
  assignedTo: string;
  status: CheckInStatus;
  notes: string;
  date: string;
  completedDate?: string;
  auditTrail?: CheckInAuditEntry[];
}

interface ApplyCheckInTransitionInput {
  checkIns: CheckInItem[];
  week: number;
  nextStatus: CheckInStatus;
  notes?: string;
  actor: string;
  now?: Date;
}

const ALLOWED_STATUS_TRANSITIONS: Record<CheckInStatus, CheckInStatus[]> = {
  Pending: ['Pending', 'In Progress', 'Complete', 'Missed'],
  'In Progress': ['In Progress', 'Complete', 'Missed'],
  Complete: ['Complete', 'In Progress'],
  Missed: ['Missed', 'In Progress', 'Complete']
};

export const applyCheckInTransition = ({
  checkIns,
  week,
  nextStatus,
  notes,
  actor,
  now = new Date()
}: ApplyCheckInTransitionInput) => {
  const timestamp = now.toISOString();

  const updated = checkIns.map((checkIn) => {
    if (checkIn.week !== week) return checkIn;

    if (!ALLOWED_STATUS_TRANSITIONS[checkIn.status].includes(nextStatus)) {
      throw new Error(`Invalid check-in transition: ${checkIn.status} -> ${nextStatus}`);
    }

    const auditTrail = checkIn.auditTrail ? [...checkIn.auditTrail] : [];

    if (checkIn.status !== nextStatus) {
      auditTrail.push({
        at: timestamp,
        actor,
        field: 'status',
        from: checkIn.status,
        to: nextStatus
      });
    }

    const nextNotes = notes ?? checkIn.notes ?? '';
    if (nextNotes !== (checkIn.notes ?? '')) {
      auditTrail.push({
        at: timestamp,
        actor,
        field: 'notes',
        from: checkIn.notes ?? '',
        to: nextNotes
      });
    }

    return {
      ...checkIn,
      status: nextStatus,
      notes: nextNotes,
      completedDate: nextStatus === 'Complete' ? now.toLocaleDateString() : undefined,
      auditTrail
    };
  });

  return { updated };
};
