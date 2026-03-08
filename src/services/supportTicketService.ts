import { supabase, getCurrentOrganization } from '../lib/supabase';
import { auditLogService } from './auditLogService';
import type { ProfileRole } from './authorizationService';
import { canAccessPlatformAdmin, getRoleCapabilities } from './authorizationService';

export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketCategory = 'onboarding' | 'bug_report' | 'feature_request' | 'configuration' | 'billing' | 'other';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  submitterEmail: string;
  submitterId: string;
  assigneeEmail: string | null;
  organizationId: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

const mapTicket = (row: any): SupportTicket => ({
  id: row.id,
  title: row.title || '',
  description: row.description || '',
  category: row.category || 'other',
  priority: row.priority || 'medium',
  status: row.status || 'open',
  submitterEmail: row.submitter_email || '',
  submitterId: row.submitter_id || '',
  assigneeEmail: row.assignee_email || null,
  organizationId: row.organization_id || null,
  resolution: row.resolution || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at || row.created_at,
});

const ensureOpsAccess = (role: ProfileRole) => {
  const caps = getRoleCapabilities(role);
  if (!canAccessPlatformAdmin(role) && !caps.canManageOrgSettings) {
    throw new Error('Insufficient permissions for support operations');
  }
};

export const supportTicketService = {
  /**
   * Create a new support ticket. Any user can create.
   */
  async createTicket(input: {
    title: string;
    description: string;
    category: SupportTicketCategory;
    priority: SupportTicketPriority;
  }): Promise<SupportTicket> {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    const orgId = await getCurrentOrganization();

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([{
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        priority: input.priority,
        status: 'open',
        submitter_email: user?.email || '',
        submitter_id: user?.id || '',
        organization_id: orgId,
      }])
      .select()
      .single();

    if (error) throw error;

    await auditLogService.log({
      action: 'support.ticket_created',
      targetType: 'support_ticket',
      targetId: data.id,
      targetLabel: input.title,
      details: { category: input.category, priority: input.priority },
    });

    return mapTicket(data);
  },

  /**
   * List support tickets. Admins see all; regular users see their own.
   */
  async listTickets(role: ProfileRole, options?: {
    status?: SupportTicketStatus;
    limit?: number;
  }): Promise<SupportTicket[]> {
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 100);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    // non-admin users only see their own tickets
    if (!canAccessPlatformAdmin(role) && !getRoleCapabilities(role).canManageOrgSettings) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.id) {
        query = query.eq('submitter_id', userData.user.id);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapTicket);
  },

  /**
   * Update ticket status (admin/ops only).
   */
  async updateTicketStatus(
    callerRole: ProfileRole,
    ticketId: string,
    status: SupportTicketStatus,
    resolution?: string,
  ): Promise<void> {
    ensureOpsAccess(callerRole);

    const payload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (resolution) {
      payload.resolution = resolution;
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(payload)
      .eq('id', ticketId);

    if (error) throw error;

    const isResolution = status === 'resolved' || status === 'closed';

    await auditLogService.log({
      action: isResolution ? 'support.ticket_resolved' : 'support.ticket_created',
      targetType: 'support_ticket',
      targetId: ticketId,
      targetLabel: `Ticket ${ticketId.slice(0, 8)}`,
      details: { status, resolution },
    });
  },

  /**
   * Assign a ticket to an admin/ops user.
   */
  async assignTicket(callerRole: ProfileRole, ticketId: string, assigneeEmail: string): Promise<void> {
    ensureOpsAccess(callerRole);

    const { error } = await supabase
      .from('support_tickets')
      .update({
        assignee_email: assigneeEmail,
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) throw error;
  },

  /**
   * Escalate a feedback entry to a support ticket.
   */
  async escalateFeedback(
    callerRole: ProfileRole,
    feedbackId: string,
    feedbackMessage: string,
    feedbackCategory: string,
    feedbackPriority: string,
  ): Promise<SupportTicket> {
    ensureOpsAccess(callerRole);

    const priorityMap: Record<string, SupportTicketPriority> = {
      Low: 'low',
      Medium: 'medium',
      High: 'high',
    };

    const ticket = await this.createTicket({
      title: `Escalated Feedback: ${feedbackCategory}`,
      description: feedbackMessage,
      category: 'other',
      priority: priorityMap[feedbackPriority] || 'medium',
    });

    await auditLogService.log({
      action: 'feedback.escalated',
      targetType: 'feedback',
      targetId: feedbackId,
      targetLabel: `Feedback → Ticket ${ticket.id.slice(0, 8)}`,
      details: { ticketId: ticket.id },
    });

    return ticket;
  },

  /**
   * Get ticket counts grouped by status.
   */
  async getTicketCounts(role: ProfileRole): Promise<Record<SupportTicketStatus, number>> {
    const tickets = await this.listTickets(role);
    const counts: Record<SupportTicketStatus, number> = {
      open: 0,
      in_progress: 0,
      waiting_on_customer: 0,
      resolved: 0,
      closed: 0,
    };

    for (const ticket of tickets) {
      counts[ticket.status] = (counts[ticket.status] || 0) + 1;
    }

    return counts;
  },
};
