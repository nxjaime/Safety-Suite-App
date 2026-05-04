import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Globe,
  History,
  Mail,
  MessageSquare,
  RefreshCw,
  Settings2,
  Shield,
  ShieldAlert,
  Ticket,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Bell,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { orgManagementService, type OrgConfig, type OrgUser } from '../services/orgManagementService';
import { auditLogService, type AuditLogEntry, type AuditSeverity } from '../services/auditLogService';
import { notificationRulesService, type NotificationRule } from '../services/notificationRulesService';
import { webhookService, type WebhookDeliveryLog, type WebhookRegistration, type WebhookEventType } from '../services/webhookService';
import {
  supportTicketService,
  type SupportTicket,
  type SupportTicketStatus,
} from '../services/supportTicketService';
import { retentionPolicyService, type RetentionSnapshot } from '../services/retentionPolicyService';
import { onboardingService } from '../services/onboardingService';
import { telematicsService, type TelematicsHealthSummary } from '../services/telematicsService';
import type { ProfileRole } from '../services/authorizationService';
import Modal from '../components/UI/Modal';

type AdminTab = 'users' | 'org' | 'audit' | 'support' | 'telematics' | 'retention' | 'notifications' | 'integrations';

const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_COLORS: Record<SupportTicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  waiting_on_customer: 'bg-purple-100 text-purple-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-100 text-slate-600',
};

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  full: 'Full Access',
  safety: 'Safety Manager',
  coaching: 'Coaching Manager',
  maintenance: 'Maintenance Manager',
  readonly: 'Read Only',
};

const ASSIGNABLE_ROLES: ProfileRole[] = [
  'full',
  'safety',
  'coaching',
  'maintenance',
  'readonly',
];

