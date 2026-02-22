# Safety Suite App Handoff

## Purpose
This document defines a 10-sprint path to make the application production-shippable as a hybrid of:
- Fleetio-style fleet operations (asset, maintenance, inspections, parts/work orders)
- Idelic-style safety intelligence (driver risk scoring, intervention workflows, coaching, compliance)

The plan is grounded in the current React + Vite + Supabase + Vercel architecture.

## Product Direction (Target Blend)

### Fleetio-Like Capabilities (Operations)
- Fleet asset registry and lifecycle tracking
- Preventive maintenance scheduling and service history
- Work order management
- Equipment inspections and defect tracking
- Document management for vehicles/drivers

### Idelic-Like Capabilities (Safety)
- Driver risk profiles and safety scorecards
- Event-based risk ingestion (telematics + violations/incidents)
- Coaching plans with check-ins and outcomes
- Intervention workflows and accountability tracking
- Compliance visibility and action queues

## Current Codebase Review (High-Level)

### Strengths
- Core app shell and routing exist (`src/App.tsx`, `src/components/Layout/*`).
- Domain services are in place (`src/services/*`).
- Supabase auth and data wiring are functional (`src/lib/supabase.ts`, `src/contexts/AuthContext.tsx`).
- RLS hardening work has started (`supabase/migrations/secure_rls_policies.sql`).

### Critical Gaps Blocking Production
- Sensitive data encryption currently depends on client-side secret handling (`src/utils/crypto.ts`).
- Some pages still use static/mock placeholders (`src/pages/Dashboard.tsx`, `src/pages/Documents.tsx`, `src/pages/Training.tsx`).
- Type safety and test coverage are insufficient for release confidence.
- Historical schema/policy drift risk exists across baseline SQL and migrations.
- Operational readiness (monitoring, DR drills, release gates) is incomplete.

## Definition of Shippable
A release candidate is shippable when:
- No open P0/P1 security or tenancy-isolation findings
- Core operational and safety workflows pass automated and manual QA
- Database performance meets agreed SLAs under production-like load
- Observability, backup/restore, and incident runbooks are validated

## Sprint Framework
- Sprint length: 2 weeks
- Team: PM, UX designer, 2-3 full-stack engineers, QA/SDET, part-time security
- Cadence: refinement weekly, demo + retro at sprint end

## Sprint Commit Protocol
- At sprint completion, create one scoped commit containing:
  - Updated sprint status in `handoff.md`
  - Sprint artifacts under `docs/sprint-<n>/`
  - Any CI/process updates required for that sprint
- Commit message format: `sprint-<n>: <outcome summary>`
- Push only after all sprint checks/tests pass (build, tests, and any required CI gates).
- Add a sprint-close reminder item under each sprint section: `Commit & push after checks/tests pass`.
- Push immediately after the checks are green to `origin/main` (or active release branch if defined).
- If push fails due auth/branch protection, resolve within the same sprint closeout window.

---

## 10-Sprint Roadmap (+ Sprint 4.5 UI Overhaul)

### Sprint 1: Release Baseline and Product Alignment
Reminder: Commit & push after checks/tests pass.
- Goal: Align team on Fleetio + Idelic scope and establish quality gates.
- Scope:
  - Create release checklist and CI quality gates (lint, typecheck, tests).
  - Build route-by-route readiness matrix (Done / Partial / Mock / Blocked).
  - Finalize MVP scope boundaries for operations vs safety modules.
- Exit criteria:
  - Release criteria approved.
  - Top launch blockers prioritized with owners.

### Sprint 2: UX System and Navigation Refactor
Reminder: Commit & push after checks/tests pass.
- Goal: Deliver a unified UX foundation across all modules.
- Scope:
  - Define design tokens and component standards.
  - Standardize IA/navigation around Operations, Safety, Compliance, Reporting.
  - Implement accessibility baseline (WCAG AA).
- Exit criteria:
  - Shared design system active on core routes.
  - UX consistency baseline accepted by product/design.
Execution Status: Complete
Completed items:
Design tokens with Space Grotesk + Inter and safety palette.
Navigation IA updated with Operations/Fleet/Safety/Reporting/Settings.
Baseline accessibility improvements in navigation and header.
Baseline form styling and palette alignment across core pages.
Checks: `npm run test -- --run src/test` and `npm run build` passed.

### Sprint 3: Fleet Operations Core (Asset + Maintenance)
Reminder: Commit & push after checks/tests pass.
- Goal: Ship Fleetio-like operational core.
- Scope:
  - Expand equipment/vehicle model and lifecycle states.
  - Implement preventive maintenance schedules and service logs.
  - Add work order creation, assignment, and status tracking.
- Exit criteria:
  - End-to-end asset-to-work-order workflow is functional and tested.
