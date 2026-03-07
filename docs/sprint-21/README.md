# Sprint 21: Tenant Isolation and Production Access Model

Status: In progress

## Objective
- Replace the legacy `admin/manager/viewer` convention with a canonical role and capability model that can support the remaining roadmap safely.

## Implemented in this slice
- Added canonical roles and shared capability helpers in `src/services/authorizationService.ts`
- Normalized profile resolution in `src/services/profileService.ts`
- Updated `AuthContext` to expose `organizationId`, canonical `role`, and derived `capabilities`
- Tightened platform-admin route access in `src/App.tsx`
- Updated sidebar navigation visibility so only `platform_admin` sees Administration
- Hardened high-risk services:
  - `adminService`
  - `workOrderService`
  - `reportingPreferencesService`
  - `rolloutCohortService`
  - `hypercareReviewService`
- Updated Reporting and Hypercare UI surfaces to use capability-based permissions
- Added regression coverage for:
  - role normalization and capability mapping
  - platform-admin-only admin access
  - navigation visibility
  - work order approval permissions
  - reporting preferences permissions
  - rollout cohort permissions
  - hypercare review permissions
  - reporting page readonly vs safety behavior

## Verification
- `npm run test:unit`
- `npm run build`
- `git diff --check`

## Remaining Sprint 21 focus
- Continue replacing residual legacy role assumptions in lower-risk areas and static copy
- Harden role-aware behavior deeper in driver safety, coaching, and training workflows where mutation boundaries are still broad
- Align database policy and org-scoping review with the canonical capability model

## Notes
- Legacy role names remain accepted through normalization for compatibility, but new enforcement is now based on canonical roles/capabilities.
