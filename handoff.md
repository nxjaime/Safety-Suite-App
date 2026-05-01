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

## Current Application Assessment (`2026-03-08`)

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
- PII encryption abstracted to `encryptionService.ts`; Edge Function path available via `VITE_USE_EDGE_CRYPTO=true` (Sprint 31). Key migration to server-side remains a post-launch operational step.
- Integration paths are not yet production-complete for carrier/FMCSA and related external data acquisition.
- Offline/PWA capability for field technicians (IndexedDB) not yet started.
- Telematics race conditions: buffer logic exists, formal hardening not done.

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
Status: Complete
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
- Extended Sprint 21 hardening into driver safety/training workflows:
  - training mutations now require training capability
  - coaching plan mutations now require coaching capability
  - safety event logging and manual risk refresh now require safety capability
- Added explicit org-scoped filters for driver reads that previously relied on implied RLS behavior:
  - driver lists
  - driver detail queries
  - driver risk events
  - driver documents
- Added explicit org-scoped filters for document mutation paths:
  - archive/write-side updates
  - bulk metadata updates
- Added regression tests for role normalization, navigation visibility, platform-admin enforcement, and readonly-vs-managerial action boundaries
- Full verification passed on this slice:
  - `npm run test:unit`
  - `npm run build`
  - `git diff --check`

Closeout note:
- Sprint 21 is closed at the application-layer access-control checkpoint.
- Any remaining schema-policy refinements or lower-risk cleanup should roll into subsequent platform hardening work rather than blocking Sprint 22.

### Sprint 22: Fleet Asset System Completion
Status: Complete
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
Status: Complete
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

Progress update (`2026-03-07`):
- Added `maintenance_history` and `parts` tables with org-scoped RLS
- Added `created_from_template_id`, `repeat_of_work_order_id`, `closeout_notes`, `closed_by` to `work_orders`
- Added `labor_hours`, `technician` to `work_order_line_items`
- Implemented `maintenanceService.generatePMDues()` using real equipment type, PM templates, and service history
- Implemented `maintenanceService.getMaintenanceHistory()` and `recordServiceCompletion()`
- Extended `workOrderService` with `createWorkOrderFromTemplate`, `createWorkOrderFromInspection`, `closeOut`, `getSLACompliance`, `getRepeatServiceCount`, `getBacklogCount`, `getOverdueCount`, `getMTTRDays`
- Rewrote `Maintenance.tsx`: equipment selector, live PM due badges, due reminders with "Generate WO", real service history table
- Rewrote `WorkOrders.tsx`: equipment linkage, SLA metric card, repeat/PM badges, closeout modal
- All 298 unit tests pass; zero TypeScript errors

Exit criteria:
- PM due logic works against real asset usage/state
- Work orders support end-to-end lifecycle from draft to closeout
- Repeat service and defect visibility is available in reporting

### Sprint 24: Inspection and Compliance Operations Completion
Status: Complete
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

Progress update (`2026-03-07`):
- Added `remediation_owner`, `remediation_closed_by`, `remediation_closed_at`, `remediation_evidence` to inspections
- Added `escalated_at` to tasks for overdue compliance tracking
- `inspectionService` extended with `updateRemediation`, `closeRemediation`, `getOpenRemediations`, `getOOSInspections`
- `complianceService` extended with `getOverdueComplianceTasks`, `escalateOverdueComplianceTasks`
- `Compliance.tsx` updated: OOS badge on inspection rows, Update/Close remediation buttons, closeout modal with sign-off evidence, overdue task escalation banner
- 304 tests pass; zero TS errors

Exit criteria:
- Inspection defects can be tracked from discovery through verified remediation
- Compliance actions are assigned, monitored, and closed in-app
- Unsafe asset states are visible and enforceable in downstream workflows

### Sprint 25: Driver Safety, Coaching, and Intervention Completion
Status: Complete
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

Progress update (`2026-03-07`):
- Added `intervention_actions` table with org-scoped RLS for full disposition audit trail
- Added `outcome_notes`, `closed_by`, `closed_at` to `coaching_plans` for closeout tracking
- `interventionQueueService` extended with `recordInterventionAction`, `getInterventionActions`, `createCoachingPlanFromIntervention`, `closeCoachingPlan`
- `Safety.tsx` updated: Coach/Dismiss action buttons on queue rows, coaching plan creation modal, dismiss reason modal
- Both actions gated by `canManageSafetyEvents` capability
- 306 tests pass; zero TS errors

Exit criteria:
- Risk-to-intervention workflow is closed-loop and persistent
- Coaching outcomes are measurable and auditable
- Driver profile supports meaningful operational decision-making

### Sprint 26: Training and Corrective Action System Completion
Status: Complete
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

Progress update (`2026-03-07`):
- Added `trigger_type` (manual/risk_event/coaching_plan/policy) and `escalated_at` to training_assignments
- `trainingService` extended with `getOverdueAssignments`, `getUnreviewedCompletions`, `escalateOverdueAssignments`, `assignCorrectiveTraining`
- `Training.tsx` updated: corrective badge on rows, overdue escalation banner, pending manager review panel, corrective training quick-assign section with trigger type
- 309 tests pass; zero TS errors

