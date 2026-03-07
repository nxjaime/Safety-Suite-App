# Sprint 20 Daily Review Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a role-aware daily KPI/incident review workflow to Hypercare so rollout leads can log reviews and publish internal launch-status updates during Sprint 20.

**Architecture:** Create a localStorage-backed `hypercareReviewService` that follows the same role-gated mutation and audit pattern already used by rollout cohorts and reporting preferences. Render a dedicated review panel in Hypercare that reads review history, supports manager/admin draft creation, and highlights the latest published update for command-center cadence.

**Tech Stack:** React, TypeScript, Vitest, React Testing Library, localStorage service modules

---

### Task 1: Review Service

**Files:**
- Create: `src/services/hypercareReviewService.ts`
- Test: `src/test/hypercareReviewService.test.ts`

**Step 1: Write the failing test**

Create `src/test/hypercareReviewService.test.ts` covering:
- creating a review and listing newest-first,
- blocking viewer mutations,
- publishing an existing review and recording audit history.

**Step 2: Run test to verify it fails**

Run: `npx vitest --run src/test/hypercareReviewService.test.ts`
Expected: FAIL because `hypercareReviewService` does not exist yet.

**Step 3: Write minimal implementation**

Create `src/services/hypercareReviewService.ts` with:
- review record and audit entry types,
- `listReviews`,
- `createReview`,
- `publishReview`,
- `listAuditEntries`,
- validation for owner/date/risk/action fields,
- role gating that blocks `viewer`.

**Step 4: Run test to verify it passes**

Run: `npx vitest --run src/test/hypercareReviewService.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/services/hypercareReviewService.ts src/test/hypercareReviewService.test.ts
git commit -m "sprint-20: add hypercare review service"
```

### Task 2: Hypercare Review Panel

**Files:**
- Create: `src/components/HypercareDailyReviewsPanel.tsx`
- Modify: `src/pages/Hypercare.tsx`
- Test: `src/test/hypercareDailyReviewsPanel.test.tsx`
- Modify: `src/test/hypercarePage.test.tsx`

**Step 1: Write the failing test**

Create `src/test/hypercareDailyReviewsPanel.test.tsx` covering:
- latest published review summary rendering,
- manager/admin create controls,
- viewer read-only state.

Update `src/test/hypercarePage.test.tsx` to expect the daily review section on the Hypercare page.

**Step 2: Run test to verify it fails**

Run: `npx vitest --run src/test/hypercareDailyReviewsPanel.test.tsx src/test/hypercarePage.test.tsx`
Expected: FAIL because the panel does not exist yet.

**Step 3: Write minimal implementation**

Create `src/components/HypercareDailyReviewsPanel.tsx` that:
- loads review history from the service,
- renders the latest published status card,
- allows create/publish actions for non-viewer roles,
- shows empty/read-only states when appropriate.

Update `src/pages/Hypercare.tsx` to render the new panel beneath rollout cohorts.

**Step 4: Run test to verify it passes**

Run: `npx vitest --run src/test/hypercareDailyReviewsPanel.test.tsx src/test/hypercarePage.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/HypercareDailyReviewsPanel.tsx src/pages/Hypercare.tsx src/test/hypercareDailyReviewsPanel.test.tsx src/test/hypercarePage.test.tsx
git commit -m "sprint-20: add hypercare daily review workflow"
```

### Task 3: Sprint 20 Documentation and Verification

**Files:**
- Modify: `docs/sprint-20/README.md`
- Modify: `handoff.md`

**Step 1: Update sprint documentation**

Document the new daily review workflow slice, validation commands, and remaining Sprint 20 scope.

**Step 2: Run focused verification**

Run: `npx vitest --run src/test/hypercareReviewService.test.ts src/test/hypercareDailyReviewsPanel.test.tsx src/test/hypercarePage.test.tsx`
Expected: PASS.

**Step 3: Run full verification**

Run:
- `npm run test:unit`
- `npm run build`

Expected: PASS.

**Step 4: Commit**

```bash
git add docs/sprint-20/README.md handoff.md
git commit -m "sprint-20: document daily review workflow"
```
