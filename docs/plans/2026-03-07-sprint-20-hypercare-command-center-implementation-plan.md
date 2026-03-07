# Sprint 20 Hypercare Command Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an in-app Hypercare Command Center for Sprint 20 so rollout leads can monitor launch KPIs, feedback backlog, and escalation triggers from one route.

**Architecture:** Add a small orchestration service that combines the existing reporting snapshot with Help & Feedback backlog data and evaluates runbook-defined escalation triggers. Surface that data in a dedicated page and expose it through navigation under Reporting so launch stakeholders can use the same app shell and role model already in place.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, existing `reportingService`, existing `feedbackService`, Tailwind utility styling, React Router.

---

### Task 1: Hypercare Service

**Files:**
- Create: `src/services/hypercareService.ts`
- Test: `src/test/hypercareService.test.ts`
- Reference: `src/services/reportingService.ts`
- Reference: `src/services/feedbackService.ts`
- Reference: `docs/runbooks/hypercare-command-center.md`

**Step 1: Write the failing test**

Create `src/test/hypercareService.test.ts` covering:
- snapshot composition from reporting + feedback
- open feedback counts by priority/status
- trigger evaluation for:
  - high-priority open backlog
  - critical compliance/risk thresholds
  - no-trigger happy path

**Step 2: Run test to verify it fails**

Run: `npx vitest --run src/test/hypercareService.test.ts`
Expected: FAIL because `hypercareService` does not exist yet.

**Step 3: Write minimal implementation**

Create `src/services/hypercareService.ts` with:
- typed `HypercareSnapshot`
- `createHypercareService(...)`
- default `hypercareService`
- aggregation helpers for:
  - feedback counts
  - trigger evaluation
  - daily summary strings/metadata needed by the page

**Step 4: Run test to verify it passes**

Run: `npx vitest --run src/test/hypercareService.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/hypercareService.ts src/test/hypercareService.test.ts
git commit -m "sprint-20: add hypercare snapshot service"
```

### Task 2: Hypercare Route and UI

**Files:**
- Create: `src/pages/Hypercare.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout/Sidebar.tsx`
- Modify: `src/components/Layout/Header.tsx`
- Test: `src/test/navigation.test.tsx`
- Test: `src/test/hypercarePage.test.tsx`

**Step 1: Write the failing tests**

Add tests for:
- route/nav exposure under Reporting
- Hypercare page rendering snapshot sections
- escalation trigger list and empty-state behavior

**Step 2: Run tests to verify they fail**

Run: `npx vitest --run src/test/navigation.test.tsx src/test/hypercarePage.test.tsx`
Expected: FAIL because the route/page do not exist yet.

**Step 3: Write minimal implementation**

Add `src/pages/Hypercare.tsx` that renders:
- launch health summary
- KPI cards sourced from `hypercareService`
- feedback backlog summary
- escalation trigger panel
- direct links to Reporting and Help & Feedback

Update routing/navigation/breadcrumbs to expose `/reporting/hypercare`.

**Step 4: Run tests to verify they pass**

Run: `npx vitest --run src/test/navigation.test.tsx src/test/hypercarePage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/Hypercare.tsx src/App.tsx src/components/Layout/Sidebar.tsx src/components/Layout/Header.tsx src/test/navigation.test.tsx src/test/hypercarePage.test.tsx
git commit -m "sprint-20: add hypercare command center route"
```

### Task 3: Sprint 20 Artifact and Verification

**Files:**
- Modify: `docs/sprint-20/README.md`
- Modify: `handoff.md`

**Step 1: Update sprint artifacts**

Add the delivered Hypercare Command Center scope and note the new route/service/tests.

**Step 2: Run full verification**

Run: `npm run test:unit`
Expected: PASS

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add docs/sprint-20/README.md handoff.md
git commit -m "sprint-20: document hypercare command center delivery"
```
