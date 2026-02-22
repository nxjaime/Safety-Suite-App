# Sprint 4.5 Design — UI Modernization Overhaul

## Goal
Modernize the product interface so it feels current, trustworthy, and operationally sharp for a fleet safety platform blending Fleetio-style operations with Idelic-style intelligence.

## Design Outcomes
- Improve information hierarchy and scanning speed on dense operational screens.
- Replace dated visual treatment with a cohesive tokenized system (color, typography, spacing, elevation).
- Preserve existing workflows while upgrading perception, clarity, and usability.

## Visual Direction
- Tone: professional operations console with high signal-to-noise ratio.
- Typography: strong headings, compact but readable body scale, consistent weights.
- Color strategy:
  - Neutral surfaces for structure.
  - Safety semantic palette for risk/compliance states (green/yellow/red).
  - Controlled accent usage for primary actions and focus.
- Components: cleaner cards, clearer boundaries, stronger table readability, consistent form controls.

## Layout Direction
- App shell:
  - Sidebar with clearer grouping, section labels, and active-state treatment.
  - Top bar with stronger page identity and action alignment.
- Page frame:
  - Standardized header zone (title, context, primary/secondary actions).
  - Reusable content sections with consistent spacing rhythm.
  - Responsive behavior optimized for desktop first, tablet/mobile fallback.

## Priority Routes
1. `Dashboard`
2. `Drivers`
3. `DriverProfile`
4. `Safety`
5. `Equipment`
6. `Maintenance`
7. `Work Orders`

## UX Quality Baselines
- Loading: skeletons over spinners for major lists/cards.
- Empty states: actionable guidance and next-step CTA.
- Error states: scoped, readable, and recoverable.
- Accessibility:
  - WCAG AA contrast.
  - Visible focus states.
  - Keyboard-usable navigation and controls.

## Technical Approach
- Use and expand the existing token system (`tailwind.config.js`, global styles, shared UI components).
- Introduce reusable layout primitives (page container, section header, metric card, status pill).
- Migrate prioritized pages route-by-route while preserving data/service behavior.

## Acceptance Criteria
- Core routes use the new visual system and shared layout primitives.
- Color semantics for risk/compliance are consistent across dashboards, lists, and profiles.
- No regressions to core route navigation/tests/build.
- Product/design sign-off confirms the updated UI direction.
