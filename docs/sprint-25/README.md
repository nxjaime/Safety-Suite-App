# Sprint 25: Driver Safety, Coaching, and Intervention Completion

## Summary
Sprint 25 closes the risk-to-intervention loop. The intervention queue now has persistent action states — safety managers can start a coaching plan or dismiss an intervention directly from the queue, and every disposition is recorded for audit.

## Deliverables

### Database Migration (`20260307000300_intervention_actions_sprint25.sql`)
- `intervention_actions` table: `driver_id`, `action` (accepted/dismissed/converted_to_coaching), `reason`, `actor`, `coaching_plan_id` FK, org-scoped RLS + index
- `coaching_plans` new columns: `outcome_notes`, `closed_by`, `closed_at` — supports plan closeout with sign-off

### Intervention Queue Service (`src/services/interventionQueueService.ts`)
- `InterventionAction` interface + `InterventionActionType` type exported
- `recordInterventionAction(driverId, action, opts)` — persists any disposition to `intervention_actions`
- `getInterventionActions(driverId?)` — org-scoped history, optionally filtered to one driver
- `createCoachingPlanFromIntervention(driverId, details)` — creates a coaching plan with auto-generated weekly check-ins and records `converted_to_coaching` action; returns `{ coachingPlanId, action }`
- `closeCoachingPlan(planId, outcome, outcomeNotes, closedBy)` — closes plan with sign-off fields

### Safety Page (`src/pages/Safety.tsx`)
- Intervention queue table columns updated — "Recommended" + "Actions" column
- **Coach button**: Opens coaching plan creation modal (type, duration, start date); calls `createCoachingPlanFromIntervention()`; refreshes queue on success
- **Dismiss button**: Opens dismiss modal with reason field; calls `recordInterventionAction(..., 'dismissed', ...)`; refreshes queue
- Both actions gated by `canManageSafetyEvents` capability
- "Profile" link replaces the old "Driver" link

## Tests
- `src/test/interventionQueueService.test.ts` — 2 new tests:
  - `recordInterventionAction` inserts correct payload
  - `getInterventionActions` applies org and driver filters

## Exit Criteria
- [x] Risk-to-intervention workflow is closed-loop: queue items can be acted on (coach/dismiss) with persistent records
- [x] Coaching plan creation from intervention queue is atomic (plan + action in one call)
- [x] All dispositions are auditable via `intervention_actions` table
- [x] Coaching plan close-out fields available for downstream outcome tracking
- [x] 306 tests pass; zero TypeScript errors
