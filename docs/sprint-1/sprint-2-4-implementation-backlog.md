# Sprint 2-4 Implementation-Ready Backlog

## Sprint 2: UX System and Navigation Refactor

### Epic S2-E1: Design Token Foundation
- Story S2-E1-1: Define color/typography/spacing token set and usage rules.
  - Acceptance: token spec committed; app shell adopts tokens.
- Story S2-E1-2: Standardize component primitives (buttons, inputs, table, modal, badges).
  - Acceptance: at least 80% of core routes use shared primitives.

### Epic S2-E2: Information Architecture and Navigation
- Story S2-E2-1: Rework sidebar/top nav taxonomy around Operations, Safety, Compliance, Reporting.
  - Acceptance: route navigation map approved and implemented.
- Story S2-E2-2: Add page-level breadcrumbs and consistent empty/loading/error states.
  - Acceptance: all in-scope pages show standardized states.

### Epic S2-E3: Accessibility Baseline
- Story S2-E3-1: Keyboard navigation and focus state audit on core routes.
  - Acceptance: no major keyboard traps or missing focus indicators.
- Story S2-E3-2: Form labels, aria semantics, and color contrast checks.
  - Acceptance: WCAG AA baseline report completed.

## Sprint 3: Fleet Operations Core (Asset + Maintenance)

### Epic S3-E1: Equipment Domain Hardening
- Story S3-E1-1: Normalize equipment model fields and validation rules.
  - Acceptance: typed model + validated CRUD paths implemented.
- Story S3-E1-2: Add equipment lifecycle status transitions and guardrails.
  - Acceptance: invalid transitions blocked by service logic.

### Epic S3-E2: Maintenance + Work Orders
- Story S3-E2-1: Introduce work order entity and CRUD workflow.
  - Acceptance: create/assign/update/close work orders supported.
- Story S3-E2-2: Add preventive maintenance schedule definitions.
  - Acceptance: PM tasks can be generated and tracked.

### Epic S3-E3: Inspection to Remediation Loop
- Story S3-E3-1: Link inspection defects to tasks/work orders.
  - Acceptance: defect closure traceable to action completion.
- Story S3-E3-2: Add overdue and unresolved defect queue views.
  - Acceptance: queue filters and status summaries operational.

## Sprint 4: Safety Intelligence Core (Risk + Coaching)

### Epic S4-E1: Type-Safe Service Layer Remediation
- Story S4-E1-1: Remove `any` from driver/task/risk service contracts.
  - Acceptance: strict typing in priority modules; no new `any` in touched files.
- Story S4-E1-2: Add validation schemas at API/UI boundaries.
  - Acceptance: invalid payloads rejected with actionable errors.

### Epic S4-E2: Risk Scoring Reliability
- Story S4-E2-1: Formalize risk score inputs and calculation versioning.
  - Acceptance: score computation deterministic and documented.
- Story S4-E2-2: Add tests for scoring edge cases and regression.
  - Acceptance: high-confidence unit test coverage for risk logic.

### Epic S4-E3: Coaching and Intervention Workflow
- Story S4-E3-1: Harden coaching plan state machine and check-in updates.
  - Acceptance: invalid transitions prevented; task sync verified.
- Story S4-E3-2: Add intervention audit events for key actions.
  - Acceptance: create/update/complete actions are traceable.

## Cross-Sprint Dependencies
- Sprint 2 primitives are prerequisites for Sprint 3/4 UI consistency.
- Sprint 3 equipment/remediation data links feed Sprint 4 safety interventions.
- Sprint 4 type and validation work reduces defects before integration hardening (Sprint 5).

## Risks and Mitigations
- Risk: lint/type debt slows Sprint 4 delivery.
  - Mitigation: prioritize typed service modules first; track debt burn-down weekly.
- Risk: schema changes cause migration drift.
  - Mitigation: migration review checklist + rollback notes enforced per PR.
- Risk: UX rework churn impacts downstream stories.
  - Mitigation: freeze navigation and token decisions by end of Sprint 2 week 1.
