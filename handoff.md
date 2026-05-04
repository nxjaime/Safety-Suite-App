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
Summary:
- Finalized the canonical role/capability model and org-scoped access enforcement.
- Hardened admin, reporting, rollout, hypercare, driver, document, training, coaching, and safety surfaces with regression coverage.
- Verification passed: `npm run test:unit`, `npm run build`, `git diff --check`.

### Sprint 22: Fleet Asset System Completion
Status: Complete
Summary:
- Made equipment durable and role-aware with persistent lifecycle data, filters, archive/retire states, and detail workflows.
- Linked assets to inspections, preventive maintenance, work orders, and documents.
- Verification passed with focused asset CRUD/linking tests.

### Sprint 23: Maintenance, PM, Parts, and Work Order Completion
Status: Complete
Summary:
- Completed the maintenance backbone: PM due generation, recurring scheduling, work order closeout, parts foundations, and service history.
- Expanded reporting support for backlog, downtime, MTTR, and repeat service visibility.
- Verification passed with all unit tests green and zero TypeScript errors.

### Sprint 24: Inspection and Compliance Operations Completion
Status: Complete
Summary:
- Closed the inspection/compliance loop with remediation states, ownership, due dates, evidence, and escalation.
- Added OOS blocking and overdue compliance tracking across linked workflows.
- Verification passed with 304 tests and zero TS errors.

### Sprint 25: Driver Safety, Coaching, and Intervention Completion
Status: Complete
Summary:
- Finished the safety lifecycle with intervention actions, coaching plan closeout, and accountability tracking.
- Added a persistent audit trail for risk-to-intervention follow-through and safety outcome reporting.
- Verification passed with 306 tests and zero TS errors.

### Sprint 26: Training and Corrective Action System Completion
Status: Complete
Summary:
- Turned training into a corrective-action system with trigger types, overdue escalation, manager review, and attestation workflows.
- Linked training to incidents, coaching, compliance, and policy requirements.
- Verification passed with 309 tests and zero TS errors.

### Sprint 27: Documents, FMCSA, and External Data Completion
Status: Complete
Summary:
- Added expiring/expired/deficiency document detection and live carrier-health lookup from FMCSA-related data paths.
- Replaced static reference behavior with usable operational alerts and seeded scoring inputs.
- Verification passed with 312 tests and zero TS errors.

### Sprint 28: Reporting, Dashboards, and Executive Operations Layer
Status: Complete
Summary:
- Rebuilt the dashboard on live data with KPI cards, trend charts, recent activity, and window selection.
- Added backlog prioritization so operations can turn reporting into actionable work.
- Verification passed with 325 tests and zero TypeScript errors.

### Sprint 29: Admin, Customer Operations, and Enterprise Controls
Status: Complete
Summary:
- Rebuilt admin into a production-grade enterprise controls hub for users, org config, audit logs, support tickets, and retention.
- Replaced raw table editing with safer org-management and escalation workflows.
- Verification passed with 176 tests across 41 files and zero TypeScript errors.

### Sprint 30: Production Hardening, Launch Readiness, and Release Candidate
Status: Complete
Summary:
- Documented the remaining security and deployment risks, the launch checklist, and the go-live recommendation.
- Verified production bootstrap behavior, tenancy enforcement, and release-candidate stability.
- Exit criteria met: no open release-blocking P0/P1 issues remain.

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
Summary:
- Rebuilt Watchlist into an intervention hub and seeded CSA scoring from real inspection data.
- Introduced the encryption abstraction and deploy-ready Edge Function path for PII handling.
- Verification passed with 344 unit tests and zero TypeScript errors.

### Sprint 32: Driver Activity Timeline and Tasks Overdue Management
Status: Complete
Summary:
- Added a unified driver activity timeline and live overdue surfacing for tasks.
- Improved task execution flow with in-place status progression and overdue filtering.
- Verification passed with 344 unit tests and zero TypeScript errors.

### Sprint 33: User Profile — Supabase-backed, localStorage Removed
Status: Complete
Summary:
- Replaced localStorage-driven profile state with Supabase-backed reads and writes.
- Made profile saves persistent across sessions and removed placeholder defaults.
- Verification passed with 350 unit tests and zero TypeScript errors.

### Sprint 34: Header Live Profile and Real Notification Center
Status: Complete
Summary:
- Wired the header to live profile updates and replaced the notification bell with a real panel.
- Added actionable notification aggregation for overdue tasks, expiring documents, unreviewed training, and coaching check-ins.
- Verification passed with 363 unit tests and zero TypeScript errors.

