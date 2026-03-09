# Sprint 32: Driver Activity Timeline and Tasks Overdue Management

## Executive Summary

Sprint 32 delivers two high-operational-value features that were the last visible gaps in the two most-used operational workflows: the Driver Profile now has a unified activity timeline giving safety managers a complete chronological view of every driver event, and the Tasks page now surfaces overdue tasks prominently with status progression controls.

---

## 1. Driver Activity Timeline (`src/pages/DriverProfile.tsx`)

**Before:** DriverProfile had four tabs — Overview, Safety & Compliance, Documents, Training. There was no single place to see a driver's complete activity history in chronological order.

**After:** A fifth **Timeline** tab aggregates all recorded driver activity, newest-first, from every data source already loaded in the profile:

| Source | Event Kind | Color |
|---|---|---|
| `riskEvents` | Risk Event | Red |
| `trainingAssignments` (Completed) | Training | Green |
| `trainingAssignments` (escalated) | Training Escalated | Orange |
| `driver.coachingPlans` start | Coaching Started | Blue |
| `driver.coachingPlans` check-ins (Complete) | Coaching Check-in | Blue |
| `driverDocuments` | Document | Slate |
| `motiveEvents` | Telematics | Purple |

Each timeline entry shows:
- Date (formatted, localized)
- Event kind icon + color-coded left border
- Event title and detail line
- Event type label

No new data fetches required — all sources are already fetched during profile load. The `timeline` array is built with `useMemo` and re-computed only when the underlying data changes.

**Implementation:**
- Extended `activeTab` type to include `'timeline'`
- Added `BookOpen`, `Activity`, `Clock` to lucide imports
- Added `timeline` useMemo aggregating 5 sources, sorted descending by date
- Added Timeline tab button in tab bar
- Added Timeline tab content rendered with a vertical `<ol>` timeline using `border-l-2` track and positioned dot markers

---

## 2. Tasks Overdue Surfacing (`src/pages/Tasks.tsx`)

**Before:** Tasks had full CRUD but no visual indication of overdue items, no summary stats, no way to transition from Pending to In Progress without editing, and no overdue filter.

**After:**

### Summary Stats Bar
Three stat cards above the task table:
- **Active** — total non-completed tasks
- **Overdue** — red-tinted when > 0; counts tasks where `dueDate < today AND status !== Completed`
- **High Priority** — amber; counts high-priority active tasks

### Overdue Row Highlighting
Overdue task rows receive `bg-red-50 hover:bg-red-100` background. The due date cell shows the date in red with a bold "Overdue" pill badge.

### "Start" Button (Pending → In Progress)
A green Play icon button appears on Pending tasks. Clicking it calls `taskService.updateTaskStatus(id, 'In Progress')` and reloads the list. This enables explicit status progression without opening the edit modal.

### Overdue Filter Option
The status filter dropdown now includes an **Overdue** option (showing only tasks where `dueDate < today AND status !== Completed`).

---

## Exit Criteria

- ✅ Driver Timeline tab renders unified chronological activity from all 5 data sources
- ✅ Timeline entries are color-coded, icon-differentiated, and sorted newest-first
- ✅ Tasks overdue stat card shows live count with red highlight when > 0
- ✅ Overdue task rows visually flagged with red background and "Overdue" badge
- ✅ "Start" button transitions Pending → In Progress inline
- ✅ "Overdue" filter option added to status filter
- ✅ 344 unit tests pass, zero TypeScript errors
