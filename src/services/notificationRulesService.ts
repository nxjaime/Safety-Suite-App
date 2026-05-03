import { supabase, getCurrentOrganization } from '../lib/supabase';
import { canAccessPlatformAdmin, getRoleCapabilities } from './authorizationService';
import type { ProfileRole } from './authorizationService';

export type NotificationRuleType = 'risk_score' | 'overdue_task' | 'pending_checkin' | 'expiring_document';
export type NotificationDeliveryMode = 'in_app' | 'email_digest' | 'both';

export interface NotificationRule {
  id: string;
  organizationId: string;
  type: NotificationRuleType;
  threshold: number;
  createdBy: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  category: NotificationRuleType;
  deliveryMode: NotificationDeliveryMode;
}

export interface NotificationRuleInput {
  type: NotificationRuleType;
  threshold: number;
  active?: boolean;
}

export interface EvaluatedNotificationRule {
  rule: NotificationRule;
  matches: boolean;
  currentValue: number;
}

const RULES_STORAGE_KEY = 'safety-suite.notification-rules';
const PREFERENCES_STORAGE_KEY = 'safety-suite.notification-preferences';

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  { category: 'risk_score', deliveryMode: 'in_app' },
  { category: 'overdue_task', deliveryMode: 'both' },
  { category: 'pending_checkin', deliveryMode: 'in_app' },
  { category: 'expiring_document', deliveryMode: 'email_digest' },
];

const getStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

const readJson = <T>(key: string, fallback: T): T => {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
};

const resolveOrganizationId = async () => (await getCurrentOrganization()) || 'global';

const sortRules = (rules: NotificationRule[]) =>
  [...rules].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const notificationRulesService = {
  async listRules(): Promise<NotificationRule[]> {
    const orgId = await resolveOrganizationId();
    const { data, error } = await supabase
      .from('notification_rules')
      .select('id, organization_id, type, threshold, created_by, active, created_at, updated_at')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      return sortRules(
        data.map((row: any) => ({
          id: row.id,
          organizationId: row.organization_id,
          type: row.type,
          threshold: row.threshold,
          createdBy: row.created_by,
          active: row.active ?? true,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))
      );
    }

    return sortRules((readJson<Record<string, NotificationRule[]>>(RULES_STORAGE_KEY, {})[orgId] || []));
  },

  async createRule(role: ProfileRole, input: NotificationRuleInput): Promise<NotificationRule> {
    if (!canAccessPlatformAdmin(role) && !getRoleCapabilities(role).canManageOrgSettings) {
      throw new Error('Insufficient permissions');
    }
    const orgId = await resolveOrganizationId();
    const now = new Date().toISOString();
    const rule: NotificationRule = {
      id: crypto.randomUUID(),
      organizationId: orgId,
      type: input.type,
      threshold: input.threshold,
      createdBy: role,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const all = readJson<Record<string, NotificationRule[]>>(RULES_STORAGE_KEY, {});
    all[orgId] = sortRules([...(all[orgId] || []), rule]);
    writeJson(RULES_STORAGE_KEY, all);
    return rule;
  },

  async updateRule(ruleId: string, patch: Partial<NotificationRule>): Promise<NotificationRule> {
    const orgId = await resolveOrganizationId();
    const all = readJson<Record<string, NotificationRule[]>>(RULES_STORAGE_KEY, {});
    const rules = all[orgId] || [];
    const index = rules.findIndex((rule) => rule.id === ruleId);
    if (index === -1) throw new Error('Rule not found');
    const updated = { ...rules[index], ...patch, updatedAt: new Date().toISOString() };
    all[orgId] = sortRules([...rules.slice(0, index), updated, ...rules.slice(index + 1)]);
    writeJson(RULES_STORAGE_KEY, all);
    return updated;
  },

  async deleteRule(ruleId: string): Promise<void> {
    const orgId = await resolveOrganizationId();
    const all = readJson<Record<string, NotificationRule[]>>(RULES_STORAGE_KEY, {});
    all[orgId] = (all[orgId] || []).filter((rule) => rule.id !== ruleId);
    writeJson(RULES_STORAGE_KEY, all);
  },

  async listPreferences(): Promise<NotificationPreference[]> {
    return readJson<NotificationPreference[]>(PREFERENCES_STORAGE_KEY, DEFAULT_PREFERENCES);
  },

  async savePreferences(preferences: NotificationPreference[]): Promise<NotificationPreference[]> {
    writeJson(PREFERENCES_STORAGE_KEY, preferences);
    return preferences;
  },

  evaluateRules(rules: NotificationRule[], currentValues: Record<NotificationRuleType, number>): EvaluatedNotificationRule[] {
    return rules.map((rule) => ({
      rule,
      currentValue: currentValues[rule.type] ?? 0,
      matches: (currentValues[rule.type] ?? 0) >= rule.threshold,
    }));
  },

  async sendEmailDigest(notifications: { id: string; title: string; detail: string; createdAt: string }[]) {
    const batches = notifications.reduce<Record<string, typeof notifications>>((acc, item) => {
      const day = item.createdAt.split('T')[0];
      acc[day] = acc[day] || [];
      acc[day].push(item);
      return acc;
    }, {});

    return Object.entries(batches).map(([day, items]) => ({
      day,
      count: items.length,
      summary: items.map((item) => `${item.title}: ${item.detail}`).join(' | '),
    }));
  },
};
