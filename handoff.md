# Safety Suite App Handoff

## Purpose
This document defines the current product state and the roadmap required to turn the application into a functioning, production-ready hybrid of:
- Fleetio-style fleet operations software
- Idelic Safety Suite-style driver safety, compliance, and intervention software

The target is not a demo. All core workflows must work end-to-end, with enterprise controls required to operate the product safely at scale.

## Product Target

### Fleet Operations Capabilities
- Equipment and asset registry with lifecycle state
- Preventive maintenance scheduling and service history
- Work orders with labor/parts/inspection linkage
- Inspection and defect remediation workflows
- Document management for vehicles, drivers, and compliance files

### Safety and Risk Capabilities
- Driver risk profiles, score history, and event ingestion
- Safety event logging, intervention queues, and watchlists
- Coaching plans, check-ins, and documented outcomes
- Training assignment, completion, review, and remediation
- Compliance action visibility and accountability

### Enterprise and Platform Capabilities
- Strict tenant isolation and enforceable RBAC
- Admin workflows that are form/table driven and safe to use
- Audit history, exportability, and operational reporting
- Stable integrations, observability, release gates, and recovery playbooks
- Launch, hypercare, support, and customer operations tooling

## Definition of Functioning Application
A release candidate is functioning when:
- Core fleet, safety, compliance, training, and reporting workflows complete without manual DB intervention
- No open P0/P1 tenancy, security, or data-loss issues remain
- Admin and customer-ops workflows are operable by non-engineers
- External integrations fail safely and recover cleanly
- Monitoring, backup/restore, release controls, and auditability are validated

## Current Architecture
- Frontend: React + Vite + TypeScript
- Backend/data: Supabase auth, Postgres, storage, migrations
- Hosting: Vercel-style frontend deployment model
- App shell and route surface exist in `src/App.tsx` and `src/components/Layout/*`
- Domain services exist in `src/services/*`

## Current Application Assessment (`2026-03-07`)

### What Exists
- Broad route coverage exists for dashboard, drivers, safety, watchlist, training, compliance, equipment, maintenance, work orders, reporting, hypercare, documents, FMCSA, settings, help/feedback, and admin.
- Key service modules exist for drivers, work orders, maintenance, inspections, compliance, documents, risk, reporting, training, admin, feedback, and launch operations.
- Recent Sprint 20 work added:
  - Hypercare command center
  - rollout cohort tracking
  - daily review and internal status publishing

### What Is Working Reasonably Well
- Safety event logging and driver service foundations exist.
- Maintenance/work order/document reliability was materially improved in Sprints 10-19.
- Reporting, hypercare, and feedback workflows now have usable operational structure.
- Unit coverage is broad enough to support incremental hardening.

### What Still Blocks “Fully Functioning”

#### 1. Product Depth Gaps
- `Dashboard` is still largely static and not a true operational command center.
- `Equipment` still relies heavily on local UI state and seeded rows instead of durable asset workflows.
- `FMCSA` is a static reference page, not a working compliance/integration module.
- `carrierService` still contains mock/development fallback patterns.
- Fleet workflows still need deeper linkage between assets, inspections, work orders, PM, documents, and service history.
- Safety workflows need stronger intervention lifecycle management, coaching accountability, and closed-loop follow-through.

#### 2. Platform and Enterprise Gaps
- Sprint 9 org isolation/RBAC vision is not fully realized.
- Admin tooling still exposes raw row management patterns that are useful for development but not sufficient for production operations.
- Audit, approvals, customer-ops controls, and platform admin capabilities are incomplete.
- Historical migration/schema consistency still needs reconciliation.

#### 3. Production Readiness Gaps
- Sensitive-data handling still needs stronger server-side/security posture review (`src/utils/crypto.ts` remains a concern).
- Integration paths are not yet production-complete for carrier/FMCSA and related external data acquisition.
- End-to-end verification, production-like seed flows, observability, and DR readiness are not finished.

## Remaining Product Themes
- Replace demo/static pockets with live, persistent workflows
- Close all cross-module workflow gaps
- Finish enterprise tenant/security model
- Harden admin/customer-ops tooling
- Reach launch-ready operational maturity

