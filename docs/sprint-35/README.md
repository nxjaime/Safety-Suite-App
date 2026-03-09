# Sprint 35: Global Search and Error Boundaries

## Executive Summary

Sprint 35 delivers two features: the search bar that existed in every page's header but did nothing now opens a full global search modal, and a React error boundary wraps every route so a broken component never takes down the entire application.

---

## 1. Global Search

### `src/services/searchService.ts`
Four parallel queries via `Promise.allSettled` (one source failing does not suppress others):
- **Drivers** — `full_name` ilike match → `href: /drivers/:id`
- **Tasks** — `title` ilike match → `href: /tasks`
- **Equipment** — `name OR unit_number` match → `href: /equipment`
- **Documents** — `name` ilike match → `href: /documents`

All queries are org-scoped, limited to 5 results per type, return empty array for queries < 2 characters.

### `src/components/SearchPanel.tsx`
Full-screen overlay with:
- Auto-focused input, 250ms debounce
- Results grouped by type (Drivers / Tasks / Equipment / Documents) with section headers
- Keyboard navigation: ↑↓ arrows move selection, Enter navigates, Escape closes
- Mouse hover also sets active item
- Severity-independent — uses neutral emerald highlight
- Empty / loading / no-results states
- Keyboard shortcut hint row when results are present

### `src/components/Layout/Header.tsx`
- Non-functional `<input>` replaced with a trigger `<button>` showing `⌘K` hint
- Global `keydown` listener opens panel on `Cmd+K` / `Ctrl+K` from anywhere in the app

---

## 2. Error Boundaries

### `src/components/ErrorBoundary.tsx`
React class component (`getDerivedStateFromError` + `componentDidCatch`):
- Catches any render-phase error thrown by a child
- Shows: warning icon, "Something went wrong", error message (truncated), "Reload page" + "Go to Dashboard" buttons
- `componentDidCatch` logs to console (hook point for production observability)

### `src/App.tsx`
Every `<Suspense>` block is wrapped in `<ErrorBoundary>` — crash isolation at the individual route level. A broken Driver Profile page cannot crash the Equipment page.

---

## Exit Criteria

- ✅ Search panel opens via ⌘K or search button click from any page
- ✅ Drivers, tasks, equipment, and documents all return live results
- ✅ Keyboard navigation (↑↓ Enter Esc) fully functional
- ✅ Single source failure degrades gracefully (other sources still return)
- ✅ Error boundary renders recovery UI instead of white screen on component crash
- ✅ All routes individually isolated — one crash cannot cascade
- ✅ 374 unit tests pass, zero TypeScript errors
