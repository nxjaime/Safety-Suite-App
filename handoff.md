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

## 10-Sprint Roadmap

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
Execution Status: In Progress
Completed items:
Design tokens with Space Grotesk + Inter and safety palette.
Navigation IA updated with Operations/Fleet/Safety/Reporting/Settings.
Baseline accessibility improvements in navigation and header.

### Sprint 3: Fleet Operations Core (Asset + Maintenance)
Reminder: Commit & push after checks/tests pass.
- Goal: Ship Fleetio-like operational core.
- Scope:
  - Expand equipment/vehicle model and lifecycle states.
  - Implement preventive maintenance schedules and service logs.
  - Add work order creation, assignment, and status tracking.
- Exit criteria:
  - End-to-end asset-to-work-order workflow is functional and tested.

### Sprint 4: Safety Intelligence Core (Risk + Coaching)
Reminder: Commit & push after checks/tests pass.
- Goal: Ship Idelic-like safety core.
- Scope:
  - Normalize driver risk model and scorecard definitions.
  - Harden risk event ingestion and scoring logic.
  - Standardize coaching plans, check-ins, and outcome tracking.
- Exit criteria:
  - Driver scorecards and coaching lifecycle are production-ready.

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

---

## K-Dense Workflow Integration (How to Import It Into Team Workflow)

Use K-Dense as a planning/research copilot layer, not as a replacement for engineering delivery tools.

### Where It Fits Best
- Discovery: product/market/feature research for Fleetio + Idelic parity decisions
- Sprint planning: converting goals into scoped sprint epics and acceptance criteria
- Risk analysis: security/compliance risk surfacing and mitigation options
- Postmortems: pattern extraction from incidents and recurring defects

### Recommended Team Workflow
1. Define sprint objective in `handoff.md`.
2. Send sprint objective + constraints to K-Dense for structured plan proposals.
3. Bring K-Dense output back into repo as actionable backlog items (tickets/tasks).
4. Implement in codebase with normal engineering controls (PRs, CI, tests, reviews).
5. Feed delivery results/metrics back to K-Dense for next sprint planning refinement.

### Input Template for K-Dense
- Product direction: "Fleetio + Idelic hybrid"
- Sprint number and objective
- In-scope modules
- Constraints: team size, 2-week sprint, current architecture
- Non-negotiables: security, tenant isolation, performance targets
- Expected output: epics, stories, acceptance criteria, risks, dependencies

### Output Contract (What to Require)
- Prioritized epics with clear owners
- Story-level acceptance criteria
- Technical risks with mitigation paths
- Dependencies and sequencing
- Measurable success metrics per sprint

### Guardrails
- K-Dense output is advisory; final authority stays with product + engineering leads.
- No direct production changes without normal code review and CI.
- Security/compliance decisions require explicit human sign-off.

## Access/Permissions Likely Needed for Execution
- Production-like Supabase environment access
- Vercel environment/secrets management access
- Monitoring/error platform access
- Security scanner/tooling access