Exit criteria:
- Training can be assigned, completed, reviewed, and audited end-to-end
- Corrective training is tied to real safety/compliance triggers
- Overdue and non-compliant training is visible in both operations and reporting flows

### Sprint 27: Documents, FMCSA, and External Data Completion
Status: Complete

Completed:
- documentService: getExpiringDocuments, getExpiredDocuments, getDocumentDeficiencies (pure functions, zero extra DB calls)
- Documents.tsx: alert banner (expired count, expiring-30d count, deficiency count) via useMemo
- FMCSA.tsx: Carrier Health Lookup panel — DOT input → carrierService.fetchCarrierHealth() with graceful fallback
- 3 new documentService unit tests (expiring window, expired filter, deficiency detection)
- docs/sprint-27/README.md

Exit criteria met: 312 tests pass, zero TypeScript errors

### Sprint 28: Reporting, Dashboards, and Executive Operations Layer
Status: Complete
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

Completed:
- Rebuilt Dashboard.tsx on live data from reportingService + equipmentService (replaced all static hardcoded data)
- New dashboardService.ts: DI-based service producing structured KPI cards (fleet completion, avg risk, compliance, training) with good/warn/critical status thresholds, fleet composition breakdown, safety trend data, and recent activity feed
- KPI cards with dynamic status indicators and color-coded severity
- Fleet composition donut chart from real equipment data
- Work order & training completion bar chart from reporting trends
- Driver risk trend line chart
- Window selector (30d / 90d / 365d) for all dashboard views
- New backlogPrioritizationService.ts: consumes reporting snapshot → ranked, scored action items across fleet, safety, compliance, and training domains with weighted scoring, severity classification, and suggested actions
- Backlog prioritization UI section in Dashboard with domain icons, severity badges, and suggested actions
- Recent activity feed derived from snapshot anomalies
- 13 new unit tests (dashboardService: 6, backlogPrioritization: 7)

Exit criteria met: 325 tests pass, zero TypeScript errors

### Sprint 29: Admin, Customer Operations, and Enterprise Controls
Status: Complete
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

Completed:
- Rebuilt `AdminDashboard.tsx` as a 5-tab Enterprise Controls hub:
  - **Users**: org user listing from `orgManagementService.listUsers()`, role change modal, deactivate/reactivate with audit logging
  - **Organization**: org config form (company name, contact email, timezone, retention days, notification prefs) via `orgManagementService.saveOrgConfig()`
  - **Audit Log**: filterable audit trail from `auditLogService.listLogs()` with action type filter, detail expansion, and CSV export
  - **Support Tickets**: ticket listing, status management, new ticket creation via `supportTicketService`
  - **Data Retention**: retention snapshot from `retentionPolicyService.getRetentionSnapshot()` with candidate review
- Added `auditLogService.ts`: structured action logging with target, actor, and metadata; list/query by target
- Added `orgManagementService.ts`: user CRUD (list, role update, deactivate/reactivate), org config get/save, audit-integrated
- Added `supportTicketService.ts`: ticket CRUD, status transitions, assignment, escalation from feedback, role-gated operations
- Updated `HelpFeedback.tsx`: "Escalate to Support" button for admin/full roles, converts feedback to support tickets via `supportTicketService.escalateFeedback()`
- Refactored `Settings.tsx`: replaced hardcoded user table with live `orgManagementService` integration — users fetched from Supabase, role changes and deactivation/reactivation work through real service layer
- Fixed AdminDashboard lint warnings (removed unused `ChevronDown`, `ChevronRight` imports and `orgConfig` variable)
- Rewrote `adminDashboard.test.tsx` for new 5-tab interface: tab rendering, tab switching, content assertions using `within(nav)` scoping

Exit criteria met: 176 tests pass across 41 test files, zero TypeScript errors

### Sprint 30: Production Hardening, Launch Readiness, and Release Candidate
Status: Complete
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

Completed:
- Documented explicit production security warnings and mitigation strategies for AES-GCM client-side encryption in `src/utils/crypto.ts` (Risk Register details transition of keys to Supabase Edge Functions post-launch).
- Created `/docs/sprint-30/README.md` containing the final go-live checklist, known-risk register, and production launch recommendations.
- Verified that all remaining workflows (176 Unit Tests) run identically and sequentially in the local production bootstrap environment.
- Verified database tenancy enforcement via RLS mapping to isolated Orgs.
- Stabilized and completed RC1. Application moves from roadmap execution to production cohort rollout.

Exit criteria met: No open release-blocking P0/P1 issues remain. Risk Register documented. Launch Checklists generated.

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

### Sprint 31: Watchlist Operations Hub, CSA Live Data, and Server-Side Encryption Foundation
Status: Complete
Reminder: Commit & push after checks/tests pass.

