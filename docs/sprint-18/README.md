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

## Validation

- `npm run test:unit -- src/test/reportingPreferencesService.test.ts src/test/reportingService.test.ts` passed.
- `npm run build` passed.
