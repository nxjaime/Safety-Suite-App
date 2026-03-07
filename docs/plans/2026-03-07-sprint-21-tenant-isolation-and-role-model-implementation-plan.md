# Sprint 21 Tenant Isolation and Role Model Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current coarse access model with a full enterprise role and capability system for tenant-safe route, service, and admin enforcement.

**Architecture:** Introduce a canonical authorization layer that resolves `platform_admin`, `full`, `safety`, `coaching`, `maintenance`, and `readonly` into reusable capabilities. Migrate auth context, route guards, navigation, and high-risk services to those shared rules so access behavior is consistent across UI and service layers.

**Tech Stack:** React, TypeScript, Supabase, Vitest, React Testing Library

---

### Task 1: Canonical Role and Capability Model

**Files:**
- Create: `src/services/authorizationService.ts`
- Modify: `src/services/profileService.ts`
- Test: `src/test/authorizationService.test.ts`

**Step 1: Write the failing test**

Create `src/test/authorizationService.test.ts` covering:
- capability mapping for all six roles
- platform-only capabilities denied to org roles
- readonly denied all protected mutation capabilities

**Step 2: Run test to verify it fails**

Run: `npx vitest --run src/test/authorizationService.test.ts`
Expected: FAIL because `authorizationService` does not exist yet.

**Step 3: Write minimal implementation**

Create `src/services/authorizationService.ts` with:
- canonical role type
- capability type
- `getRoleCapabilities`
- helper predicates for common checks

Update `src/services/profileService.ts` to use the new canonical role type and stop defining role locally.

**Step 4: Run test to verify it passes**

Run: `npx vitest --run src/test/authorizationService.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/services/authorizationService.ts src/services/profileService.ts src/test/authorizationService.test.ts
git commit -m "sprint-21: add canonical authorization model"
```

### Task 2: Auth Context and Route Guard Cutover

