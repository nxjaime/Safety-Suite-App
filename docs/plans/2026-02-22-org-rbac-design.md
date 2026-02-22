# Org Isolation + Page-Based RBAC Design

## Goal
Implement logical isolation per organization with page-based roles and domain-gated access, enforced end-to-end (UI + DB RLS).

## Roles
- `platform_admin`: platform-only superuser (access to `/admin`, manage orgs/users/domains).
- `full`: full access to all non-admin pages.
- `safety`: access to safety-related pages and reporting.
- `coaching`: access to coaching workflows and relevant driver views.
- `maintenance`: access to equipment, maintenance, work orders, and documents.
- `readonly`: read-only access to all non-admin pages.

## Page Access Matrix (Initial)
- `/admin`: `platform_admin` only
- `/` (Status Board): `full`, `safety`, `coaching`, `maintenance`, `readonly`
- `/tasks`: `full`, `safety`, `maintenance`, `readonly`
- `/drivers`, `/drivers/:id`: `full`, `safety`, `coaching`, `readonly`
- `/safety`: `full`, `safety`, `coaching`, `readonly`
- `/compliance`: `full`, `safety`, `coaching`, `readonly`
- `/training`, `/fmcsa`: `full`, `safety`, `coaching`, `readonly`
- `/reporting`, `/reporting/csa-predictor`: `full`, `safety`, `readonly`
- `/equipment`: `full`, `maintenance`, `readonly`
- `/maintenance`: `full`, `maintenance`, `readonly`
- `/work-orders`: `full`, `maintenance`, `readonly`
- `/documents`: `full`, `maintenance`, `readonly`
- `/help`: all roles
- `/settings`: all roles

## Data Model
- `organizations.allowed_domains` (`text[]`): list of domains permitted to join the org.
- `profiles.role`: constrained to new role set above.
- `profiles.organization_id`: remains the org join key.

## Auth + Domain Gate
- On sign-in/sign-up, resolve org by email domain:
  - If domain does not exist in any org’s `allowed_domains`, block and sign out.
  - If domain matches multiple orgs, block and require platform admin assignment.
- On success, ensure a `profiles` row exists with `organization_id` and a default role (`readonly` unless set by platform admin).

## RLS Policies
- Continue enforcing `organization_id = get_org_id()` on all org-scoped tables.
- Add helper functions:
  - `email_domain(text)` to extract domain from `auth.jwt()->>'email'`.
  - `is_platform_admin()` to check current user’s role.
  - `org_domain_allowed(org_id)` to enforce that the current user’s email domain belongs to the org.
- Apply `org_domain_allowed` to org-scoped policies so users cannot access data if domain is invalid.
- Allow `platform_admin` to read/write across orgs for admin workflows.
- For `readonly`, allow only `SELECT` on org-scoped tables; deny writes via `WITH CHECK` or separate policies.

## UI Enforcement
- Route guard uses role + page matrix to allow/deny navigation.
- Sidebar only renders allowed sections per role.
- Admin link visible only for `platform_admin`.

## Platform Admin Workflows
- `/admin` gains organization management:
  - Create orgs with `allowed_domains`.
  - Create/assign users and roles.
  - View org users and role changes.

## Failure Modes
- Missing org or mismatched domain => sign out and show error.
- Missing role => default to `readonly`.
- Ambiguous domain => block and require admin resolution.

## Testing
- Unit tests for role matrix and route guard decisions.
- RLS tests using SQL policy checks (or integration tests with Supabase local).
- E2E tests verifying domain gate and role-based page access.
