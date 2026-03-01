# Sprint 19 UAT Checklist

## Scope

Validate end-to-end readiness across operations, safety, compliance, training, reporting, and admin workflows.

## Execution Rules

1. Record tester, role, org, date, and environment before each run.
2. Capture pass/fail plus evidence links for each case.
3. File blocker tickets for any P0/P1 failures.

## Test Matrix

| Area | Scenario | Expected Result | Status | Evidence |
| --- | --- | --- | --- | --- |
| Authentication | Login/logout with valid credentials | User reaches dashboard; logout returns to login | Pending | |
| Equipment | Create/update equipment record | Record persists and appears in equipment table | Pending | |
| Maintenance | Create PM template and schedule service | Template appears and due service is visible | Pending | |
| Work Orders | Move work order through lifecycle to closed | Status transitions valid and timestamps set | Pending | |
| Inspections | Submit failed inspection with OOS defect | Compliance task/work order triggers as configured | Pending | |
| Documents | Upload required document with expiration | Document appears with metadata and required flag | Pending | |
| Compliance | Open compliance view for overdue/missing items | Required gaps and overdue actions are accurate | Pending | |
| Drivers | Update coaching plan check-in | Check-in persists and related task state updates | Pending | |
| Safety | Log risk event and verify driver risk impact | Event persists and safety views refresh correctly | Pending | |
| Training | Assign/complete training with talking points/actions | Assignment state and completion date persist | Pending | |
| Reporting | Load dashboard, apply saved view, export CSV | Metrics render and export completes successfully | Pending | |
| Admin | Role-limited access checks (`viewer` vs manager/full) | Restricted actions blocked for unauthorized roles | Pending | |

## Sign-Off

- UAT Lead:
- Product Owner:
- Engineering Lead:
- Date:
