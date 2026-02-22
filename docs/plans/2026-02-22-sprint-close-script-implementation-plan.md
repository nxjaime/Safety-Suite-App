# Sprint Close Script Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a sprint close script that auto-stages, runs checks, commits with sprint-based message, and pushes to current branch.

**Architecture:** POSIX `sh` script in `scripts/` with strict error handling. Parses sprint number from `handoff.md` using `awk`/`sed`. Updates README with usage.

**Tech Stack:** shell, git, npm

---

### Task 1: Add sprint close script

**Files:**
- Create: `scripts/sprint-close.sh`

**Step 1: Write the failing test**

```sh
# No automated tests; proceed to implementation.
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/test`
Expected: PASS

**Step 3: Write minimal implementation**

- Script stages all changes
- Parses sprint number from `handoff.md`
- Runs build + tests
- Commits with `sprint-<n>: closeout`
- Pushes current branch

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/test`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/sprint-close.sh
git commit -m "chore: add sprint close script"
```

### Task 2: Document usage

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

```sh
# No automated tests; proceed to implementation.
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/test`
Expected: PASS

**Step 3: Write minimal implementation**

- Add a short section for sprint close script usage

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/test`
Expected: PASS

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add sprint close script usage"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-22-sprint-close-script-implementation-plan.md`.

Two execution options:

1. Subagent-Driven (this session)
2. Parallel Session (separate)
