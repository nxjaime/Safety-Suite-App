# Sprint 21: Tenant Isolation and Production Access Model

Status: Complete

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
- Hardened training, coaching, and safety mutation flows:
  - training assignment/template changes now require training capability
  - coaching plan create/update/delete now require coaching capability
  - risk event logging and manual risk refresh now require safety capability
- Tightened explicit org scoping for driver-facing reads that previously relied on implied RLS behavior:
  - driver lists
  - detailed driver queries
  - driver-by-id fetches
  - driver risk events
  - driver documents
- Tightened explicit org scoping for document mutation paths:
  - document archive
  - bulk document updates
- Added regression coverage for:
  - role normalization and capability mapping
  - platform-admin-only admin access
  - navigation visibility
  - work order approval permissions
  - reporting preferences permissions
  - rollout cohort permissions
  - hypercare review permissions
  - reporting page readonly vs safety behavior
  - training readonly vs coaching behavior
  - safety readonly vs safety behavior
  - driver service org scoping and safety/coaching mutation boundaries

## Verification
- `npm run test:unit`
- `npm run build`
- `git diff --check`

## Completion Notes
- Sprint 21 is complete at the application-layer access-control scope defined for this phase.
- Remaining schema/policy refinements should be handled as follow-on hardening inside later platform sprints rather than keeping Sprint 21 open indefinitely.

## Notes
- Legacy role names remain accepted through normalization for compatibility, but new enforcement is now based on canonical roles/capabilities.