Execution Status: Complete
Completed items:
Fleet operations data model added for `equipment`, `pm_templates`, `work_orders`, and `work_order_line_items`.
Equipment UI expanded with lifecycle states, ownership, usage tracking, and profile tabs.
Maintenance and Work Orders pages implemented and routed in app navigation.
Inspection out-of-service flow now auto-creates draft work orders.
Sprint artifacts added under `docs/sprint-3/`.
Checks: `npm run test -- --run src/test` and `npm run build` passed.
Pause Note: Sprint 3 PR created and merged; work paused after closeout.

### Sprint 4: Safety Intelligence Core (Risk + Coaching)
Reminder: Commit & push after checks/tests pass.
- Goal: Ship Idelic-like safety core.
- Scope:
  - Normalize driver risk model and scorecard definitions.
  - Harden risk event ingestion and scoring logic.
  - Standardize coaching plans, check-ins, and outcome tracking.
- Exit criteria:
  - Driver scorecards and coaching lifecycle are production-ready.
Execution Status: Complete
Started: `2026-02-22`
Completed: `2026-02-22`
Progress in latest session:
- Added migration `supabase/migrations/20260222020000_risk_events_score_history.sql` to normalize `risk_events`, create `driver_risk_scores`, add constraints/indexes, and enforce org-scoped RLS for risk/coaching tables.
- Implemented `src/services/riskService.ts` with event ingestion, composite score calculation (`0.6*motive + 0.4*local`), fallback motive score, score banding, and score-history persistence.
- Wired `src/services/driverService.ts` to risk service (`addRiskEvent`, `refreshRiskScore`, `getDriverRiskScoreHistory`, `getDriverRiskEvents`) and updated safety aggregations for live score/event/coaching metrics.
- Updated Sprint 4 UI surfaces:
  - `src/pages/Safety.tsx` now renders live risk/event/coaching metrics, score trend, and incident/risk distribution from database data.
  - `src/pages/Drivers.tsx` now shows banded risk pills, client-side risk band filter, and active coaching “Plan Assigned” status.
  - `src/pages/DriverProfile.tsx` now loads score history/events, logs normalized manual risk events, and supports explicit score recalculation.
- Added `src/test/riskService.test.ts` covering scoring formula, fallback behavior, band mapping, and score/history persistence side effects.
- Added Sprint 4 artifacts:
  - `docs/sprint-4/summary.md`
  - `docs/sprint-4/verification.md`
Checks run:
- `npm run test -- --run src/test/riskService.test.ts`
- `npm run test -- --run src/test/riskService.test.ts src/test/navigation.test.tsx`
- `npm run test -- --run src/test/schemas.test.ts`
- `npm run test -- --run src/test`
- `npm run build`
All passed in this workspace.
Follow-ons moved to Sprint 5+:
- Expand focused UI tests for Drivers and DriverProfile risk workflows.
- Reconcile legacy `supabase/schema.sql` drift while preparing next migration set.

### Sprint 4.5: UI Modernization Overhaul (Layout + Visual Language)
Reminder: Commit & push after checks/tests pass.
- Goal: Modernize interface layout, hierarchy, and color system to align with a premium fleet-safety operations product.
- Scope:
  - Define updated visual direction (typography, spacing, color tokens, component elevation, states).
  - Redesign app shell (sidebar, top bar, content frame) and normalize page-level layout patterns.
  - Refresh key modules first (`Dashboard`, `Drivers`, `DriverProfile`, `Safety`, `Equipment`, `Maintenance`, `Work Orders`).
  - Add interaction polish: loading skeletons, empty states, error states, and clear status semantics.
  - Maintain WCAG AA contrast and keyboard accessibility while redesigning.
- Exit criteria:
  - New design system tokens are applied across all core routes.
  - Legacy visual patterns are removed from prioritized routes.
  - Stakeholder sign-off confirms visual direction fits Fleetio + Idelic product intent.
Execution Status: Complete
Started: `2026-02-22`
Completed: `2026-02-22`
Completed items:
- Added Playwright-based progressive testing infrastructure:
  - `playwright.config.ts`
  - `e2e/smoke.spec.ts`
  - NPM scripts in `package.json`: `test:unit`, `test:e2e`, `test:smoke`, `test:progress`
  - CI updates in `.github/workflows/quality-gates.yml` to install Chromium and run UI smoke tests on PR/push.
- Added Playwright output ignores to `.gitignore`.
- Completed shell modernization baseline:
  - `src/components/Layout/Sidebar.tsx` refreshed for new visual direction.
  - `src/components/Layout/Header.tsx` simplified and modernized (removed theme switcher).
  - `src/components/Layout/Layout.tsx` spacing/frame updated for route consistency.
- Parallel page modernization completed:
  - `src/pages/Dashboard.tsx` refreshed with updated hierarchy and card/chart styling.
  - `src/pages/Safety.tsx` updated with modern section framing and actions.
  - `src/pages/Drivers.tsx` updated with modern section framing and actions.
  - `src/pages/DriverProfile.tsx` updated with modernized framing and action styling.
  - `src/pages/Equipment.tsx` updated with modern section framing and action styling.
  - `src/pages/Maintenance.tsx` updated with modern section framing and data card/table treatment.
  - `src/pages/WorkOrders.tsx` updated with modern section framing and data card/table treatment.
