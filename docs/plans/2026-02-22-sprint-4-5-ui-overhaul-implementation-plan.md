# Sprint 4.5 Implementation Plan — UI Modernization Overhaul

**Goal:** Deliver a modern, cohesive UI across core routes without changing domain behavior.

## Task 1: Token and Theme Foundation
**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css` (or global style entry)

**Steps:**
1. Define refreshed color tokens for surfaces, borders, text hierarchy, interactive states, and safety semantics.
2. Normalize spacing and radius scales used by core components.
3. Align typography scale and heading/body usage.
4. Document token usage guidelines in comments or sprint docs.

**Verification:**
- Build passes and no broken class references.

## Task 2: App Shell Refresh
**Files:**
- Modify: `src/components/Layout/Sidebar.tsx`
- Modify: `src/components/Layout/Header.tsx`
- Modify: shared layout wrappers if applicable

**Steps:**
1. Update sidebar structure/active styling and section readability.
2. Standardize top bar/page header action alignment.
3. Ensure responsive behavior for compact widths.

**Verification:**
- `src/test/navigation.test.tsx` remains passing.

## Task 3: Shared UI Primitives
**Files:**
- Modify/Add: shared components under `src/components/UI/*`

**Steps:**
1. Create/refine reusable primitives:
   - Page section header
   - Metric/stat card
   - Status/risk pill
   - Empty/error panel
2. Replace ad-hoc styling in target pages with these primitives.

**Verification:**
- Route UI renders consistently with no style regressions.

## Task 4: Route-by-Route Page Modernization
**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Drivers.tsx`
- Modify: `src/pages/DriverProfile.tsx`
- Modify: `src/pages/Safety.tsx`
- Modify: `src/pages/Equipment.tsx`
- Modify: `src/pages/Maintenance.tsx`
- Modify: `src/pages/WorkOrders.tsx`

**Steps:**
1. Standardize page header and action zones.
2. Improve table/list readability and status representation.
3. Apply loading, empty, and error states consistently.
4. Preserve all existing data/service behavior.

**Verification:**
- Manual walkthrough of all prioritized routes on desktop/mobile widths.

## Task 5: Accessibility and UX Polish
**Files:**
- Modify target page/component files as needed

**Steps:**
1. Validate color contrast and focus indicators.
2. Ensure keyboard access for major interactive controls.
3. Fix spacing and text density issues discovered in walkthrough.

**Verification:**
- Smoke accessibility check on key routes.

## Task 6: Sprint Artifacts and Verification
**Files:**
- Modify: `handoff.md`
- Add: `docs/sprint-4-5/summary.md`
- Add: `docs/sprint-4-5/verification.md`

**Steps:**
1. Record completed UI overhaul scope and decisions.
2. Capture commands/run results and remaining risks.

**Verification Commands:**
1. `npm run test -- --run src/test`
2. `npm run build`

## Commit Protocol
- Commit message: `sprint-4.5: ui modernization overhaul`
- Push after all checks pass.
