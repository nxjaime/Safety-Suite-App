# Sprint 18 Artifact (Early Progress)

## Scope Started

- Began page/action-level permission hardening in reporting preference workflows:
  - `viewer` role is now read-only for saved views and scheduled export mutations.
  - Mutation attempts by viewer role are blocked in service layer.
- Added auditability for reporting preference changes:
  - Save/delete view actions logged.
  - Schedule create/enable-disable/delete actions logged.
  - Audit entries are queryable by role and shown in Reporting UI.

## Files

- `src/services/reportingPreferencesService.ts`
- `src/test/reportingPreferencesService.test.ts`
- `src/pages/Reporting.tsx`
- `src/services/taskService.ts`
- `src/services/inspectionService.ts`
- `src/services/trainingService.ts`
- `src/test/taskService.test.ts`
- `src/test/inspectionService.test.ts`
- `src/test/trainingService.test.ts`
- `src/services/retentionPolicyService.ts`
- `src/test/retentionPolicyService.test.ts`

## Additional Progress

- Added explicit tenant scoping (`organization_id`) to high-risk service queries/mutations:
  - `taskService`: fetch/add/update/close/delete/status/check-in completion paths
  - `inspectionService`: inspection list fetch path
  - `trainingService`: list/update/delete for assignments and templates
- This complements existing RLS with explicit query-level org filtering for defense in depth and clearer isolation guarantees.
- Added retention policy analysis service for compliance evidence:
  - org-scoped candidate detection for old active documents, completed tasks, and completed training assignments
  - structured snapshot output with counts and candidate metadata

## Validation

- `npm run test:unit -- src/test/reportingPreferencesService.test.ts src/test/reportingService.test.ts` passed.
- `npm run test:unit -- src/test/trainingService.test.ts src/test/taskService.test.ts src/test/inspectionService.test.ts src/test/reportingPreferencesService.test.ts` passed.
- `npm run test:unit -- src/test/retentionPolicyService.test.ts src/test/trainingService.test.ts src/test/taskService.test.ts src/test/inspectionService.test.ts src/test/reportingPreferencesService.test.ts` passed.
- `npm run test:unit` passed (`238/238`).
- `npm run build` passed.