**Files:**
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/navigation.test.tsx`
- Create or modify: route/auth-focused test file as needed

**Step 1: Write the failing test**

Add route/navigation expectations for:
- platform admin admin-route access
- org roles denied platform admin route
- readonly route visibility behavior where applicable

**Step 2: Run test to verify it fails**

Run: `npx vitest --run src/test/navigation.test.tsx`
Expected: FAIL because route/nav logic still uses the legacy role model.

**Step 3: Write minimal implementation**

Update auth context to expose:
- canonical role
- organization id
- derived capabilities

Update `App.tsx` route guards to:
- separate authenticated vs capability-gated access
- make admin route platform-admin aware

**Step 4: Run test to verify it passes**

Run: `npx vitest --run src/test/navigation.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/contexts/AuthContext.tsx src/App.tsx src/test/navigation.test.tsx
git commit -m "sprint-21: update auth context and route guards"
```

### Task 3: Sidebar and UI Capability Enforcement

**Files:**
- Modify: `src/components/Layout/Sidebar.tsx`
- Modify: `src/components/Layout/Header.tsx` if needed
- Test: `src/test/navigation.test.tsx`

**Step 1: Write the failing test**

Expand navigation tests for:
- platform admin visibility
- maintenance-only fleet mutation surface
- safety/coaching visibility rules
- readonly restrictions

**Step 2: Run test to verify it fails**

Run: `npx vitest --run src/test/navigation.test.tsx`
Expected: FAIL because sidebar still relies on `isAdmin` and broad groups.

**Step 3: Write minimal implementation**

Update sidebar visibility and group access to use capability helpers instead of `isAdmin`.

**Step 4: Run test to verify it passes**

Run: `npx vitest --run src/test/navigation.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/Layout/Sidebar.tsx src/components/Layout/Header.tsx src/test/navigation.test.tsx
git commit -m "sprint-21: gate navigation by capability"
```

### Task 4: High-Risk Service Enforcement

**Files:**
- Modify: `src/services/adminService.ts`
- Modify: `src/services/workOrderService.ts`
- Modify: `src/services/maintenanceService.ts`
- Modify: `src/services/reportingPreferencesService.ts`
- Modify: `src/services/rolloutCohortService.ts`
- Modify: `src/services/hypercareReviewService.ts`
- Test: `src/test/workOrderService.test.ts`
- Test: `src/test/reportingPreferencesService.test.ts`
- Test: `src/test/rolloutCohortService.test.ts`
- Test: `src/test/hypercareReviewService.test.ts`
- Create: `src/test/adminService.test.ts` if coverage does not exist

**Step 1: Write the failing test**

Add/expand tests proving:
- only platform admin can use platform admin service paths
- maintenance/full can mutate fleet workflows
- safety/coaching/full can mutate their intended operational tools
- readonly is denied

**Step 2: Run test to verify it fails**

Run:
- `npx vitest --run src/test/workOrderService.test.ts src/test/reportingPreferencesService.test.ts src/test/rolloutCohortService.test.ts src/test/hypercareReviewService.test.ts`

Expected: FAIL because services still assume legacy role checks.

**Step 3: Write minimal implementation**

Refactor service guards to use shared capability helpers and explicit org-safe rules.

**Step 4: Run test to verify it passes**

Run:
- `npx vitest --run src/test/workOrderService.test.ts src/test/reportingPreferencesService.test.ts src/test/rolloutCohortService.test.ts src/test/hypercareReviewService.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/services/adminService.ts src/services/workOrderService.ts src/services/maintenanceService.ts src/services/reportingPreferencesService.ts src/services/rolloutCohortService.ts src/services/hypercareReviewService.ts src/test/workOrderService.test.ts src/test/reportingPreferencesService.test.ts src/test/rolloutCohortService.test.ts src/test/hypercareReviewService.test.ts
git commit -m "sprint-21: enforce capabilities in high-risk services"
```

### Task 5: Driver and Safety-Domain Permission Hardening

**Files:**
- Modify: `src/services/driverService.ts`
- Modify: `src/pages/Safety.tsx`
- Modify: `src/pages/DriverProfile.tsx`
- Modify: `src/pages/Training.tsx`
- Test: `src/test/driverService.test.ts`
- Test: `src/test/trainingPage.test.tsx`

**Step 1: Write the failing test**

Add role-aware coverage for:
- safety/coaching/full mutation paths
- maintenance/readonly denied from safety/coaching mutation flows
- readonly UI behavior where appropriate

**Step 2: Run test to verify it fails**

Run: `npx vitest --run src/test/driverService.test.ts src/test/trainingPage.test.tsx`
Expected: FAIL because these flows still assume old roles.

**Step 3: Write minimal implementation**

Update safety/coaching/training mutation entry points to respect shared capabilities.

**Step 4: Run test to verify it passes**

Run: `npx vitest --run src/test/driverService.test.ts src/test/trainingPage.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/services/driverService.ts src/pages/Safety.tsx src/pages/DriverProfile.tsx src/pages/Training.tsx src/test/driverService.test.ts src/test/trainingPage.test.tsx
git commit -m "sprint-21: harden safety and coaching permissions"
```

### Task 6: Sprint 21 Documentation and Full Verification

**Files:**
- Modify: `handoff.md`
- Create or update: `docs/sprint-21/README.md`

**Step 1: Update sprint artifact**

Document:
- canonical role model
- capabilities added
- services/pages covered in the cutover
- any explicitly deferred permission cleanup items

**Step 2: Run focused verification**

Run:
- `npx vitest --run src/test/authorizationService.test.ts src/test/navigation.test.tsx src/test/workOrderService.test.ts src/test/reportingPreferencesService.test.ts src/test/rolloutCohortService.test.ts src/test/hypercareReviewService.test.ts src/test/driverService.test.ts src/test/trainingPage.test.tsx`

Expected: PASS.

**Step 3: Run full verification**

Run:
- `git diff --check`
- `npm run test:unit`
- `npm run build`

Expected: PASS.

**Step 4: Commit**

```bash
git add handoff.md docs/sprint-21/README.md
git commit -m "sprint-21: document tenant isolation cutover"
```