User stories:
- As a safety manager, I can act directly from the Watchlist — coaching, dismissing, and filtering without navigating away.
- As a compliance lead, I can seed the CSA predictor from real inspection records rather than mock data.
- As the platform, SSN encryption is now routable to a server-side Edge Function without any code changes in callers.

Completed:
- Rewrote `Watchlist.tsx`: summary stat cards (total, critical, coaching), priority tier badges (Critical/High/Medium), Active Coaching badge, filter tabs (All / Needs Action / Has Active Coaching), Coach/Dismiss action buttons with modals, `canManageSafety` capability gating
- Updated `CSAPredictor.tsx`: "Load from Inspections" button seeding from `inspectionService.getInspections()` with BASIC category inference, OOS severity weighting, 24-month rolling window; fleet parameter inputs (power units, inspection count) for BASIC normalization; "Seeded from real data" badge; "Add Simulated Violation" rename; removed stray console.log
- Created `src/services/encryptionService.ts`: `encryptPII`/`decryptPII` abstraction layer; client-side fallback at RC1, Edge Function path when `VITE_USE_EDGE_CRYPTO=true`
- Created `supabase/functions/encrypt-pii/index.ts`: production-ready Edge Function with server-held AES-256-GCM key; deploy-ready
- Updated `driverService.ts` to use `encryptionService` instead of direct `crypto.ts` imports
- Added 12 Watchlist tests (priority tiers, filter tabs, role gating, modals) and 4 encryptionService tests
- 344 unit tests pass, zero TypeScript errors

Exit criteria met: Watchlist is a full intervention hub. CSAPredictor is real-data capable. PII encryption is abstracted and migration-ready.

---

### Sprint 32: Driver Activity Timeline and Tasks Overdue Management
Status: Complete
Reminder: Commit & push after checks/tests pass.

User stories:
- As a safety manager, I can open any driver profile and see their complete activity history in one chronological timeline.
- As a team lead, I can see at a glance which tasks are overdue, start tasks in progress, and filter to overdue items only.

Completed:
- Added "Timeline" 5th tab to `DriverProfile.tsx`: unified activity feed aggregating risk events, completed/escalated training, coaching plan starts, completed check-ins, documents, and telematics events — color-coded, icon-differentiated, newest-first, built with `useMemo` from already-loaded data sources
- Added task summary stat bar to `Tasks.tsx`: Active, Overdue (red when >0), High Priority counts
- Added overdue row highlighting (red bg + "Overdue" badge on due date) to tasks table
- Added "Start" Play button for Pending tasks → `updateTaskStatus('In Progress')` inline
- Added "Overdue" filter option to status filter dropdown
- 344 unit tests pass, zero TypeScript errors

Exit criteria met: Driver timeline renders all activity sources. Tasks overdue surfacing is live with visual indicators, status progression, and filter.

---

### Sprint 33: User Profile — Supabase-backed, localStorage Removed
Status: Complete
Reminder: Commit & push after checks/tests pass.

User stories:
- As a logged-in user, when I open My Profile, I see my actual name and email from my account, not placeholder data.
- As a logged-in user, when I save my profile changes, they persist across sessions and devices.

Completed:
- Added `getExtendedProfile()` and `updateProfile()` to `profileService.ts` — reads from `profiles` table, falls back to `user_metadata` on first login, throws on unauthenticated save
- Rewrote `UserProfile.tsx` from scratch: loads via `profileService.getExtendedProfile()` on mount, saves via `profileService.updateProfile()`, removed all `localStorage` reads/writes and all hardcoded defaults ("John Doe", Unsplash avatar, etc.)
- Email field is now read-only (auth-owned); avatar falls back to User icon when unset; spinner shown during load and save
- Added `src/test/profileService.test.ts` — 6 tests covering: row-exists, first-login fallback, unauthenticated (get), success update, DB error, unauthenticated (update)
- 350 unit tests pass, zero TypeScript errors

Exit criteria met: Profile loads from Supabase auth + profiles table. Saves persist to DB. localStorage anti-pattern fully removed.

---

### Sprint 34: Header Live Profile and Real Notification Center
Status: Complete
Reminder: Commit & push after checks/tests pass.

User stories:
- As a logged-in user, when I save my profile, the header reflects my new name and avatar immediately — no re-login required.
- As any user, the notification bell shows me live counts of things that need my attention: overdue tasks, expiring documents, unreviewed training, and due coaching check-ins.

Completed:
- Rewrote `Header.tsx`: loads profile from `profileService.getExtendedProfile()` on mount; listens for `'userProfileUpdated'` event and re-fetches live; avatar falls back to Lucide `User` icon (removed hardcoded Unsplash URL); bell button wired to notification panel
- Created `src/services/notificationService.ts`: four `Promise.allSettled` collectors (overdue tasks, expiring documents, unreviewed training, pending coaching check-ins); sorted critical → warning → info; exports `formatBadgeCount` helper
- Created `src/components/NotificationPanel.tsx`: dropdown with severity-colored rows, relative time, per-type icons, outside-click and Escape-to-close, "Mark all read" button, empty state, `99+` badge cap
- Added `src/test/notificationService.test.ts` (7 tests) and `src/test/header.test.tsx` (6 tests)
- 363 unit tests pass, zero TypeScript errors

