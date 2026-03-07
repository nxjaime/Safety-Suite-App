# Sprint 21 Tenant Isolation and Role Model Design

## Goal

Execute a full access-model cutover for Sprint 21 by replacing the current `admin/manager/viewer` convention with a production-grade role and capability system:

- `platform_admin`
- `full`
- `safety`
- `coaching`
- `maintenance`
- `readonly`

This sprint establishes the trust boundary for every later workflow sprint. The objective is not only UI visibility changes, but enforceable route, service, and organization-scoping behavior across the application.

## Current State

The application currently has broad workflow coverage, but access control is still weakly structured:

- `profileService` only recognizes `admin`, `manager`, and `viewer`
- `AuthContext` exposes `isAdmin` and a single coarse role
- many components and services check `role === 'admin'` or `role !== 'viewer'`
- admin access still partially relies on email-based conventions
- org isolation is inconsistently expressed across service boundaries

This creates two risks:

1. the product cannot honestly claim enterprise-ready role isolation
2. every subsequent sprint would compound permission drift if Sprint 21 is deferred or partial

## Design Decision

### Chosen Approach: Full Role-Model Cutover Now

Sprint 21 will perform a full-stack cutover instead of a staged approximation.

That means:
- canonical role expansion in the profile/auth model
- capability-based authorization helpers
- updated route protection
- updated navigation visibility
- service-layer authorization for the highest-risk domains
- explicit platform-admin-only behavior for cross-tenant and platform controls

### Rejected Approach 1: Minimal Tightening on the 3-Role Model

Rejected because:
- it leaves the roadmap role model unresolved
- it would force a second disruptive auth refactor later
- it does not provide domain-specific least-privilege controls

### Rejected Approach 2: Frontend-First Role Expansion

Rejected because:
- it would produce apparent permissions without reliable backend/service enforcement
- it increases the chance of hidden authorization bypasses
- it creates a migration period where the UI lies about true access

## Target Role Model

### `platform_admin`

Purpose:
- platform operations and cross-tenant management

Expected abilities:
- manage organizations
- access platform-level admin tooling
- bypass normal org scoping only where explicitly allowed
- inspect tenant-level operational state for support and rollout purposes

### `full`

Purpose:
- general org administrator / operations lead

Expected abilities:
- full org-scoped access across fleet, safety, compliance, training, reporting, documents, and operational workflows
- no cross-tenant access
- no platform-only admin capabilities

### `safety`

Purpose:
- safety and risk operator

Expected abilities:
- manage risk events, watchlists, interventions, coaching-related safety workflows, and related reporting
- read other domain data needed for decision-making
- no fleet-maintenance administration beyond read access unless explicitly required

### `coaching`

Purpose:
- coaching/training specialist

Expected abilities:
- manage coaching plans, check-ins, outcomes, training assignments/reviews, and related driver workflows
- read supporting driver/safety context
- no broad fleet or platform admin mutation access

### `maintenance`

Purpose:
- fleet maintenance operator

Expected abilities:
- manage equipment, PM, work orders, inspection remediation tied to maintenance, and related fleet workflows
- read supporting compliance/safety context as needed
- no broad safety/coaching/platform administration

### `readonly`

Purpose:
- read-only tenant user

Expected abilities:
- view authorized pages and records
- perform harmless personal/session actions
- no mutation access to operational workflows

## Capability Model

Instead of scattering role checks throughout the application, Sprint 21 will define a capability layer.

Planned examples:
- `canAccessPlatformAdmin`
- `canManageOrgSettings`
- `canManageFleet`
- `canManageMaintenance`
- `canManageSafety`
- `canManageCoaching`
- `canManageTraining`
- `canManageReportingPreferences`
- `canManageHypercare`
- `canViewAdminOperations`

The application should evaluate permissions by capability first and role second.

Benefits:
- reduces duplicated logic
- makes least-privilege reasoning explicit
- allows future role additions without rewriting every page

## Architecture

### 1. Profile and Auth Source of Truth

`profileService` becomes the canonical source for:
- resolved role
- organization id
- full name
- derived capabilities

`AuthContext` should expose:
- authenticated user/session
- canonical role
- organization id
- capabilities object
- loading state

The legacy `isAdmin` shortcut should be removed from primary control flow and retained only as a temporary compatibility bridge during migration if needed.

### 2. Route and Navigation Enforcement

Route protection should be split into distinct concerns:
- authenticated routes
- role/capability-gated routes
- platform-admin-only routes

Sidebar and header behavior should follow the same capability model so that:
- users do not see links they cannot use
- navigation and route guards cannot drift independently

### 3. Service-Layer Enforcement

High-risk services should enforce capability checks directly, not depend on page-level gating alone.

Priority service areas:
- admin
- drivers
- work orders
- maintenance
- reporting preferences
- hypercare/rollout local operation tools

Principle:
- page-level checks improve UX
- service-level checks protect integrity

### 4. Organization Scoping

All non-platform roles remain organization-scoped.

Rules:
- `platform_admin` may access cross-tenant functions only in explicitly platform-approved flows
- all other roles must be constrained to their current organization
- services should avoid implicit tenant trust and instead use explicit org resolution

## Implementation Boundaries for Sprint 21

Sprint 21 is intentionally focused on access foundation, not every domain feature refinement.

Included:
- canonical role expansion
- capability helper module
- auth context upgrade
- route/sidebar/admin gating
- high-risk service authorization updates
- org-scoping hardening where necessary to support those updates
- regression coverage

Not included:
- full completion of every fleet/safety workflow
- redesign of all admin experiences
- external integration replacement

Those belong to later sprints, but Sprint 21 enables them.

## Testing Strategy

Sprint 21 must be test-led.

Required test areas:

### Authorization Helper Tests
- every role maps to the expected capability set
- platform-only capabilities are not granted to org roles
- readonly cannot mutate protected workflows

### Route and Navigation Tests
- each role sees only the allowed nav surface
- restricted routes redirect or deny as expected
- admin route becomes platform-admin aware

### Service Tests
- admin service denies org roles where required
- fleet services deny non-fleet roles for mutation paths
- safety/coaching/training permissions behave as intended
- local hypercare/reporting preference services adopt the new capability model

## Risks and Mitigations

### Risk: Hidden Legacy Role Checks

The app contains many legacy assumptions like:
- `role === 'admin'`
- `role !== 'viewer'`
- `isAdmin`

Mitigation:
- create central helpers first
- replace the highest-risk usages first
- add grep-guided cleanup during implementation

### Risk: Bootstrap Admin Access Breakage

Current email-based admin fallback may still be needed for early environment bootstrap.

Mitigation:
- isolate fallback behavior
- constrain it to explicit bootstrap/platform-admin resolution
- do not let it remain the long-term primary access rule

### Risk: Partial Tenant Enforcement

Some services may still rely on data-layer conventions instead of explicit auth-aware logic.

Mitigation:
- prioritize the most dangerous services in Sprint 21
- document remaining lower-risk follow-up items if any survive the sprint

## Expected Outcome

At the end of Sprint 21:
- the application has a real enterprise role model
- platform admin and org-scoped user responsibilities are separated
- high-risk workflows are guarded by shared capability logic
- future domain-completion work can proceed on a trustworthy access foundation