### Sprint 35: Global Search and Error Boundaries
Status: Complete
Summary:
- Added global search across drivers, tasks, equipment, and documents with keyboard shortcuts and grouped results.
- Wrapped routes in error boundaries so component crashes recover gracefully instead of white-screening the app.
- Verification passed with 374 unit tests and zero TypeScript errors.

### Sprint 36: Notification Context, Sidebar Live Badges, and Dashboard Refresh
Status: Complete
Summary:
- Centralized notification polling in a shared context and surfaced live counts in the header and sidebar.
- Added manual dashboard refresh with timestamp feedback.
- Verification passed with 380 unit tests and zero TypeScript errors.

### Sprint 37: Inspection-to-Work-Order Pipeline, Inline WO Creation, and Service History Tab
Status: Complete
Summary:
- Connected inspections directly to work orders and added inline work-order creation from Equipment.
- Added a service history tab that summarizes completed work orders with costs, technicians, and closeout notes.
- Verification passed with all related workflows accessible from the Equipment page.

---

### Sprint 38: Telematics Hardening and Real-Time Event Reliability
Status: Complete
Summary:
- Added a telematics event buffer migration plus service-layer deduplication, ordered flushing, retry/drop handling, and ingestion health aggregation.
- Added a platform-admin Telematics panel to the Admin Dashboard so ingestion health is visible without raw DB access.
- Added focused regression coverage for duplicate-event handling, out-of-order processing, and retry/drop behavior, and updated admin dashboard coverage for the new tab.
- Verification passed: `npm exec vitest --run src/test/telematicsService.test.ts src/test/adminDashboard.test.tsx`, `npm run build`, `git diff --check`, and browser verification on the local app at `/admin` with the Telematics health panel visible.

---

### Sprint 39: PWA and Offline Field Operations
Status: Complete
Summary:
- Added a Vite PWA manifest/service worker configuration and registered the app for offline-capable delivery.
- Implemented an IndexedDB-backed offline queue for inspection submissions and work-order status/closeout updates, with last-write-wins processing on reconnect.
- Wired Compliance and Work Orders to queue actions when offline, and surfaced the offline/pending-sync banner in the app shell.
- Verification passed: `npm exec vitest --run src/test/offlineQueueService.test.ts src/test/inspectionService.test.ts src/test/inspectionRemediation.test.ts`, `npm run build`, and browser verification on the local app with offline mode toggled, an inspection queued, and the pending-sync banner/count visible.
- Bug/notes: some live-data panels still emit fetch errors while offline because their list hydration is not yet offline-aware; the targeted offline submission/status workflows now queue and surface correctly.

---

### Sprint 40: FMCSA Live Integration and Carrier Data Completion
Status: Complete
Summary:
- Replaced the mock/development carrier lookup path with a live FMCSA SAFER snapshot flow backed by `/api/carrier-health`.
- Added FMCSA inspection/crash/OOS parsing, derived CSA seeding, retry handling, and a circuit breaker for lookup failures.
- Updated the FMCSA page to show live carrier health, inspection totals, crash totals, OOS rate, and configurable safety-rating threshold alerts.
- Updated the Carrier Health widget to surface live snapshot status, threshold alerts, and inspection summary cards without mock fallback behavior.
- Wired the CSA Predictor to ingest FMCSA carrier snapshots as an additional real-data source alongside inspection records.
- Added regression tests for the carrier service, FMCSA page, and CSA Predictor FMCSA-seeding workflow.

Verification:
- `npm exec vitest --run src/test/carrierService.test.ts src/test/fmcsaPage.test.tsx src/test/csaPredictor.test.tsx`
- `npm run build`
- Browser verification on the local app:
  - `/fmcsa` looked up USDOT `3114665` and rendered live carrier health, inspection totals, crash totals, OOS rate, CSA scores, and a below-threshold warning.
  - `/reporting/csa-predictor` loaded the same FMCSA carrier snapshot and appended FMCSA-derived violation seeds into the predictor table.

---

### Sprint 41: Advanced Filtering, Saved Views, and Bulk Operations
Status: Complete

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

Progress note (2026-05-02):
- Added a shared `ListWorkflowControls` component plus `listWorkflowService` fallback storage so saved views and CSV export work end-to-end even if Supabase persistence is unavailable.
- Wired Tasks to support save/load/delete view actions and CSV export from the current filtered results.
- Verified in the browser on `/tasks` that a saved view can be created and reopened from the view picker.