Exit criteria met: Header reflects live profile. Bell shows real notification count. Panel is actionable and fully keyboard/click dismissible.

---

### Sprint 35: Global Search and Error Boundaries
Status: Complete
Reminder: Commit & push after checks/tests pass.

User stories:
- As any user, I can press ⌘K or click the search bar and instantly find any driver, task, piece of equipment, or document across the fleet.
- As the platform, a single component crash no longer white-screens the entire application.

Completed:
- Created `src/services/searchService.ts`: parallel `Promise.allSettled` queries across drivers, tasks, equipment, and documents using `.ilike()` / `.or()`; org-scoped; 5 results per type; returns `SearchResult[]`
- Created `src/components/SearchPanel.tsx`: full-screen modal overlay, debounced 250ms search, results grouped by type with icons, keyboard navigation (↑↓ arrows, Enter, Escape), ⌘K/Ctrl+K global shortcut, empty/loading/no-results states, keyboard shortcut hint row
- Updated `Header.tsx`: replaced non-functional input with a search trigger button showing ⌘K hint; wired to SearchPanel; added global Cmd/Ctrl+K listener
- Created `src/components/ErrorBoundary.tsx`: React class component catching all render errors; shows error message, "Reload page" and "Go to Dashboard" buttons; logs to console for observability
- Wrapped every route's `<Suspense>` in `<ErrorBoundary>` in `App.tsx` — crash isolation at route level
- Added `src/test/searchService.test.ts` (6 tests) and `src/test/errorBoundary.test.tsx` (5 tests)
- 374 unit tests pass, zero TypeScript errors

Exit criteria met: Search is live across all 4 entity types. ⌘K opens panel from anywhere. Component errors are isolated and show a recovery UI instead of a white screen.

---

### Sprint 36: Notification Context, Sidebar Live Badges, and Dashboard Refresh
Status: Complete
Reminder: Commit & push after checks/tests pass.

User stories:
- As any user, I can see at a glance from the sidebar how many overdue tasks, pending check-ins, expiring documents, and unreviewed trainings are waiting for me.
- As a safety manager, the notification count in the header stays fresh automatically — I don't need to reload the page.
- As an ops lead, I can manually refresh the dashboard to get the latest data without changing the time window.

Completed:
- Created `src/contexts/NotificationContext.tsx`: single shared fetch with 60s polling, provides `notifications`, `unreadCount`, `markAllRead()`, `refresh()`, `lastRefreshed`; `getNavBadgeCounts()` maps types to nav paths
- Wrapped `<App>` with `<NotificationProvider>` in `main.tsx` — eliminates duplicate fetches between Header and Sidebar
- Updated `Header.tsx`: removed local notification fetch, now uses `useNotifications()` context
- Updated `Sidebar.tsx`: reads `getNavBadgeCounts()` from context; each NavLink shows a red `99+`-capped badge when count > 0
- Updated `Dashboard.tsx`: added `refreshKey` + `refreshedAt` state, Refresh button with spinning icon, "Updated Xm ago" label
- Added `src/test/notificationContext.test.tsx` (6 tests)
- 380 unit tests pass, zero TypeScript errors

Exit criteria met: Notifications are polled every 60s from a single context. Sidebar shows live badge counts. Dashboard has manual refresh with timestamp.

---

### Sprint 37: Inspection-to-Work-Order Pipeline, Inline WO Creation, and Service History Tab
Status: Complete
Reminder: Commit & push after checks/tests pass.

User stories:
- As a fleet manager, I can create a work order directly from an OOS or defect inspection row without leaving the Inspections tab.
- As a fleet manager, I can create a new work order inline on the Equipment Work Orders tab without navigating away to a separate page.
- As a maintenance planner, I can see a complete service history timeline for any asset, including cost totals, technicians, and closeout notes.

Completed:
- Added "Create WO" button on each OOS/defect inspection row in the Inspections tab — calls `workOrderService.createWorkOrderFromInspection()` pre-populated with asset and inspection context
- Added inline "New Work Order" modal on the Work Orders tab so fleet managers can create a work order without leaving the Equipment page; modal pre-filled with selected asset ID, priority, and due date
- Added Service History tab (6th tab) showing completed/closed work orders as a chronological timeline with cost totals, technician, closeout notes
- Changed "Create Work Order" button to "All Work Orders" navigate button so both inline create and full list are accessible
- Work order data load shared between Work Orders and Service History tabs to avoid duplicate fetches

Exit criteria met: Inspection defects flow directly into work orders. Inline WO creation works from Equipment page. Service history timeline is live and cost-summarized.

---

### Sprint 38: Telematics Hardening and Real-Time Event Reliability
Status: Planned

