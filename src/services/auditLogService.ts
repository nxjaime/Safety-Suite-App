import { supabase, getCurrentOrganization } from '../lib/supabase';

export type AuditAction =
  | 'user.role_changed'
  | 'user.invited'
  | 'user.deactivated'
  | 'user.reactivated'
  | 'org.settings_updated'
  | 'org.carrier_saved'
  | 'admin.data_created'
  | 'admin.data_deleted'
  | 'admin.retention_executed'
  | 'feedback.escalated'
  | 'feedback.status_changed'
  | 'support.ticket_created'
  | 'support.ticket_resolved'
  | 'driver.role_changed'
  | 'work_order.closeout_updated'
  | 'coaching.plan_state_changed';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  severity: AuditSeverity;
  actorId: string;
  actorEmail: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  details: Record<string, unknown>;
  organizationId: string | null;
  createdAt: string;
}

const SEVERITY_MAP: Record<AuditAction, AuditSeverity> = {
  'user.role_changed': 'warning',
  'user.invited': 'info',
  'user.deactivated': 'warning',
  'user.reactivated': 'info',
  'org.settings_updated': 'info',
  'org.carrier_saved': 'info',
  'admin.data_created': 'info',
  'admin.data_deleted': 'warning',
  'admin.retention_executed': 'critical',
  'feedback.escalated': 'warning',
  'feedback.status_changed': 'info',
  'support.ticket_created': 'info',
  'support.ticket_resolved': 'info',
  'driver.role_changed': 'warning',
  'work_order.closeout_updated': 'info',
  'coaching.plan_state_changed': 'warning',
};

const mapRow = (row: any): AuditLogEntry => ({
  id: row.id,
  action: row.action,
  severity: row.severity || 'info',
  actorId: row.actor_id || '',
  actorEmail: row.actor_email || '',
  targetType: row.target_type || '',
  targetId: row.target_id || '',
  targetLabel: row.target_label || '',
  details: row.details || {},
  organizationId: row.organization_id || null,
  createdAt: row.created_at,
});

const csvEscape = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const auditLogService = {
  async recordMutation(input: {
    action: AuditAction;
    targetType: string;
    targetId: string;
    targetLabel: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogEntry | null> {
    return this.log({
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      details: { before: input.before || {}, after: input.after || {}, ...input.metadata },
    });
  },

  async log(input: {
    action: AuditAction;
    targetType: string;
    targetId: string;
    targetLabel: string;
    details?: Record<string, unknown>;
  }): Promise<AuditLogEntry | null> {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    const orgId = await getCurrentOrganization();

    const severity = SEVERITY_MAP[input.action] || 'info';

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{
        action: input.action,
        severity,
        actor_id: user?.id || 'system',
        actor_email: user?.email || 'system',
        target_type: input.targetType,
        target_id: input.targetId,
        target_label: input.targetLabel,
        details: input.details || {},
        organization_id: orgId,
      }])
      .select()
      .single();

    if (error) {
      console.error('Audit log write failed:', error);
      return null;
    }

    return mapRow(data);
  },

  async listLogs(options?: {
    limit?: number;
    action?: AuditAction;
    severity?: AuditSeverity;
  }): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 100);

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.severity) {
      query = query.eq('severity', options.severity);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(mapRow);
  },

  async getLogsByTarget(targetType: string, targetId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(mapRow);
  },

  async generateComplianceReport(input: {
    entityType: string;
    entityId?: string;
    startDate: string;
    endDate: string;
    format: 'csv';
  }): Promise<string> {
    const logs = input.entityId
      ? await this.getLogsByTarget(input.entityType, input.entityId)
      : await this.listLogs({ limit: 500 });
    const filtered = logs.filter((entry) => entry.createdAt >= `${input.startDate}T00:00:00.000Z` && entry.createdAt <= `${input.endDate}T23:59:59.999Z`);
    const rows = [
      ['Action', 'Severity', 'Actor', 'Target', 'Created At', 'Before', 'After'],
      ...filtered.map((log) => [
        log.action,
        log.severity,
        log.actorEmail,
        log.targetLabel,
        log.createdAt,
        JSON.stringify((log.details as any)?.before ?? {}),
        JSON.stringify((log.details as any)?.after ?? {}),
      ]),
    ];
    return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  },

  severityForAction(action: AuditAction): AuditSeverity {
    return SEVERITY_MAP[action] || 'info';
  },
};