## Sprint Framework
- Sprint length: 2 weeks
- Team model: PM, UX, 2-3 full-stack engineers, QA/SDET, part-time security
- Planning method: user stories first, then scoped implementation

## Sprint Commit Protocol
- At sprint completion, create one scoped commit containing:
  - updated sprint status in `handoff.md`
  - sprint artifacts under `docs/sprint-<n>/`
  - any CI/process updates required for that sprint
- Commit message format: `sprint-<n>: <outcome summary>`
- Push only after all required checks pass
- Reminder under every sprint: `Commit & push after checks/tests pass`

---

## Sprints 1-20 Compressed History

### Sprints 1-8
Status: Complete
- Established release baseline, UX/navigation system, fleet core, safety core, integrations hardening, documents/compliance, admin/security improvements, and data-quality/indexing improvements.

### Sprint 9
Status: Partially complete / still relevant
- Intended to finish org isolation and upgraded role model.
- This remains a major unfinished foundation and is reintroduced below.

### Sprints 10-19
Status: Complete
- Stabilized broken core workflows, improved fleet operations UI, expanded reporting/admin/data quality capabilities, and added demo-seed/UAT hardening.

### Sprint 20
Status: In progress but materially advanced
- Added hypercare runbook and in-app command center
- Added rollout cohort tracking
- Added daily review and internal status publishing
- Remaining explicit Sprint 20 scope item: prioritized post-launch backlog

---

## Rebaseline: Sprints 21-30

Principle for this rebaseline:
- Each sprint combines user-facing workflow completion with platform/enterprise readiness where needed.
- User stories define the sprint.
- “Looks complete” is not enough; workflows must persist correctly, enforce permissions correctly, and be operationally supportable.

### Sprint 21: Tenant Isolation and Production Access Model
Status: In progress
Reminder: Commit & push after checks/tests pass.

User stories:
- As a platform admin, I can provision and manage organizations safely so tenants remain isolated.
- As a role-based user, I only see pages, records, and actions allowed for my role.
- As the business, I can trust that no tenant can access another tenant’s data.

Goal:
- Finish the org isolation and RBAC foundation that the rest of the roadmap depends on.

Scope:
- Finalize role model across frontend, services, and database policy enforcement
- Enforce org scoping for all major domain tables and service queries
- Add platform admin organization management workflows
- Remove residual “admin by convention” behavior and replace with explicit authorization rules
- Add tenancy and authorization regression coverage across core services/pages

Exit criteria:
- Cross-tenant access attempts are blocked in automated tests
- Role-based page/action permissions are enforced consistently
- Platform admin can manage org-level settings without raw DB intervention

Progress update (`2026-03-07`):
- Added canonical role/capability foundation for `platform_admin`, `full`, `safety`, `coaching`, `maintenance`, and `readonly`
- Normalized legacy profile roles into the canonical model in auth/profile resolution
- Reworked route and sidebar admin gating around platform-admin capability checks
- Hardened high-risk service and UI surfaces already in active use:
  - admin data console
  - work order approvals
  - reporting preferences
  - rollout cohorts
  - hypercare daily reviews
  - reporting page preference controls
- Added regression tests for role normalization, navigation visibility, platform-admin enforcement, and readonly-vs-managerial action boundaries
- Full verification passed on this slice:
  - `npm run test:unit`
  - `npm run build`
  - `git diff --check`

Remaining Sprint 21 work:
- Continue removing residual legacy role assumptions from lower-risk UI/tests/static copy
- Review deeper mutation boundaries in driver safety, coaching, and training flows
- Complete org-scoping/database-policy reconciliation against the canonical role model

### Sprint 22: Fleet Asset System Completion
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As a fleet manager, I can create, edit, retire, and search all assets with complete lifecycle data.
- As an operations lead, I can view equipment status, attached documents, inspections, and service posture in one place.
- As a maintenance planner, I can trust asset usage data to drive service scheduling.

Goal:
- Convert equipment from a partially local/demo experience into a durable fleet asset system.

Scope:
- Persist equipment lifecycle, status changes, ownership, usage, and attachments through the real service/data layer
- Add asset detail workflows with linked inspections, PM, work orders, and documents
- Replace hardcoded/demo inventory state in `Equipment`
- Add asset filters, archive/retire states, and history views
- Add focused tests for asset CRUD, linking, and role-gated actions