const formatDate = (iso: string | null) => {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const AdminDashboard: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Users
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Org Config
  const [, setOrgConfig] = useState<OrgConfig | null>(null);
  const [orgForm, setOrgForm] = useState<Partial<OrgConfig>>({});
  const [orgSaving, setOrgSaving] = useState(false);

  // Audit
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState<'all' | AuditSeverity>('all');
  const [auditExporting, setAuditExporting] = useState(false);
  const [reportEntityType, setReportEntityType] = useState<'driver' | 'equipment' | 'document'>('driver');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [retentionArchiving, setRetentionArchiving] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'onboarding' as const,
    priority: 'medium' as const,
  });

  // Telematics
  const [telematicsHealth, setTelematicsHealth] = useState<TelematicsHealthSummary[]>([]);
  const [telematicsLoading, setTelematicsLoading] = useState(false);

  // Retention
  const [retention, setRetention] = useState<RetentionSnapshot | null>(null);
  const [retentionDays, setRetentionDays] = useState(365);
  const [retentionLoading, setRetentionLoading] = useState(false);

  // Role change modal
  const [roleChangeTarget, setRoleChangeTarget] = useState<OrgUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<ProfileRole>('readonly');
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRegistration[]>([]);
  const [deliveryLog, setDeliveryLog] = useState<WebhookDeliveryLog[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    endpointUrl: 'https://example.com/webhooks/safety-suite',
    secret: 'integration-secret',
    eventTypes: ['inspection_failed', 'work_order_closed'] as WebhookEventType[],
  });
  const [onboardingSummary, setOnboardingSummary] = useState({ completedCount: 0, totalSteps: 5, percentage: 0 });

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await orgManagementService.listUsers(role);
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadOrgConfig = async () => {
    try {
      const config = await orgManagementService.getOrgConfig();
      setOrgConfig(config);
      setOrgForm(config || orgManagementService.getDefaultConfig());
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await auditLogService.listLogs({
        limit: 200,
        severity: auditFilter === 'all' ? undefined : auditFilter,
      });
      setAuditLogs(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const data = await supportTicketService.listTickets(role);
      setTickets(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadTelematicsHealth = async () => {
    setTelematicsLoading(true);
    try {
      const summaries = await telematicsService.getIngestionHealthSummaries();
      setTelematicsHealth(summaries);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load telematics ingestion health');
    } finally {
      setTelematicsLoading(false);
    }
  };

  const loadRetention = async () => {
    setRetentionLoading(true);
    try {
      const snapshot = await retentionPolicyService.getRetentionSnapshot(retentionDays);
      setRetention(snapshot);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load retention data');
    } finally {
      setRetentionLoading(false);
    }
  };

  const loadNotificationRules = async () => {
    try {
      const rules = await notificationRulesService.listRules();
      setNotificationRules(rules);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOnboardingSummary = async () => {
    try { setOnboardingSummary(await onboardingService.getCompletionSnapshot()); } catch (err) { console.error(err); }
  };

  const loadIntegrations = async () => {
    setIntegrationsLoading(true);
    try {
      const [registeredWebhooks, logs] = await Promise.all([
        webhookService.listWebhooks(),
        webhookService.listDeliveryLog(),
      ]);
      setWebhooks(registeredWebhooks);
      setDeliveryLog(logs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load integrations');
    } finally {
      setIntegrationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'org') { loadOrgConfig(); loadOnboardingSummary(); }
    else if (activeTab === 'audit') loadAuditLogs();
    else if (activeTab === 'support') loadTickets();
    else if (activeTab === 'telematics') loadTelematicsHealth();
    else if (activeTab === 'retention') loadRetention();
    else if (activeTab === 'notifications') loadNotificationRules();
    else if (activeTab === 'integrations') loadIntegrations();
  }, [activeTab, auditFilter, retentionDays]);

  // ── User actions ──
  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;
    try {
      await orgManagementService.updateUserRole(role, roleChangeTarget.id, selectedNewRole, roleChangeTarget.email);
      toast.success(`Role updated to ${ROLE_LABELS[selectedNewRole]}`);
      setRoleChangeTarget(null);
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update role');
    }
  };

  const handleToggleStatus = async (user: OrgUser) => {
    try {
      if (user.status === 'active') {
        await orgManagementService.deactivateUser(role, user.id, user.email);
        toast.success(`${user.fullName || user.email} deactivated`);
      } else {
        await orgManagementService.reactivateUser(role, user.id, user.email);
        toast.success(`${user.fullName || user.email} reactivated`);
      }
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user status');
    }
  };

  // ── Org config save ──
  const handleSaveOrgConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSaving(true);
    try {
      await orgManagementService.saveOrgConfig(role, orgForm);
      toast.success('Organization settings saved');
      loadOrgConfig();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setOrgSaving(false);
    }
  };

  // ── Support ticket creation ──
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    try {
      const ticket = await supportTicketService.createTicket(newTicket);
      setTickets((prev) => [ticket, ...prev]);
      setIsNewTicketOpen(false);
      setNewTicket({ title: '', description: '', category: 'onboarding', priority: 'medium' });
      toast.success('Support ticket created');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create ticket');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await supportTicketService.updateTicketStatus(role, ticketId, 'resolved');
      toast.success('Ticket resolved');
      loadTickets();
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve ticket');
    }
  };

  // ── Audit export ──
  const exportAudit = async () => {
    if (auditLogs.length === 0) {
      toast.error('No audit logs to export');
      return;
    }
    setAuditExporting(true);
    try {
      const csv = await auditLogService.generateComplianceReport({
        entityType: reportEntityType,
        startDate: reportStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: reportEndDate || new Date().toISOString().split('T')[0],
        format: 'csv',
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance_report_${reportEntityType}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setAuditExporting(false);
    }
  };


  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'User Management', icon: <Users className="h-4 w-4" /> },
    { id: 'org', label: 'Organization', icon: <Building2 className="h-4 w-4" /> },
    { id: 'audit', label: 'Audit Log', icon: <History className="h-4 w-4" /> },
    { id: 'support', label: 'Support Tickets', icon: <Ticket className="h-4 w-4" /> },
    { id: 'telematics', label: 'Telematics', icon: <Activity className="h-4 w-4" /> },
    { id: 'retention', label: 'Data Retention', icon: <FileText className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notification Rules', icon: <Bell className="h-4 w-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Admin &amp; Enterprise Controls</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage users, organization settings, audit trail, support workflows, and data retention.
            </p>
          </div>
          <div className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            <Shield className="mr-2 h-4 w-4" />
            Admin Access
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'inline-flex items-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ USERS TAB ═══ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} in organization</p>
            <button onClick={loadUsers} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Sign-in</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {usersLoading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">Loading users...</td>
                  </tr>
                )}
                {!usersLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">No users found.</td>
                  </tr>
                )}
                {!usersLoading && users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                          {(u.fullName || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{u.fullName || 'Unnamed'}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        u.status === 'invited' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-600',
                      )}>
                        {u.status === 'active' && <UserCheck className="mr-1 h-3 w-3" />}
                        {u.status === 'deactivated' && <UserMinus className="mr-1 h-3 w-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(u.lastSignIn)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setRoleChangeTarget(u);
                            setSelectedNewRole(u.role as ProfileRole);
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          title="Change role"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={clsx(
                            'rounded-lg border px-3 py-1.5 text-xs font-medium',
                            u.status === 'active'
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
                          )}
                          title={u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        >
                          {u.status === 'active' ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ORG TAB ═══ */}
      {activeTab === 'org' && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Org setup completion</h3>
                <p className="text-sm text-slate-600">{onboardingSummary.completedCount}/{onboardingSummary.totalSteps} steps complete ({onboardingSummary.percentage}%).</p>
              </div>
              <button onClick={loadOnboardingSummary} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700">Refresh</button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Organization Settings</h3>
                <p className="text-sm text-slate-500">Configure your organization&apos;s preferences and policies.</p>
              </div>
            </div>

            <form onSubmit={handleSaveOrgConfig} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={orgForm.companyName || ''}
                    onChange={(e) => setOrgForm({ ...orgForm, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Primary Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={orgForm.primaryContactEmail || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, primaryContactEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Timezone</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={orgForm.timezone || 'America/Chicago'}
                      onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                    >
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Retention Period (days)</label>
                  <input
                    type="number"
                    min={90}
                    max={2555}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={orgForm.retentionDays ?? 365}
                    onChange={(e) => setOrgForm({ ...orgForm, retentionDays: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notification Preferences</h4>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={orgForm.enableEmailNotifications ?? true}
                    onChange={(e) => setOrgForm({ ...orgForm, enableEmailNotifications: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Enable email notifications</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={orgForm.enableWeeklyDigest ?? false}
                    onChange={(e) => setOrgForm({ ...orgForm, enableWeeklyDigest: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Enable weekly digest email</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={orgSaving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {orgSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ AUDIT TAB ═══ */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Filter:</span>
              {(['all', 'info', 'warning', 'critical'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setAuditFilter(sev)}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    auditFilter === sev
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-300 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={loadAuditLogs} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </button>
              <button onClick={exportAudit} disabled={auditExporting} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <Download className="mr-2 h-4 w-4" /> {auditExporting ? 'Generating...' : 'Export Report'}
              </button>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Entity</span>
              <select value={reportEntityType} onChange={(e) => setReportEntityType(e.target.value as any)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="driver">Driver</option>
                <option value="equipment">Asset</option>
                <option value="document">Document</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</span>
              <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">End date</span>
              <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <div className="space-y-2">
            {auditLoading && <p className="py-8 text-center text-sm text-slate-500">Loading audit trail...</p>}
            {!auditLoading && auditLogs.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">No audit log entries found.</p>
            )}
            {!auditLoading && auditLogs.map((log) => (
              <div key={log.id} className={clsx('flex items-start gap-3 rounded-xl border p-4', SEVERITY_COLORS[log.severity])}>
                <div className="mt-0.5">
                  {log.severity === 'critical' ? <ShieldAlert className="h-4 w-4" /> :
                   log.severity === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                   <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{log.action.replace(/\./g, ' → ')}</span>
                    <span className="text-xs opacity-70">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-xs">
                    <span className="font-medium">{log.actorEmail}</span> on{' '}
                    <span className="font-medium">{log.targetLabel}</span>
                    {log.targetType && <span className="opacity-70"> ({log.targetType})</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SUPPORT TAB ═══ */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {(['open', 'in_progress', 'resolved'] as SupportTicketStatus[]).map((s) => {
                const count = tickets.filter((t) => t.status === s).length;
                return (
                  <div key={s} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
                    <div className="text-lg font-bold text-slate-900">{count}</div>
                    <div className="text-xs capitalize text-slate-500">{s.replace(/_/g, ' ')}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setIsNewTicketOpen(true)} className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              <MessageSquare className="mr-2 h-4 w-4" /> New Ticket
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {ticketsLoading && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">Loading tickets...</td></tr>
                )}
                {!ticketsLoading && tickets.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No support tickets found.</td></tr>
                )}
                {!ticketsLoading && tickets.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-900">{t.title}</div>
                      <div className="text-xs text-slate-500">{t.submitterEmail}</div>
                    </td>
                    <td className="px-5 py-4 text-sm capitalize text-slate-700">{t.category.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-4">
                      <span className={clsx(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                        t.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                        t.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                        t.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-600',
                      )}>{t.priority}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_COLORS[t.status])}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(t.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      {t.status !== 'resolved' && t.status !== 'closed' && (
                        <button onClick={() => handleResolveTicket(t.id)} className="inline-flex items-center rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ TELEMATICS TAB ═══ */}
      {activeTab === 'telematics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Telematics ingestion health</h3>
              <p className="text-sm text-slate-500">
                Tracks buffered, processed, retried, dropped, and deduplicated events by provider. Buffered events are processed in timestamp order.
              </p>
            </div>
            <button onClick={loadTelematicsHealth} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
          </div>

          {telematicsLoading && <p className="py-8 text-center text-sm text-slate-500">Loading telematics ingestion health...</p>}

          {!telematicsLoading && telematicsHealth.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              No telematics ingestion records yet. Once providers send events, this panel will show last received time, dedup counts, retry counts, and dropped events.
            </div>
          )}

          {!telematicsLoading && telematicsHealth.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-5 xl:grid-cols-5">
                {([
                  { label: 'Providers', value: telematicsHealth.length },
                  { label: 'Buffered', value: telematicsHealth.reduce((sum, row) => sum + row.bufferedCount, 0) },
                  { label: 'Processed', value: telematicsHealth.reduce((sum, row) => sum + row.processedCount, 0) },
                  { label: 'Retries', value: telematicsHealth.reduce((sum, row) => sum + row.retryCount, 0) },
                  { label: 'Deduplicated', value: telematicsHealth.reduce((sum, row) => sum + row.dedupCount, 0) },
                ] as const).map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Provider</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Received</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Processed</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Buffered / Processed</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Retries / Drops</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Dedup / OOO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {telematicsHealth.map((row) => (
                      <tr key={row.provider} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">{row.provider}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{formatDate(row.lastReceivedAt)}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{formatDate(row.lastProcessedAt)}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{row.bufferedCount} / {row.processedCount}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{row.retryCount} / {row.droppedCount}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{row.dedupCount} / {row.outOfOrderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Deduplicated events are counted at ingestion, and each buffered event is recalculated once when flushed in timestamp order so out-of-sequence arrivals do not corrupt risk history.
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ RETENTION TAB ═══ */}
      {activeTab === 'notifications' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Notification Rules</h3>
              <p className="text-sm text-slate-500">Review the org's active alert thresholds without leaving admin.</p>
            </div>
            <span className="text-sm text-slate-500">{notificationRules.length} active rule{notificationRules.length === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {notificationRules.map((rule) => (
              <div key={rule.id} className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900">{rule.type.replace('_', ' ')}</div>
                <div className="text-sm text-slate-500">Threshold {rule.threshold}</div>
                <div className="mt-2 text-xs uppercase tracking-wide text-slate-400">{rule.active ? 'Active' : 'Disabled'}</div>
              </div>
            ))}
            {notificationRules.length === 0 && <p className="text-sm text-slate-500">No rules configured yet.</p>}
          </div>
        </section>
      )}

      {activeTab === 'integrations' && (
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Integrations</h3>
              <p className="text-sm text-slate-500">Register outbound webhooks and review recent delivery health.</p>
            </div>
            <button onClick={loadIntegrations} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const webhook = await webhookService.createWebhook(role, webhookForm);
                  setWebhooks((prev) => [webhook, ...prev]);
                  toast.success('Webhook registered');
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to register webhook');
                }
              }}
              className="space-y-4 rounded-xl border border-slate-200 p-4"
            >
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Register webhook</h4>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Endpoint URL</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={webhookForm.endpointUrl} onChange={(e) => setWebhookForm({ ...webhookForm, endpointUrl: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Secret</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={webhookForm.secret} onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })} />
              </div>
              <div>
                <div className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Event types</div>
                <div className="space-y-2 text-sm text-slate-700">
                  {(['inspection_failed', 'work_order_closed', 'risk_score_changed'] as WebhookEventType[]).map((eventType) => (
                    <label key={eventType} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhookForm.eventTypes.includes(eventType)}
                        onChange={(e) => setWebhookForm({ ...webhookForm, eventTypes: e.target.checked ? [...webhookForm.eventTypes, eventType] : webhookForm.eventTypes.filter((value) => value !== eventType) })}
                      />
                      <span>{eventType.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Register</button>
            </form>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Registered webhooks</h4>
                  <span className="text-xs text-slate-500">{webhooks.length} endpoint{webhooks.length === 1 ? '' : 's'}</span>
                </div>
                {integrationsLoading ? (
                  <p className="py-6 text-sm text-slate-500">Loading integration health...</p>
                ) : webhooks.length === 0 ? (
                  <p className="py-6 text-sm text-slate-500">No webhooks configured yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                        <div className="font-medium text-slate-900">{webhook.endpointUrl}</div>
                        <div className="text-slate-500">Events: {webhook.eventTypes.join(', ')}</div>
                        <div className="text-xs text-slate-400">{webhook.active ? 'Active' : 'Disabled'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Delivery history</h4>
                {deliveryLog.length === 0 ? (
                  <p className="py-6 text-sm text-slate-500">No deliveries recorded yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {deliveryLog.slice(0, 5).map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                        <div className="font-medium text-slate-900">{item.eventType.replace(/_/g, ' ')}</div>
                        <div className="text-slate-500">Status: {item.status} · Attempts: {item.attemptCount}</div>
                        <div className="text-xs text-slate-400">{item.failureReason || 'Delivered successfully'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'retention' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-500">Retention window:</label>
              <select
                value={retentionDays}
                onChange={(e) => {
                  setRetentionDays(Number(e.target.value));
                  setTimeout(loadRetention, 0);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>365 days</option>
              </select>
              <button
                onClick={async () => {
                  if (!retention || retention.candidates.length === 0) return;
                  setRetentionArchiving(true);
                  try {
                    await retentionPolicyService.archiveRetentionCandidates(retention.candidates);
                    toast.success('Retention candidates queued for archival');
                  } finally {
                    setRetentionArchiving(false);
                  }
                }}
                disabled={retentionArchiving || !retention || retention.candidates.length === 0}
                className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              >
                {retentionArchiving ? 'Archiving...' : 'Archive Candidates'}
              </button>
            </div>
            <button onClick={loadRetention} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
          </div>

          {retentionLoading && <p className="py-8 text-center text-sm text-slate-500">Scanning for retention candidates...</p>}

          {!retentionLoading && retention && (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                {([
                  { label: 'Documents', value: retention.counts.documents },
                  { label: 'Tasks', value: retention.counts.tasks },
                  { label: 'Training', value: retention.counts.trainingAssignments },
                  { label: 'Total', value: retention.counts.total },
                ] as const).map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                    <div className="text-xs text-slate-500">{item.label} candidates</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {retention.counts.total} record{retention.counts.total !== 1 ? 's' : ''} older than {retention.days} days from cutoff{' '}
                    <span className="font-semibold">{retention.cutoffDate}</span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-700">
                  These records are candidates for archival or deletion per your retention policy. No automatic action is taken.
                </p>
              </div>

              {retention.candidates.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Entity</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {retention.candidates.slice(0, 50).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 text-sm capitalize text-slate-700">{c.entity.replace(/_/g, ' ')}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-500">{c.id.slice(0, 12)}...</td>
                          <td className="px-5 py-3 text-sm text-slate-500">{formatDate(c.date)}</td>
                          <td className="px-5 py-3 text-sm text-slate-500">{c.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {retention.candidates.length > 50 && (
                    <div className="bg-slate-50 px-5 py-3 text-center text-xs text-slate-500">
                      Showing 50 of {retention.candidates.length} candidates
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ ROLE CHANGE MODAL ═══ */}
      <Modal
        isOpen={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        title="Change User Role"
      >
        {roleChangeTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Updating role for <span className="font-semibold">{roleChangeTarget.fullName || roleChangeTarget.email}</span>
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">New Role</label>
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(e.target.value as ProfileRole)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setRoleChangeTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleRoleChange} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Update Role</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ NEW TICKET MODAL ═══ */}
      <Modal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        title="Create Support Ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              placeholder="Brief summary of the issue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
            >
              <option value="onboarding">Onboarding</option>
              <option value="bug_report">Bug Report</option>
              <option value="feature_request">Feature Request</option>
              <option value="configuration">Configuration</option>
              <option value="billing">Billing</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
            <textarea
              required
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              placeholder="Describe the issue or request in detail"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsNewTicketOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Create Ticket</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
