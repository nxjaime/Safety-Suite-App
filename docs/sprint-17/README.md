# Sprint 17 Artifact

## Scope Delivered (Core Unified Dashboard Slice)

- Added live unified reporting snapshot service in `src/services/reportingService.ts` covering:
  - Fleet reliability KPIs (total work orders, backlog, overdue, MTTR, completion rate)
  - Safety KPIs (total drivers, average risk score, high-risk driver count)
  - Compliance KPIs (open action items, overdue remediations, required-document gaps, critical credentials)
  - Training KPIs (total/completed/overdue assignments, completion rate)
  - 6-month trend table (completed work orders + completed training)
  - Cohort reporting for coaching effectiveness (risk-band cohorts)
  - Defect recurrence metrics based on inspection-linked work orders
  - KPI data dictionary payload
- Replaced placeholder analytics page with live dashboard in `src/pages/Reporting.tsx`:
  - Reporting window selector (30/90/365 day)
  - Refresh action and failure retry state
  - KPI card grid + compliance action summary + trend table
  - CSV export of current KPI snapshot
  - KPI data dictionary panel
  - Role-scoped saved views (save/apply/delete) scaffolding
  - Scheduled export configuration scaffolding (create/enable-disable/delete)
- Added tests in `src/test/reportingService.test.ts`.
- Added preferences service + tests:
  - `src/services/reportingPreferencesService.ts`
  - `src/test/reportingPreferencesService.test.ts`
  - Added action-level guardrails (`viewer` cannot mutate saved views/schedules)
  - Added reporting preference audit trail entries for save/delete/toggle actions
  - Exposed audit trail in Reporting UI (latest preference mutations)

## Verification

- `npm run test:unit -- src/test/reportingService.test.ts` passed.
- `npm run test:unit -- src/test/reportingPreferencesService.test.ts src/test/reportingService.test.ts` passed.
- `npm run build` passed.

## Remaining Sprint 17 Scope

- Backend job execution for scheduled export delivery (current implementation is UI/persistence scaffolding only).