Exit criteria:
- Equipment CRUD is fully persistent and role-aware
- Asset detail views reflect linked downstream workflows
- No hardcoded fleet inventory remains in the primary equipment workflow

### Sprint 23: Maintenance, PM, Parts, and Work Order Completion
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As a maintenance manager, I can schedule PM by date, miles, or hours and automatically generate due work.
- As a technician or coordinator, I can manage work orders with statuses, labor, parts, and completion history.
- As a fleet leader, I can understand backlog, downtime, and repeat-defect patterns.

Goal:
- Finish the operational maintenance backbone expected in a Fleetio-like product.

Scope:
- Complete PM due generation and recurring scheduling logic
- Add work order detail model for tasks, labor, parts, and closeout data
- Introduce parts/inventory foundations required for service execution
- Strengthen inspection-to-remediation-to-work-order linkage
- Add maintenance SLA, downtime, and backlog reporting support

Exit criteria:
- PM due logic works against real asset usage/state
- Work orders support end-to-end lifecycle from draft to closeout
- Repeat service and defect visibility is available in reporting

### Sprint 24: Inspection and Compliance Operations Completion
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As a safety/compliance manager, I can run inspections, capture defects, and track remediation to closure.
- As a dispatcher or fleet operator, I can identify out-of-service equipment immediately and block unsafe use.
- As a compliance lead, I can manage credential, document, and action-item deadlines from one workflow.

Goal:
- Close the inspection and compliance loop across equipment, drivers, documents, and tasks.

Scope:
- Strengthen DVIR/inspection workflows and defect severity handling
- Add explicit remediation states, owners, due dates, and closeout evidence
- Finish compliance task workflows tied to documents, credentials, and inspection failures
- Add OOS blocking/visibility across linked asset workflows
- Expand compliance reporting and overdue escalation behavior

Exit criteria:
- Inspection defects can be tracked from discovery through verified remediation
- Compliance actions are assigned, monitored, and closed in-app
- Unsafe asset states are visible and enforceable in downstream workflows

### Sprint 25: Driver Safety, Coaching, and Intervention Completion
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As a safety manager, I can move from risk event to intervention, coaching, follow-up, and documented outcome.
- As a coach, I can see who needs attention, what actions are due, and whether the intervention worked.
- As leadership, I can understand whether safety activity is reducing risk over time.

Goal:
- Finish the Idelic-style safety operations lifecycle.

Scope:
- Complete intervention queue workflow and action states
- Expand coaching plan lifecycle, follow-up tracking, notes, and outcomes
- Link incidents, check-ins, coaching, tasks, and risk trend changes more explicitly
- Add driver-level timeline/history and stronger accountability views
- Add safety effectiveness reporting for interventions and coaching outcomes

Exit criteria:
- Risk-to-intervention workflow is closed-loop and persistent
- Coaching outcomes are measurable and auditable
- Driver profile supports meaningful operational decision-making

### Sprint 26: Training and Corrective Action System Completion
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As a trainer or coach, I can assign corrective training with actionable talking points and required driver actions.
- As a driver manager, I can see overdue assignments, review completions, and escalate non-compliance.
- As a compliance leader, I can tie training to incidents, interventions, and policy requirements.

Goal:
- Turn training into a complete corrective-action and completion-management system.

Scope:
- Finish template management, assignment lifecycle, review, and attestation workflows
- Link training to incidents, coaching plans, compliance tasks, and policy/document requirements
- Add manager review queues and escalation behavior for overdue assignments
- Improve training reporting and driver-level completion history
- Remove residual shallow flows in `Training`

Exit criteria:
- Training can be assigned, completed, reviewed, and audited end-to-end
- Corrective training is tied to real safety/compliance triggers
- Overdue and non-compliant training is visible in both operations and reporting flows

### Sprint 27: Documents, FMCSA, and External Data Completion
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As a compliance user, I can manage required documents by entity, expiration, and deficiency status.
- As an operations leader, I can view carrier/FMCSA-related data without relying on static reference content.
- As the business, I can trust external data paths to fail safely and keep usable cached history.