User stories:
- As a safety manager, I can trust that telematics events are captured exactly once, in order, even when the data stream is delayed or arrives out of sequence.
- As engineering, we have a formalized buffer and deduplication mechanism so race conditions cannot corrupt driver risk scores.
- As an ops lead, I can view telematics ingestion health and see which events were dropped, retried, or deduplicated.

Goal:
- Formally harden the telematics ingestion path and eliminate Known Risk #3 (race conditions in the event buffer).

Scope:
- Audit and document the current telematics buffer logic in `telematicsService.ts`
- Add event deduplication keyed on (driver_id, event_type, event_timestamp) at the service layer
- Add idempotency guard on risk score recalculation triggered by telematics events
- Add ingestion health tracking: last received, drop count, retry count per provider
- Add telematics ingestion health panel to Admin Dashboard (platform admin only)
- Add focused regression tests for buffer, dedup, and ordering edge cases

Exit criteria:
- Duplicate telematics events do not produce duplicate risk score entries
- Out-of-order events are handled without corrupting score history
- Ingestion health is visible to platform admins without raw DB access
- All telematics dedup tests pass; zero TypeScript errors

---

### Sprint 39: PWA and Offline Field Operations
Status: Planned

User stories:
- As a field technician without reliable cell service, I can complete and submit DVIR inspections offline and have them sync when I reconnect.
- As a technician, I can view my assigned work orders and equipment details without an internet connection.
- As the platform, offline data queued by technicians syncs automatically and without data loss when connectivity is restored.

Goal:
- Address Known Risk #2: deliver offline-capable PWA for field technicians using IndexedDB and a service worker sync queue.

Scope:
- Configure Vite PWA plugin (`vite-plugin-pwa`) with a service worker and manifest
- Implement `offlineQueueService.ts` using IndexedDB (via `idb`) for queuing inspection submissions and WO status updates
- Add sync trigger on `online` event that flushes the queue through the real service layer
- Add conflict resolution strategy for records modified both offline and online
- Add "Offline" mode banner in the UI when `navigator.onLine` is false
- Add sync status indicator showing pending items count
- Add focused tests for queue enqueue/dequeue, sync trigger, and conflict handling

Exit criteria:
- Technician can submit an inspection while offline; it persists in IndexedDB
- On reconnect, queued inspections sync to Supabase without duplication
- Conflict between local and remote edits is resolved predictably (last-write or flagged for review)
- Offline banner appears/disappears correctly; sync count is accurate

---

### Sprint 40: FMCSA Live Integration and Carrier Data Completion
Status: Planned

User stories:
- As a compliance lead, I can look up a carrier's live FMCSA safety rating, inspection history, and crash data directly in the app.
- As a fleet manager, I can see CSA BASIC scores populated from real FMCSA data, not manually entered estimates.
- As the platform, all carrier data calls have production-grade fallbacks, retry logic, and error messaging — no mock/dev patterns remain in `carrierService`.

Goal:
- Complete the FMCSA module from a static/demo page into a live integration and remove all remaining mock fallback patterns in `carrierService`.

Scope:
- Replace `carrierService` mock patterns with real FMCSA API calls (SAFER Web or FMCSA API v1)
- Add carrier safety rating, inspection totals, crash totals, and OOS rate to the carrier health panel
- Wire CSA BASIC score ingestion from FMCSA data into `CSAPredictor` as an additional source alongside real inspection records
- Add FMCSA alert rules: flag carriers below a configurable safety rating threshold
- Add retry/circuit-breaker pattern for FMCSA API unavailability
- Remove all `// TODO: mock` and development fallback branches in `carrierService.ts`
- Add integration tests with mocked HTTP layer (no live API calls in CI)

Exit criteria:
- `carrierService` contains zero mock/dev fallback patterns
- Carrier health lookup returns real FMCSA data in the UI
- CSA BASIC scores can be seeded from FMCSA data in addition to inspection records
- API unavailability shows a graceful degraded state, not an error crash

---

### Sprint 41: Advanced Filtering, Saved Views, and Bulk Operations
Status: Planned

User stories:
- As a fleet manager, I can save a filter preset (e.g., "Active OOS Equipment") and return to it without re-configuring filters every time.
- As a safety manager, I can select multiple drivers or tasks and bulk-update their status, assignee, or priority in one action.
- As a compliance lead, I can bulk-export filtered task or document lists to CSV for regulatory review.

Goal:
- Add saved filter views and bulk-action capability across the highest-traffic list views.

Scope:
- Add saved view persistence (user-scoped, stored in Supabase `user_saved_views` table) to: Tasks, Equipment, Drivers, Work Orders
- Add multi-select mode to task and driver list tables (checkbox column, select-all row)
- Add bulk actions for selected rows: Tasks → bulk status change, bulk assign; Drivers → bulk add to watchlist; Work Orders → bulk priority change
- Add CSV export for any filtered list view (Tasks, Equipment, Documents)
- Add saved view UI: save button, view picker dropdown, delete saved view
- Add tests for saved view CRUD and bulk action service methods

