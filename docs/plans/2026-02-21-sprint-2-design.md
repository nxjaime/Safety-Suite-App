# Sprint 2 Design

**Goal:** Deliver a distinctive IA and visual system for the Fleetio + Idelic hybrid, with AA accessibility baseline.

**Scope:** Navigation/IA refactor, design tokens and typography pairing, and accessibility baseline requirements.

---

## Information Architecture

Top-level sections:
- `Operations`
- `Fleet`
- `Safety`
- `Reporting`
- `Settings`

Section mapping:
- **Operations**: Loads, Orders, Dispatch, Routes, Status Board
- **Fleet**: Trucks, Trailers, Forklifts, Pallet Jacks, Inspections, Maintenance
- **Safety**: Driver Profiles, Risk Events, Coaching Plans, Compliance (subsection), Documents
- **Reporting**: KPIs, Trends, Export
- **Settings**: Users, Roles, System Options (Admin-only areas flagged)

Notes:
- `Fleet` is asset-based and is nested under `Operations` in navigation structure.
- `Compliance` is a child under `Safety`.
- `Reporting` remains top-level.
- `Settings` remains top-level and is not grouped under `Admin`.

## Visual System

Direction: clean industrial with safety accents and distinctive typography.

### Palette
- Neutrals: cool grays for surfaces and layout
- Safety accents:
  - Green for safe/complete
  - Amber for attention/at-risk
  - Red for critical/overdue
- Primary action: deep slate + safety green accent (avoid default blue)

### Typography
- Headings: `Space Grotesk`
- Body: `Inter`

### Layout and Components
- Dense but readable tables with strong row hover and status tags
- Side nav with icon + label and collapsible sections
- KPI cards with consistent status markers
- Form inputs with strong focus rings and clear error text

## Accessibility Baseline (WCAG AA)

- Keyboard navigation for all interactive elements
- Visible focus states with 3:1 contrast minimum
- Form labels/aria for every input, select, and button
- Minimum text size 14px body, 16px for forms
- Color contrast: text on surfaces ≥ 4.5:1, large text ≥ 3:1
- Error states include text + icon + color (not color-only)
