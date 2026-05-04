import { getCurrentOrganization } from '../lib/supabase';

export type OnboardingStepId = 'org_config' | 'invite_users' | 'add_asset' | 'add_driver' | 'configure_notifications';

export interface OnboardingProgress {
  organizationId: string | null;
  completedSteps: OnboardingStepId[];
  skippedSteps: OnboardingStepId[];
  updatedAt: string;
}

export interface OnboardingProvisioningRecord {
  id: string;
  organizationName: string;
  planTier: 'starter' | 'growth' | 'enterprise';
  seedDemoData: boolean;
  createdAt: string;
}

const PROGRESS_KEY = 'safety-suite.onboarding-progress';
const PROVISIONING_KEY = 'safety-suite.onboarding-provisioning';

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
};

const readProgressStore = (): OnboardingProgress[] => {
  if (typeof window === 'undefined') return [];
  return safeParse<OnboardingProgress[]>(window.localStorage.getItem(PROGRESS_KEY), []);
};

const writeProgressStore = (items: OnboardingProgress[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(items));
};

const readProvisioningStore = (): OnboardingProvisioningRecord[] => {
  if (typeof window === 'undefined') return [];
  return safeParse<OnboardingProvisioningRecord[]>(window.localStorage.getItem(PROVISIONING_KEY), []);
};

const writeProvisioningStore = (items: OnboardingProvisioningRecord[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROVISIONING_KEY, JSON.stringify(items));
};

export const onboardingService = {
  async getProgress(): Promise<OnboardingProgress> {
    const organizationId = await getCurrentOrganization();
    const stored = readProgressStore().find((item) => item.organizationId === organizationId);
    return stored || { organizationId, completedSteps: [], skippedSteps: [], updatedAt: new Date().toISOString() };
  },
  async saveProgress(next: Partial<OnboardingProgress> & { completedSteps?: OnboardingStepId[]; skippedSteps?: OnboardingStepId[] }): Promise<OnboardingProgress> {
    const organizationId = await getCurrentOrganization();
    const current = await this.getProgress();
    const merged: OnboardingProgress = {
      organizationId,
      completedSteps: next.completedSteps ?? current.completedSteps,
      skippedSteps: next.skippedSteps ?? current.skippedSteps,
      updatedAt: new Date().toISOString(),
    };
    const store = readProgressStore().filter((item) => item.organizationId !== organizationId);
    writeProgressStore([merged, ...store]);
    return merged;
  },
  async completeStep(step: OnboardingStepId): Promise<OnboardingProgress> {
    const current = await this.getProgress();
    if (current.completedSteps.includes(step)) return current;
    return this.saveProgress({ completedSteps: [...current.completedSteps, step] });
  },
  async skipStep(step: OnboardingStepId): Promise<OnboardingProgress> {
    const current = await this.getProgress();
    if (current.skippedSteps.includes(step)) return current;
    return this.saveProgress({ skippedSteps: [...current.skippedSteps, step] });
  },
  async createOrgProvisioningRecord(organizationName: string, planTier: OnboardingProvisioningRecord['planTier'], seedDemoData: boolean) {
    const record: OnboardingProvisioningRecord = { id: crypto.randomUUID(), organizationName: organizationName.trim(), planTier, seedDemoData, createdAt: new Date().toISOString() };
    const store = readProvisioningStore();
    writeProvisioningStore([record, ...store]);
    return record;
  },
  async listProvisioningRecords(): Promise<OnboardingProvisioningRecord[]> {
    return readProvisioningStore();
  },
  async getCompletionSnapshot() {
    const progress = await this.getProgress();
    const totalSteps = 5;
    const completedCount = progress.completedSteps.length;
    return { progress, totalSteps, completedCount, percentage: Math.round((completedCount / totalSteps) * 100) };
  },
};