Goal:
- Complete document governance and replace static/external-data placeholders with working integration patterns.

Scope:
- Finish document entity linkage, expiration workflows, deficiency tracking, and exception handling
- Replace static FMCSA reference-only behavior with usable operational/compliance tooling
- Harden carrier/FMCSA integration paths and remove mock-first assumptions from production flows
- Add cached external data strategy, refresh history, and user-facing failure states
- Expand tests around document lifecycle and external data fallback behavior

Exit criteria:
- Documents support governed lifecycle management, not just upload/download
- FMCSA/carrier workflows provide useful operational value beyond static references
- Integration failures degrade gracefully without breaking the user workflow

### Sprint 28: Reporting, Dashboards, and Executive Operations Layer
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As an executive, I can view accurate, actionable cross-functional KPIs rather than static charts.
- As an operations lead, I can save, export, and act on views that reflect real fleet and safety performance.
- As a customer-ops owner, I can prioritize launch and operational issues from shared evidence.

Goal:
- Replace remaining static/dashboard gaps with a real reporting and executive operations layer.

Scope:
- Rebuild `Dashboard` on live data and remove static metric/chart content
- Expand cross-module analytics for fleet reliability, safety effectiveness, compliance risk, and training completion
- Finish report views, exports, auditability, and role-aware reporting preferences
- Add backlog prioritization workflow as the remaining Sprint 20/launch follow-up item
- Improve hypercare-to-steady-state transition reporting

Exit criteria:
- Dashboard is live-data-driven and operationally useful
- Reporting supports real management reviews and exports
- Post-launch backlog prioritization exists as an explicit workflow

### Sprint 29: Admin, Customer Operations, and Enterprise Controls
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As a platform admin, I can manage tenants, settings, users, and controlled operational changes safely.
- As a customer-ops lead, I can support launches, escalations, and configuration changes without raw table editing.
- As an auditor or enterprise buyer, I can trace important actions and changes.

Goal:
- Convert internal tooling from developer-oriented admin access into production-grade enterprise operations tooling.

Scope:
- Replace broad raw-row admin workflows with safer domain-specific admin/customer-ops experiences
- Add org configuration, role assignment, retention/export, and support operations workflows
- Expand audit log visibility and admin safeguards
- Add customer onboarding, rollout, and support controls where still missing
- Improve help/feedback to backlog/escalation path for enterprise operations

Exit criteria:
- Admin/customer-ops workflows are usable without database knowledge
- Critical admin actions are auditable and permissioned
- Enterprise operations can run through product controls instead of engineering intervention

### Sprint 30: Production Hardening, Launch Readiness, and Release Candidate
Status: Planned
Reminder: Commit & push after checks/tests pass.

User stories:
- As the business, I can release the application knowing core workflows and platform controls are verified.
- As engineering/ops, we can monitor, recover, and support the system under production conditions.
- As a customer, I experience a stable, supportable, and secure product.

Goal:
- Finish the production-readiness work needed for a true release candidate.

Scope:
- Resolve remaining security and sensitive-data handling issues
- Reconcile migration/schema drift and verify production bootstrap path
- Expand end-to-end and launch-rehearsal coverage for all critical workflows
- Validate observability, alerting, backup/restore, rollback, and incident handling
- Produce final release checklist, known-risk register, and go-live recommendation

Exit criteria:
- No open release-blocking P0/P1 issues remain
- Core workflows pass end-to-end verification under production-like conditions
- Monitoring, recovery, and release controls are validated
- Product is ready to transition from roadmap execution to release management

---

## Recommended Execution Order Inside Sprints 21-30
- First secure the platform foundation
- Then complete core fleet and safety workflows
- Then finish supporting systems and external data
- Then finish executive/admin layers
- Finally harden to release standard

## Highest-Risk Areas to Recheck Continuously
- Org isolation and authorization
- Data persistence versus local/demo state
- Integration fallback behavior
- Cross-module workflow linkage
- Sensitive-data handling and operational recovery

## Immediate Next Step
Execute Sprint 21 first. The rest of the roadmap assumes tenant isolation, enforceable roles, and trustworthy access boundaries.
