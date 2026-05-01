# Sprint 20 Rollout Cohort Tracker Implementation Plan

> **Implementation note:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add role-aware rollout cohort tracking to Hypercare so launch leads can manage phased activation decisions inside the command center.

**Architecture:** Create a local-persistence rollout cohort service following the same role-gated mutation and audit pattern used by reporting preferences. Render the cohort list and next-activation controls directly in `Hypercare.tsx` so rollout decisions stay next to the KPI and escalation context.

**Tech Stack:** React 19, TypeScript, Vitest, localStorage-backed service patterns, existing AuthContext role model, Tailwind utility styling.

---

### Task 1: Rollout Cohort Service

**Files:**
- Create: `src/services/rolloutCohortService.ts`
- Test: `src/test/rolloutCohortService.test.ts`
- Reference: `src/services/reportingPreferencesService.ts`

**Step 1: Write the failing test**

Add tests for:
- creating and listing cohorts
- viewer mutation blocking
- status updates and audit entries

**Step 2: Run test to verify it fails**

Run: `npx vitest --run src/test/rolloutCohortService.test.ts`
Expected: FAIL because `rolloutCohortService` does not exist yet.

**Step 3: Write minimal implementation**

Create a role-aware local service with:
- cohort CRUD needed by Hypercare
- status transitions
- audit entry capture

**Step 4: Run test to verify it passes**

Run: `npx vitest --run src/test/rolloutCohortService.test.ts`
Expected: PASS

### Task 2: Hypercare Cohort UI

**Files:**
- Modify: `src/pages/Hypercare.tsx`
- Modify: `src/test/hypercarePage.test.tsx`
- Create: `src/test/rolloutCohortsPanel.test.tsx`
- Reference: `src/contexts/AuthContext.tsx`

**Step 1: Write the failing tests**

Add tests for:
- rendering rollout cohorts in Hypercare
- create form for manager/admin
- read-only state for viewer

**Step 2: Run tests to verify they fail**

Run: `npx vitest --run src/test/hypercarePage.test.tsx src/test/rolloutCohortsPanel.test.tsx`
Expected: FAIL because the cohort UI does not exist yet.

**Step 3: Write minimal implementation**

Add a Hypercare section that shows:
- current cohorts
- next cohort recommendation
- create/update controls for non-viewers

**Step 4: Run tests to verify they pass**

Run: `npx vitest --run src/test/hypercarePage.test.tsx src/test/rolloutCohortsPanel.test.tsx`
Expected: PASS

### Task 3: Sprint Artifact + Verification

**Files:**
- Modify: `docs/sprint-20/README.md`
- Modify: `handoff.md`

**Step 1: Update sprint notes**

Document the rollout cohort tracker slice and reference the new service/tests.

**Step 2: Run full verification**

Run: `npm run test:unit`
Expected: PASS

Run: `npm run build`
Expected: PASS