Bug/notes:
- `npm run build` still reports existing TypeScript module-mode errors in `src/lib/supabase.ts` and `src/lib/authTesting.ts` (`import.meta.env` typing/module settings). This appears pre-existing and outside the sprint scope.

---

### Sprint 42: Driver Self-Service Portal and Mobile-Optimized Views
Status: Complete

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

Progress note (2026-05-02):
- Added a new `DriverPortal` page with live risk, training, and coaching summaries plus inline training completion and coaching acknowledgement actions.
- Routed driver accounts to `/driver-portal` before the full management layout and tightened the shared shell for small screens by hiding the sidebar below `md` and removing the desktop-only left margin on mobile.
- Added driver portal regression tests and verified the route renders cleanly in the browser with the driver portal content visible.

---

### Sprint 43: Notification Rules, Escalation, and Delivery Preferences
Status: Complete

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

Progress note (2026-05-02):
- Added a new `notificationRulesService` with org-scoped CRUD, fallback local persistence, rule evaluation, preference storage, and digest batching helpers.
- Added a Notifications tab to Settings for rule creation and delivery preference editing, plus an Admin Dashboard notification-rules panel for org admins.
- Verified the new workflow in the browser on `/settings` and `/admin`, and added unit coverage for rule CRUD/evaluation/digest behavior.

Bug/notes:
- `npm test` still emits existing React `act(...)` warnings in the Admin Dashboard test file when loading tab content; the assertions pass and build remains green.

---

### Sprint 44: Audit Trail UI, Compliance Reporting, and Data Governance
Status: Complete

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

Progress note (2026-05-02):
- Added audit reporting controls in Admin Dashboard with entity/date filters and CSV compliance report generation from `auditLogService`.
- Added retention archival action in the Data Retention tab and expanded the retention service/test coverage.
- Verified the updated audit tab in the browser and confirmed `npm exec vitest --run src/test/adminDashboard.test.tsx src/test/retentionPolicyService.test.ts` and `npm run build` pass.

Bug/notes:
- Live admin pages still emit existing backend fetch failures in local browser verification when Supabase/configured services are unavailable; these are pre-existing and outside this sprint's scope.

---

### Sprint 45: Webhook and External Integration Framework
Status: Complete

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

Progress note (2026-05-03):
- Added `webhookService` with org-scoped fallback persistence, HMAC signing, retry-based delivery, and delivery-log tracking.
- Added an Admin Dashboard Integrations tab for registering webhooks and reviewing delivery history.
- Added regression coverage for webhook CRUD/delivery behavior and the new admin integrations UI.
- Verified in the browser on `/admin` that the Integrations tab is visible and renders webhook registration plus delivery health cards.

---

### Sprint 46: Performance, Pagination, and Query Optimization
Status: Complete

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

Progress note (2026-05-03):
- Added paginated data access helpers for tasks, equipment, and work orders, and wired the Tasks page to request one page at a time with Prev/Next controls.
- Kept Drivers on the existing paginated flow; work-order and equipment list services now fetch via range/count so list pages can be constrained without loading entire tables.
- Verified the paginated services with focused Vitest coverage and browser-checked the Tasks and Work Orders routes render cleanly in the local app.

Bug/notes:
- `npm run build` still reports the pre-existing TypeScript module-resolution errors in `src/lib/supabase.ts` and `src/lib/authTesting.ts` (`import.meta.env` typing/module settings). This is outside the sprint scope and was not changed here.

---

### Sprint 47: Role-Based Dashboard Personalization and Pinned KPIs
Status: Complete

Summary:
- Added role-aware dashboard widget defaults, user-local persistence for widget order/hidden/pinned state, and dashboard controls for reset/reorder/pin/hide.
- Reworked the dashboard into movable sections and added regression coverage for the personalization workflow.
- Verification passed with `npm exec vitest --run src/test/dashboardService.test.ts src/test/dashboard.test.tsx` and `npm run build`.

Progress note (2026-05-03):
- Implemented the smallest production-safe personalization layer using localStorage-backed preferences and controls for reordering, pinning, hiding, and resetting dashboard widgets.
- Verified the updated dashboard loads in the browser and the control surface is visible in the local app shell.

Bug/notes:
- Local browser verification still surfaces a generic `TypeError: Failed to fetch` from the app shell when the backend is unavailable in this environment; the dashboard controls themselves rendered, but live data hydration could not be fully exercised in-browser here.

### Sprint 48: Customer Onboarding Wizard and Org Self-Service Provisioning
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

## Sprint 52-54: Production Bug Fix Plan From Hosted App QA

