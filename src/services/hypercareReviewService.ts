import { canManageHypercare, type ProfileRole } from './authorizationService';

const HYPERCARE_REVIEWS_KEY = 'hypercare_daily_reviews_v1';
const HYPERCARE_REVIEW_AUDIT_KEY = 'hypercare_daily_review_audit_v1';

export type HypercareReviewWindow = 'AM' | 'PM';
export type HypercareReviewStatus = 'Draft' | 'Published';
export type HypercareReviewHealth = 'Stable' | 'Monitor' | 'Escalate';
export type HypercareCohortDecision = 'Proceed' | 'Hold' | 'Escalate';

export interface HypercareReview {
  cohortDecision: HypercareCohortDecision;
  createdAt: string;
  id: string;
  incidentSummary: string;
  mitigationActions: string;
  overallHealth: HypercareReviewHealth;
  owner: string;
  publishedAt?: string;
  reviewDate: string;
  reviewWindow: HypercareReviewWindow;
  status: HypercareReviewStatus;
  topRisks: string;
}

export interface HypercareReviewAuditEntry {
  action: 'review_created' | 'review_published';
  at: string;
  id: string;
  role: ProfileRole;
  targetId: string;
}

const safeParse = <T>(raw: string | null): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readReviews = (): HypercareReview[] => {
  return safeParse<HypercareReview>(localStorage.getItem(HYPERCARE_REVIEWS_KEY));
};

const writeReviews = (reviews: HypercareReview[]) => {
  localStorage.setItem(HYPERCARE_REVIEWS_KEY, JSON.stringify(reviews));
};

const readAuditEntries = (): HypercareReviewAuditEntry[] => {
  return safeParse<HypercareReviewAuditEntry>(localStorage.getItem(HYPERCARE_REVIEW_AUDIT_KEY));
};

const writeAuditEntries = (entries: HypercareReviewAuditEntry[]) => {
  localStorage.setItem(HYPERCARE_REVIEW_AUDIT_KEY, JSON.stringify(entries));
};

const nextId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const ensureCanMutate = (role: ProfileRole) => {
  if (!canManageHypercare(role)) {
    throw new Error('Insufficient permissions for this action');
  }
};

const validateRequired = (value: string, label: string) => {
  if (!value.trim()) {
    throw new Error(`${label} is required`);
  }
};

const appendAudit = (entry: Omit<HypercareReviewAuditEntry, 'id' | 'at'>) => {
  const next: HypercareReviewAuditEntry = {
    ...entry,
    at: new Date().toISOString(),
    id: nextId('review_audit')
  };
  writeAuditEntries([next, ...readAuditEntries()].slice(0, 250));
};

const reviewWindowRank: Record<HypercareReviewWindow, number> = {
  AM: 0,
  PM: 1
};

export const hypercareReviewService = {
  listReviews(): HypercareReview[] {
    return readReviews().sort((a, b) => {
      const byDate = b.reviewDate.localeCompare(a.reviewDate);
      if (byDate !== 0) return byDate;

      const byWindow = reviewWindowRank[b.reviewWindow] - reviewWindowRank[a.reviewWindow];
      if (byWindow !== 0) return byWindow;

      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  createReview(input: {
    cohortDecision: HypercareCohortDecision;
    incidentSummary: string;
    mitigationActions: string;
    overallHealth: HypercareReviewHealth;
    owner: string;
    reviewDate: string;
    reviewWindow: HypercareReviewWindow;
    role: ProfileRole;
    topRisks: string;
  }): HypercareReview {
    ensureCanMutate(input.role);

    validateRequired(input.reviewDate, 'Review date');
    validateRequired(input.owner, 'Owner');
    validateRequired(input.incidentSummary, 'Incident summary');
    validateRequired(input.topRisks, 'Top risks');
    validateRequired(input.mitigationActions, 'Mitigation actions');

    const next: HypercareReview = {
      cohortDecision: input.cohortDecision,
      createdAt: new Date().toISOString(),
      id: nextId('review'),
      incidentSummary: input.incidentSummary.trim(),
      mitigationActions: input.mitigationActions.trim(),
      overallHealth: input.overallHealth,
      owner: input.owner.trim(),
      reviewDate: input.reviewDate,
      reviewWindow: input.reviewWindow,
      status: 'Draft',
      topRisks: input.topRisks.trim()
    };

    writeReviews([next, ...readReviews()]);
    appendAudit({
      action: 'review_created',
      role: input.role,
      targetId: next.id
    });

    return next;
  },

  publishReview(id: string, role: ProfileRole): void {
    ensureCanMutate(role);

    const existing = readReviews().find((review) => review.id === id);
    if (!existing) {
      throw new Error('Review not found');
    }

    const publishedAt = new Date().toISOString();
    const reviews = readReviews().map((review) => {
      if (review.id !== id) return review;
      return {
        ...review,
        publishedAt,
        status: 'Published' as const
      };
    });

    writeReviews(reviews);
    appendAudit({
      action: 'review_published',
      role,
      targetId: id
    });
  },

  listAuditEntries(): HypercareReviewAuditEntry[] {
    return readAuditEntries();
  }
};
