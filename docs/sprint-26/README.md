# Sprint 26: Training and Corrective Action System Completion

## Summary
Sprint 26 turns training from a simple assignment tracker into a corrective-action and manager-review system. Assignments can now be tied to safety triggers, managers have a dedicated review queue, and overdue assignments can be escalated in one action.

## Deliverables

### Database Migration (`20260307000400_training_corrective_sprint26.sql`)
- `training_assignments` new columns: `trigger_type` (manual/risk_event/coaching_plan/policy), `escalated_at`
- Indexes on overdue non-completed assignments and unreviewed completions for efficient queue queries

### Type Extension (`src/types/index.ts`)
- `TrainingAssignment`: added `trigger_type?` and `escalated_at?` fields

### Training Service (`src/services/trainingService.ts`)
- `getOverdueAssignments(todayISO?)` — all org-scoped past-due non-completed assignments ordered by due date
- `getUnreviewedCompletions()` — completed assignments with `reviewed_at` null
- `escalateOverdueAssignments(todayISO?)` — sets `escalated_at` on all qualifying rows, returns count
- `assignCorrectiveTraining(driverId, templateId, opts)` — creates assignment with `trigger_type`, `risk_event_id`, `coaching_plan_id` linkage

### Training Page (`src/pages/Training.tsx`)
- **Trigger badge**: "corrective" / "coaching_plan" / "policy" badge on module name cell for non-manual assignments
- **Overdue escalation banner**: shows count of overdue assignments with "Escalate All" button
- **Pending Manager Review panel**: table of completed-but-unreviewed assignments with inline "Review" button (opens existing detail modal)
- **Corrective Training section**: quick-assign panel with driver chips; opens corrective training modal with template, due date, and trigger type selector
- **Corrective Training modal**: assigns training with trigger type context

## Tests
- `src/test/trainingService.test.ts` — 3 new tests: `getOverdueAssignments` filter, `getUnreviewedCompletions` filter, `assignCorrectiveTraining` trigger_type derivation
- `src/test/trainingPage.test.tsx` — mock updated with 4 new service methods

## Exit Criteria
- [x] Training assignments carry trigger type (manual/risk_event/coaching_plan/policy)
- [x] Corrective training can be assigned from a driver list with linkage to trigger context
- [x] Manager review queue shows completed-but-unreviewed assignments
- [x] Overdue training escalation available in one action
- [x] 309 tests pass; zero TypeScript errors