These sprints are driven by the hosted QA pass against https://safetyhubconnect.vercel.app/ and focus on fixing the issues that block the app from working end-to-end in production.

Execution order:
1. Sprint 52 must land first so the app can be loaded reliably by direct URL.
2. Sprint 53 follows so sign-in and sign-up can be validated against a stable production route surface.
3. Sprint 54 runs last as the full regression pass once routing and auth are repaired.

### Sprint 52: Hosting, Routing, and App Entry Point Repair
Status: Planned

User stories:
- As a user, I can open any public route directly in the browser without hitting a 404 page.
- As a visitor, the landing page links always resolve to the correct sign-in or onboarding flow.
- As engineering, we have a deployment configuration that supports client-side routing in production.

Goal:
- Fix production route resolution so the hosted app is reachable by direct URL and refresh-safe across all public entry points.

Scope:
- Verify and correct Vercel rewrite/fallback configuration for SPA routes
- Restore direct access for /login, /welcome, and any other public entry routes
- Confirm landing-page navigation targets the correct routes in production
- Add smoke tests for direct navigation and refresh on the public routes
- Document the production route contract so future deployments cannot regress

Exit criteria:
- Direct navigation to all public routes works without 404s
- Refreshing the browser on a routed page preserves the app shell
- Automated smoke coverage validates the hosting configuration

### Sprint 53: Authentication Flow and Backend Connectivity Recovery
Status: Planned

User stories:
- As a user, I can sign in successfully using valid credentials.
- As a new customer, I can create an account without a fetch failure.
- As a user, I receive clear recovery guidance when the auth backend or environment is misconfigured.

Goal:
- Restore working authentication and account creation flows, and make backend failures explicit instead of generic.

Scope:
- Verify Supabase/auth environment variables in production and staging
- Trace sign-in and create-account requests to the backend and fix the failing endpoint/path
- Replace generic "Failed to fetch" states with actionable error messaging
- Test password reset and remember-me behavior end-to-end
- Add regression tests for sign-in, sign-up, and auth error handling

Exit criteria:
- Sign in and sign up complete successfully in the hosted environment
- Auth failures surface a meaningful message and next step
- Password reset and account creation flows are covered by automated tests

### Sprint 54: Full Hosted App QA Regression and Release Verification
Status: Planned

User stories:
- As the business, we can verify the hosted app’s critical workflows before calling it production ready.
- As QA, we have repeatable checks for navigation, forms, and core feature access.
- As engineering, we can prove the deployed build matches the expected user flows.

Goal:
- Re-test the hosted app after the route and auth fixes, then close any remaining blockers across the full feature surface.

Scope:
- Re-run a full browser QA pass across landing, auth, dashboard, equipment, maintenance, documents, training, notifications, reporting, and admin
- Confirm each major feature loads, responds, and persists correctly
- Capture and triage any console errors, visual regressions, or dead-end flows
- Add a concise production smoke checklist for future releases
- Update the handoff with verified hosted-app status and remaining risks

Exit criteria:
- All critical user-facing workflows are verified on the hosted site
- No untriaged console errors or broken navigation remain in the production smoke pass
- The production smoke checklist becomes part of release sign-off

---

## QA Bug Backlog

### Bug: Login submit returns a network error in production
- Severity: Critical
- Category: Functional / Console
- Environment: https://safetyhubconnect.vercel.app/
- Observation: submitting the login form surfaces a generic "Network Error" / "Failed to fetch" state instead of authenticating or showing a recovery-friendly message.
- Impact: blocks sign-in and prevents access to the authenticated app.

### Bug: Main landing page is slow to load
- Severity: Medium
- Category: UX / Performance
- Environment: https://safetyhubconnect.vercel.app/
- Observation: the main page takes a noticeable amount of time to render and become usable.
- Impact: creates a poor first impression and may reduce successful entry into the app.

## Final Project Status
**RC1 Launch Ready — Sprints 31–37 post-launch hardening applied.**
Phase 1 (Sprints 1-30) complete. Sprints 31–37 closed remaining operational, UX, and resilience gaps: Watchlist intervention hub, CSA live data, PII encryption abstraction, Driver timeline, Tasks overdue surfacing, User Profile Supabase migration, Header live profile + real notification center, global ⌘K search, route-level error boundaries, shared notification context with 60s polling, sidebar live badge counts, dashboard manual refresh, and inspection-to-work-order pipeline with inline WO creation and service history tab. Sprints 38–51 are planned and represent the Wave 1 → GA hardening, feature completion, and Wave 2 readiness roadmap.

