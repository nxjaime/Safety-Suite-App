# Sprint 20 Daily Review Workflow Design

## Goal

Close the remaining Sprint 20 hypercare gap by giving rollout leads a daily review workflow inside Hypercare that captures review outcomes, publishes an internal status summary, and keeps go/no-go context next to live KPIs and rollout cohorts.

## Current Context

- `src/pages/Hypercare.tsx` already surfaces KPI drift, escalation triggers, and rollout cohorts.
- `docs/runbooks/hypercare-command-center.md` defines the missing command-center loop:
  - confirm critical incidents are mitigated,
  - review KPI drift,
  - assign owners,
  - publish an internal status update,
  - re-evaluate next cohort activation.
- Existing sprint slices use localStorage-backed service modules with audit entries and role-aware mutations (`src/services/reportingPreferencesService.ts`, `src/services/rolloutCohortService.ts`).

## Approaches Considered

### 1. Local Hypercare Review Log (Recommended)

Add a dedicated Hypercare review service backed by localStorage and render a review composer/history panel directly in Hypercare.

Why this is the recommendation:
- matches the current sprint’s local-first rollout cohort pattern,
- closes the runbook loop without requiring new Supabase schema work during hypercare,
- keeps blast radius small and testable.

Trade-offs:
- review records are local to the browser/session profile instead of shared server-side state,
- status publishing is an in-app summary rather than outbound comms automation.

### 2. Extend Help & Feedback Into a Review Workspace

Represent daily reviews as special feedback items or derived backlog state inside the existing Help & Feedback area.

Why not now:
- overloads the meaning of feedback entries,
- makes daily review history harder to separate from support backlog noise,
- increases coupling between two workflows with different actors and lifecycle.

### 3. Add Server-Persisted Review Records in Supabase

Create a new table and service for shared hypercare review records and audit history.

Why not now:
- stronger long-term architecture, but too heavy for this sprint slice,
- requires migrations, tenancy/RLS work, and broader QA surface,
- slows delivery of a workflow that can be validated locally first.

## Proposed Design

### Service Layer

Create `src/services/hypercareReviewService.ts` with:
- `listReviews()`
- `createReview(...)`
- `publishReview(...)`
- `listAuditEntries()`

Review records will include:
- `id`
- `createdAt`
- `reviewDate`
- `reviewWindow` (`AM` or `PM`)
- `owner`
- `status` (`Draft` or `Published`)
- `overallHealth` (`Stable`, `Monitor`, `Escalate`)
- `incidentSummary`
- `topRisks`
- `mitigationActions`
- `cohortDecision` (`Proceed`, `Hold`, `Escalate`)
- `publishedAt?`

Mutation rules:
- `viewer` is read-only
- `manager` and `admin` can create and publish reviews

Audit entries will track:
- review created
- review published

### UI

Add a new `HypercareDailyReviewsPanel` component rendered below rollout cohorts in `src/pages/Hypercare.tsx`.

The panel will show:
- a short runbook-aligned composer for the latest AM/PM review,
- a role-aware create form for managers/admins,
- the latest published status summary,
- recent review history for context and accountability.

The panel should stay operational even if the snapshot is stable; this is a command-center workflow, not only an escalation workflow.

### Data Flow

1. Hypercare page loads the current snapshot as it does today.
2. The new panel independently reads review history from the review service.
3. Managers/admins can log a draft review with concise status inputs.
4. Publishing a review timestamps the record and surfaces it as the latest internal status update in the panel.

### Error Handling

- Validation errors stay local and surface as toast messages.
- Review history should render an empty state when no reviews exist.
- Mutation failures should not break the rest of Hypercare.

### Testing

Add:
- unit tests for review creation, publish behavior, sorting, and viewer restrictions,
- component/page tests for rendering the latest published update and the role-aware controls.

## Expected Outcome

After this slice, Sprint 20 Hypercare will cover:
- live KPI and escalation visibility,
- rollout cohort tracking,
- daily review capture and internal status publishing.

That leaves the prioritized post-launch backlog as the last clearly open Sprint 20 scope item.