Exit criteria:
- Users can save, load, and delete filter views on Tasks, Equipment, Drivers, and Work Orders
- Bulk status update applies to all selected rows in a single operation
- CSV export reflects current filtered results accurately

---

### Sprint 42: Driver Self-Service Portal and Mobile-Optimized Views
Status: Planned

User stories:
- As a driver, I can log into a simplified view and see my current risk score, open training assignments, and any coaching check-ins due.
- As a driver, I can acknowledge a coaching plan, complete a training attestation, and view my own safety event history without manager access.
- As the platform, driver-facing views are mobile-responsive so drivers can use them on a phone without layout breakage.

Goal:
- Add a driver-scoped portal experience with mobile-first layout for the views drivers actually use.

Scope:
- Add `DriverPortal` route gated to `driver` role: dashboard card showing risk score, open trainings, pending check-ins
- Add driver training completion/attestation flow (acknowledge and mark complete without manager)
- Add driver coaching check-in acknowledgment (driver confirms receipt of coaching plan)
- Audit and fix mobile breakpoints on the top 6 most-used pages: Dashboard, Driver Portal, Tasks, Training, Notifications, Work Orders
- Add role guard that redirects `driver` role to portal instead of full app layout
- Add driver portal tests for role-gated access and attestation flow

Exit criteria:
- `driver` role users land on the portal, not the full management dashboard
- Drivers can complete a training attestation end-to-end without manager intervention
- Portal is fully usable on a 375px-wide mobile screen with no horizontal scroll

---

### Sprint 43: Notification Rules, Escalation, and Delivery Preferences
Status: Planned