- Playwright smoke coverage expanded to assert redirects for `/drivers` and `/safety` when unauthenticated.
 - Playwright smoke coverage expanded to assert redirects for `/equipment`, `/maintenance`, and `/work-orders` when unauthenticated.
Checks run:
- `npm run test:unit`
- `npm run test:smoke`
- `npm run build`
All passed in this workspace.
Artifacts:
- `docs/plans/2026-02-22-sprint-4-5-ui-overhaul-design.md`
- `docs/plans/2026-02-22-sprint-4-5-ui-overhaul-implementation-plan.md`
- `docs/sprint-4-5/summary.md`
- `docs/sprint-4-5/verification.md`

### Sprint 5: Integrations Hardening (Motive/FMCSA/Email)
Reminder: Commit & push after checks/tests pass.
- Goal: Make external data and notification flows reliable.
- Scope:
  - Add retries, timeouts, backoff, and error normalization.
  - Add rate limits and strict request validation in API routes.
  - Implement integration health status and fallback behavior.
- Exit criteria:
  - Integration failures degrade gracefully with alerting.

### Sprint 6: Compliance + Documents + Inspection Workflows
Reminder: Commit & push after checks/tests pass.
- Goal: Close compliance execution loop.
- Scope:
  - Productionize document upload/storage/access controls.
  - Harden inspection flows and defect/remediation tracking.
  - Build compliance task queues tied to drivers/equipment.
- Exit criteria:
  - Compliance and document workflows are auditable end-to-end.

### Sprint 7: Security and Risk Hardening
Reminder: Commit & push after checks/tests pass.
- Goal: Remove high-risk technical debt and enforce trust boundaries.
- Scope:
  - Replace insecure client-side secret patterns for PII handling.
  - Enforce RBAC + tenant isolation patterns across app/services/DB.
  - Run security review pass and remediate high severity findings.
- Exit criteria:
  - No critical security issues open for release scope.

### Sprint 8: Database Optimization and Data Quality
Reminder: Commit & push after checks/tests pass.
- Goal: Scale performance and improve data correctness.
- Scope:
  - Query profiling + index strategy for high-traffic paths.
  - Add pagination/selective projections to reduce heavy queries.
  - Introduce data quality checks and reconciliation jobs.
- Exit criteria:
  - Core queries meet latency targets; data QA checks in place.

### Sprint 9: Reporting, Testing, and Observability
Reminder: Commit & push after checks/tests pass.
- Goal: Build release confidence and operational visibility.
- Scope:
  - Replace static dashboards with live metrics and filters.
  - Expand unit/integration/E2E coverage on critical workflows.
  - Add structured logging, tracing context, and alerting.
- Exit criteria:
  - Release pipeline blocks on critical regressions.
  - Dashboards and alerts support on-call operations.

### Sprint 10: UAT, Launch Readiness, and Hypercare
Reminder: Commit & push after checks/tests pass.
- Goal: Execute controlled production launch.
- Scope:
  - Pilot rollout + UAT sign-off.
  - Run go-live checklist and rollback rehearsal.
  - Execute post-launch hypercare and stabilization backlog triage.
- Exit criteria:
  - UAT complete, launch successful, KPIs stable in hypercare.

---

## Sprint 1 Detailed Draft (Immediate Start)

### Objective
Create the execution baseline required to ship safely in 10 sprints.

### Execution Status (Started)
- Status: `Complete`
- Started: `2026-02-21`
- Completed: `2026-02-21`
- Artifacts created:
  - `docs/sprint-1/release-readiness-checklist.md`
  - `docs/sprint-1/module-readiness-matrix.md`
  - `docs/sprint-1/launch-blockers.md`
  - `docs/sprint-1/nfr-targets.md`
  - `docs/sprint-1/quality-gate-status.md`
  - `docs/sprint-1/mvp-feature-map.md`
  - `docs/sprint-1/pr-merge-criteria.md`
  - `docs/sprint-1/sprint-2-4-implementation-backlog.md`
  - `.github/workflows/quality-gates.yml`

### Work Items
- Finalize MVP feature map for Fleet Operations and Safety Intelligence.
- Define quality gates and PR merge criteria.
- Produce route/module readiness matrix.
- Create prioritized launch blocker backlog (security, UX, data, reliability).
- Define NFR targets: performance, uptime, RTO/RPO, and support SLAs.

### Acceptance Criteria
- Sprint 2-4 backlog is implementation-ready.
- CI quality gates enforced on all PRs.
- Top blocker list approved by engineering + product.


## Access/Permissions Likely Needed for Execution
- Production-like Supabase environment access
- Vercel environment/secrets management access
- Monitoring/error platform access
- Security scanner/tooling access
