# Sprint 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Sprint 2 IA/navigation refactor, design tokens, and AA accessibility baseline.

**Architecture:** Introduce a tokenized design system and update navigation structure to reflect Operations/Fleet/Safety/Reporting/Settings. Apply shared components and accessibility rules across core routes.

**Tech Stack:** React 19, Vite, Tailwind CSS, TypeScript, React Router

---

### Task 1: Define design tokens

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

**Step 1: Write the failing test**

```ts
// No tests required for token definitions; proceed to implementation.
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/test`
Expected: PASS (no tests added for tokens)

**Step 3: Write minimal implementation**

- Add color tokens for neutrals and safety accents
- Add font family tokens for `Space Grotesk` and `Inter`
- Define spacing/size scale if missing

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/test`
Expected: PASS

**Step 5: Commit**

```bash
git add tailwind.config.js src/index.css
git commit -m "sprint-2: add design tokens"
```

### Task 2: Update app navigation IA

**Files:**
- Modify: `src/components/Layout/Sidebar.tsx`
- Modify: `src/components/Layout/Header.tsx`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

```ts
// Add a simple render test to assert nav labels exist
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/test`
Expected: FAIL (new test should fail before updates)

**Step 3: Write minimal implementation**

- Add top-level sections: Operations, Fleet, Safety, Reporting, Settings
- Nest Fleet under Operations in sidebar
- Nest Compliance under Safety
- Keep Reporting top-level

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Layout/Sidebar.tsx src/components/Layout/Header.tsx src/App.tsx src/test/*
git commit -m "sprint-2: update navigation IA"
```

### Task 3: Apply shared component styles

**Files:**
- Modify: `src/components/UI/Modal.tsx`
- Modify: `src/components/Layout/Layout.tsx`
- Modify: `src/pages/*` (core routes)

**Step 1: Write the failing test**

```ts
// Add snapshot or simple render tests for core layout
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/test`
Expected: FAIL (before changes)

**Step 3: Write minimal implementation**

- Apply tokenized classes
- Normalize card, table, and form styles
- Ensure loading/empty/error states are consistent

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components src/pages src/test
git commit -m "sprint-2: standardize core UI components"
```

### Task 4: Accessibility baseline enforcement

**Files:**
- Modify: `src/pages/*`
- Modify: `src/components/*`

**Step 1: Write the failing test**

```ts
// Add checks for aria labels and focusable elements where possible
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/test`
Expected: FAIL (missing aria/focus states)

**Step 3: Write minimal implementation**

- Ensure labels for all inputs
- Add focus styles on interactive elements
- Verify color contrast via token usage

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components src/pages src/test
git commit -m "sprint-2: apply WCAG AA baseline"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-21-sprint-2-implementation-plan.md`.

Two execution options:

1. Subagent-Driven (this session)
2. Parallel Session (separate)