User stories:
- As a safety manager, I can configure which events trigger notifications and at what thresholds (e.g., alert me when a driver's risk score exceeds 75).
- As a team lead, I can set my notification delivery preferences: in-app only, email digest, or both.
- As the platform, overdue items that go unacknowledged escalate automatically to the next-level owner after a configurable grace period.

Goal:
- Evolve the notification system from a read-only badge into a configurable rules and escalation engine.

Scope:
- Add `notification_rules` table: rule type, threshold value, org_id, created_by
- Add `notificationRulesService.ts`: CRUD for rules, rule evaluation against live data
- Add notification preferences UI in Settings: per-category toggle (in-app/email), digest frequency
- Add email digest Edge Function: batches unread notifications and sends via Supabase email
- Add escalation trigger: tasks/check-ins overdue by >N days are automatically escalated to manager and create an escalation notification
- Add Notification Rules section to Admin Dashboard (org admin and above)
- Add tests for rule evaluation logic and escalation trigger service

Exit criteria:
- Custom notification rules can be created, edited, and deleted by org admins
- Email digest Edge Function sends correctly batched notification summaries
- Overdue items escalate after the configured grace period without manual intervention

---

### Sprint 44: Audit Trail UI, Compliance Reporting, and Data Governance
Status: Planned

User stories:
- As a compliance officer, I can pull a complete audit trail for any driver, asset, or document and export it as a PDF or CSV for regulatory submission.
- As a platform admin, I can define and enforce data retention policies by record type and see which records are candidates for archival or deletion.
- As the business, our audit log captures all writes, approvals, and role-changes with actor, timestamp, and before/after values.

Goal:
- Harden the audit trail into a compliance-grade system with report export and retention enforcement.

Scope:
- Extend `auditLogService` to capture before/after values for record mutations (role changes, WO closeouts, coaching plan state changes)
- Add per-entity audit trail view: accessible from driver profile, asset detail, and document detail panels
- Add compliance report generator: user selects entity type + date range → produces formatted summary (PDF via `jsPDF` or CSV)
- Add data retention enforcement job (Edge Function or cron): archives records past retention threshold after admin confirmation
- Add retention dashboard in Admin → Data Retention tab: candidates listed, bulk archive action
- Add tests for audit capture completeness and retention candidate filtering

Exit criteria:
- Audit log captures before/after values for all major mutation types
- Compliance report can be generated and downloaded in PDF or CSV for any entity
- Retention enforcement correctly identifies and archives records past threshold without deleting active records

---

### Sprint 45: Webhook and External Integration Framework
Status: Planned

User stories:
- As an integration engineer, I can register an outbound webhook endpoint and have the app send real-time event payloads when key events occur (inspection failed, WO closed, risk score changed).
- As an ops lead, I can see integration health: last delivery, response status, retry count, and failure reason for each webhook.
- As the platform, inbound telematics and FMCSA payloads are validated, logged, and processed through a shared integration pipeline.

Goal:
- Build a first-class webhook and integration framework so external systems can reliably push and pull data.

Scope:
- Add `webhooks` table: endpoint URL, secret, event types, org_id, active flag
- Add `webhookService.ts`: registration CRUD, payload signing (HMAC-SHA256), delivery with retry (3 attempts, exponential backoff)
- Add webhook delivery log table and delivery history UI in Admin → Integrations tab
- Add inbound webhook receiver Edge Function for telematics providers (validates signature, enqueues event)
- Add integration health panel: per-webhook last delivery, status code, failure rate
- Add webhook management UI: register endpoint, select event types, test delivery, view delivery log
- Add tests for signing, delivery, retry, and failure recording

Exit criteria:
- Outbound webhooks fire on inspection failure, WO closeout, and risk score change events
- Webhook delivery failures are logged and retried without data loss
- Integration health is visible to platform admins without raw DB access

---

### Sprint 46: Performance, Pagination, and Query Optimization
Status: Planned

User stories:
- As a fleet manager at a large org, list views with 500+ records load in under 2 seconds and remain responsive as I scroll.
- As a user, I can paginate or infinitely scroll any large list without loading all records upfront.
- As engineering, we have identified and resolved the top 5 N+1 query patterns discovered during Wave 1 onboarding.

Goal:
- Address performance regressions and scalability gaps surfaced by real-world data volume during Wave 1.

Scope:
- Audit all major list views for N+1 query patterns; resolve top 5 (driver list + risk events, equipment list + WO counts, tasks + assignees, training + completion status, documents + expiry)
- Add cursor-based or offset pagination to: Drivers, Equipment, Work Orders, Tasks, Audit Log
- Add virtual scrolling (`@tanstack/virtual`) to notification panel and activity feeds with 100+ rows
- Add React Query (or SWR) for request deduplication and cache-first reads on frequently-accessed service calls
- Add performance regression tests: assert page loads with N=200 records complete within target time (using vitest-bench or similar)
- Add `loadingMore` state and "Load more" / infinite scroll trigger to paginated lists

Exit criteria:
- Driver, Equipment, Work Order, Tasks, and Audit Log lists paginate correctly and do not load all rows on mount
- Top 5 N+1 patterns are resolved with combined queries or batch fetches
- Notification panel and activity feeds use virtual scrolling and do not render >200 DOM rows

---

### Sprint 47: Role-Based Dashboard Personalization and Pinned KPIs
Status: Planned

User stories:
- As a safety manager, my dashboard shows safety-centric KPIs (high-risk drivers, open interventions, coaching plan completion) by default, not generic fleet metrics.
- As a fleet manager, I can pin the metrics most relevant to my daily workflow and hide sections I don't use.
- As an executive, I see a high-level cross-functional scorecard without operational noise.

Goal:
- Personalize the dashboard experience by role with user-configurable widget pinning.

Scope:
- Add role-aware default widget sets: `safety` role → safety KPIs first; `maintenance` role → WO/PM KPIs first; `full`/executive → balanced scorecard
- Add `user_dashboard_preferences` table: pinned widgets, widget order, hidden widgets
- Add drag-and-drop widget reordering using `@dnd-kit/sortable`
- Add widget pin/hide controls (gear icon or context menu per widget)
- Add "Reset to defaults" option per role
- Add tests for default widget set by role and preference persistence

Exit criteria:
- Safety manager role sees safety-first dashboard on first login
- Pinned widget order persists across sessions
- Drag-and-drop reordering works without page reload

---

### Sprint 48: Customer Onboarding Wizard and Org Self-Service Provisioning
Status: Planned

User stories:
- As a new customer admin, I can complete a guided setup wizard that walks me through adding my first drivers, assets, and configuring my org settings without engineering support.
- As a platform admin, I can provision a new org and seed it with demo data or import a CSV of drivers and assets in one flow.
- As customer success, I can view org setup completion status and see what steps a new customer has or hasn't completed.

Goal:
- Replace manual customer provisioning with a self-service onboarding flow, reducing time-to-value for new orgs.

Scope:
- Add `onboarding_progress` table: step name, completed_at, skipped, org_id
- Add `OnboardingWizard.tsx`: multi-step modal shown on first login to org admin — steps: org config, invite users, add first asset, add first driver, configure notifications
- Add wizard progress persistence: each completed step saves to `onboarding_progress`
- Add CSV import for drivers and equipment (parse, validate, preview, confirm, persist)
- Add org setup completion card to Admin Dashboard: shows % complete with deep links to incomplete steps
- Add platform admin org provisioning flow: create org, set plan tier, seed demo data toggle
- Add tests for wizard step progression, CSV validation, and completion tracking

Exit criteria:
- New org admin can complete onboarding wizard and have a functional org configured end-to-end
- CSV import correctly validates and persists driver and equipment records
- Org setup completion is visible to platform admins in the Admin Dashboard

---

### Sprint 49: Platform Observability, Feature Flags, and SRE Tooling
Status: Planned

User stories:
- As engineering, we can see real-time error rates, slow queries, and failed background jobs from inside the app without needing raw Supabase logs.
- As a product lead, I can gradually roll out a new feature to a subset of orgs using a feature flag without a code deploy.
- As on-call, I have a runbook-backed incident response page that surfaces the current system health, recent errors, and recovery actions.

Goal:
- Establish production observability and feature flag infrastructure for safe, incremental deployments.

Scope:
- Add `feature_flags` table: flag name, enabled, rollout_percentage, allowed_org_ids, org_id (null = global)
- Add `featureFlagService.ts`: evaluate flag for current org/user, expose `useFeatureFlag(flagName)` hook
- Add Feature Flags management tab to Admin Dashboard (platform admin only): toggle flags, set rollout %, target orgs
- Integrate Sentry (or equivalent) error boundary capture — replace console.log in `ErrorBoundary.tsx` with structured error reporting
- Add `/health` Edge Function endpoint returning DB connectivity, last migration, and background job status
- Add Platform Health panel to Admin Dashboard: polls `/health`, shows status indicators and last-error timestamp
- Add SRE runbook tab to Hypercare command center with step-by-step recovery procedures for top 5 failure modes
- Add tests for feature flag evaluation (enabled, disabled, rollout %, org targeting)

Exit criteria:
- Feature flags can be toggled per-org from Admin Dashboard without code deploy
- Error boundary sends structured error reports to Sentry (or equivalent)
- `/health` endpoint returns correct status and is monitored from the platform health panel

---

### Sprint 50: Security Hardening, Penetration Testing Remediation, and Secrets Audit
Status: Planned

User stories:
- As the business, we have completed a structured security review and resolved all high and critical findings before expanding beyond Wave 1.
- As engineering, all secrets, API keys, and sensitive config are stored in Supabase Vault or environment variables — no hardcoded credentials remain anywhere in the codebase.
- As a platform admin, PII fields in the database are encrypted server-side, completing the migration started in Sprint 31.

Goal:
- Complete the security hardening work deferred from RC1 and resolve all findings from the Wave 1 security review.

Scope:
- Audit entire codebase for hardcoded secrets, keys, or credentials using `semgrep` SAST rules; resolve all findings
- Migrate PII encryption from client-side AES-GCM to server-side Edge Function (completing the `VITE_USE_EDGE_CRYPTO` migration path from Sprint 31)
- Add Supabase Vault storage for the server-side AES-256-GCM key used in the `encrypt-pii` Edge Function
- Conduct structured threat model review of RBAC and RLS policies; patch any gaps found
- Add Content Security Policy headers to the Vite/Vercel deployment config
- Add `semgrep` scan to CI pipeline as a required check on PRs touching service or auth layers
- Document completed security posture in `/docs/sprint-50/security-posture.md`
- Add regression tests confirming PII round-trips through Edge Function correctly

Exit criteria:
- Zero hardcoded credentials found by `semgrep` SAST scan
- PII encryption runs server-side via Edge Function in production; client-side path is disabled
- CSP headers are present and block inline scripts
- RBAC/RLS threat model gaps are patched and documented

---

### Sprint 51: Wave 2 Launch Preparation, Load Testing, and GA Readiness
Status: Planned

User stories:
- As the business, we can onboard Wave 2 customer cohort with confidence that the system handles 10× Wave 1 data volume without degradation.
- As a customer success lead, we have a comprehensive help center, in-app guided tours, and a partner API foundation for Wave 2 integrations.
- As engineering, we have run load tests, validated backup/restore at scale, and have a capacity plan for Wave 2.

Goal:
- Complete all GA readiness activities required to expand beyond Wave 1 cohort.

Scope:
- Run k6 or Artillery load test simulating 10× Wave 1 concurrent users; document results and resolve any P0/P1 findings
- Validate backup and point-in-time restore at production data scale (Supabase PITR)
- Add in-app guided tour (`react-joyride` or similar) for first-time users of: Dashboard, Safety, Equipment, Tasks
- Add partner API foundation: read-only REST endpoints for drivers, equipment, and safety events with API key auth (Edge Functions)
- Complete help center content for all major workflows (inline help panels, tooltip expansions)
- Produce Wave 2 capacity plan: database size projections, Edge Function invocation budgets, storage estimate
- Update `/docs/sprint-51/ga-readiness.md` with go-live checklist for Wave 2

Exit criteria:
- Load test at 10× Wave 1 completes without P0/P1 failures
- Backup/restore validated at scale with documented RTO/RPO
- Partner API endpoints return correctly scoped data with API key auth
- In-app guided tour covers the 5 highest-traffic new-user flows

---

## Final Project Status
**RC1 Launch Ready — Sprints 31–37 post-launch hardening applied.**
Phase 1 (Sprints 1-30) complete. Sprints 31–37 closed remaining operational, UX, and resilience gaps: Watchlist intervention hub, CSA live data, PII encryption abstraction, Driver timeline, Tasks overdue surfacing, User Profile Supabase migration, Header live profile + real notification center, global ⌘K search, route-level error boundaries, shared notification context with 60s polling, sidebar live badge counts, dashboard manual refresh, and inspection-to-work-order pipeline with inline WO creation and service history tab. Sprints 38–51 are planned and represent the Wave 1 → GA hardening, feature completion, and Wave 2 readiness roadmap.

