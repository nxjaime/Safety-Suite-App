# Sprint 24: Inspection and Compliance Operations Completion

## Summary
Sprint 24 closes the inspection remediation loop, introduces OOS visibility, and adds overdue compliance task escalation — converting the inspection workflow from a read-only log into a tracked, closeable remediation process.

## Deliverables

### Database Migration (`20260307000200_inspection_remediation_sprint24.sql`)
- `inspections` new columns: `remediation_owner`, `remediation_closed_by`, `remediation_closed_at`, `remediation_evidence`
- `tasks` new column: `escalated_at` (timestamp for compliance task escalation tracking)
- Indexes on `(organization_id, remediation_status)` and `(organization_id, out_of_service)` for efficient OOS/open remediation queries

### Inspection Service (`src/services/inspectionService.ts`)
- `RemediationStatus` type exported (`'Open' | 'In Progress' | 'Closed'`)
- `Inspection` interface extended with `remediation_owner?`, `remediation_closed_by?`, `remediation_closed_at?`, `remediation_evidence?`
- `updateRemediation(id, updates)` — updates status, owner, due date, notes without closing
- `closeRemediation(id, closedBy, evidenceNotes)` — transitions to Closed with sign-off capture
- `getOpenRemediations()` — all org-scoped Open/In Progress remediations ordered by due date
- `getOOSInspections()` — all org-scoped OOS inspections not yet closed

### Compliance Service (`src/services/complianceService.ts`)
- `getOverdueComplianceTasks(todayISO?)` — returns all Compliance tasks that are past due and not completed
- `escalateOverdueComplianceTasks(todayISO?)` — marks overdue tasks with `escalated_at` timestamp, returns count

### Compliance Page (`src/pages/Compliance.tsx`)
- **OOS badge**: Vehicle column shows red "OOS" badge on out-of-service inspections
- **Update button**: Opens remediation update modal — change status (Open→In Progress), assign owner, adjust due date, add notes
- **Close button**: Opens remediation closeout modal — captures `closedBy` (required) + `evidenceNotes`, calls `closeRemediation()`
- **Escalation banner**: Shows when overdue compliance tasks exist; "Escalate All" button calls `escalateOverdueComplianceTasks()`
- Remediation update modal and closeout modal added inside inspections view

## Tests
- `src/test/inspectionRemediation.test.ts` — 5 new tests: `updateRemediation`, `closeRemediation`, `getOpenRemediations` filter, `getOOSInspections` filter, org scope assertion
- `src/test/complianceService.test.ts` — 1 new test: `getOverdueComplianceTasks` returns only overdue open Compliance tasks

## Exit Criteria
- [x] Inspection defects can be tracked from Open → In Progress → Closed with sign-off evidence
- [x] OOS badge visible on out-of-service inspection rows
- [x] `getOpenRemediations()` and `getOOSInspections()` service methods available for dashboard consumption
- [x] Overdue compliance tasks are surfaced and can be escalated in one action
- [x] 304 unit tests pass; zero TypeScript errors
