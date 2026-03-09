# Sprint 34: Header Live Profile and Real Notification Center

## Executive Summary

Sprint 34 closes two visible operational gaps introduced by the Sprint 33 profile migration and the long-standing static bell button in the header: the Header now displays the authenticated user's real name and avatar (loaded from the Supabase `profiles` table and refreshed live), and the notification bell now shows a live badge count and actionable dropdown sourced from four real data streams.

---

## 1. Header Live Profile Sync (`src/components/Layout/Header.tsx`)

**Before:** Header read `user?.user_metadata?.full_name` and a hardcoded Unsplash fallback avatar URL. After a user saved profile changes in Sprint 33's rewritten `UserProfile.tsx`, the Header never updated until re-authentication.

**After:**
- Local `profileState` loaded via `profileService.getExtendedProfile()` on mount
- Listens for `'userProfileUpdated'` CustomEvent (dispatched by `UserProfile.tsx` on save) and re-fetches immediately
- Avatar falls back to a Lucide `User` icon (with `data-testid="avatar-fallback"`) instead of a hardcoded external URL
- Both changes in a single `useEffect` with `user` in the dep array; cleanup removes the event listener

---

## 2. Notification Service (`src/services/notificationService.ts`)

Four parallel collectors aggregated via `Promise.allSettled` (single collector failure does not blank the panel):

| Collector | Source | Severity logic |
|---|---|---|
| Overdue tasks | `tasks` table: `status != Completed AND due_date < today` | `critical` if High priority, `warning` otherwise |
| Expiring documents | `documentService.listDocuments()` → `getExpiringDocuments(docs, 30)` | `critical` ≤ 7 days, `warning` ≤ 30 days |
| Unreviewed training | `trainingService.getUnreviewedCompletions()` | `info` |
| Pending check-ins | `coaching_plans` where `status = Active`; iterate `weekly_check_ins` JSONB for `Pending` items with `date <= today` | `warning` |

Output sorted: critical first, then warning, then info; within tier by `createdAt` descending.

Also exports `formatBadgeCount(n)` — returns `'99+'` when `n > 99`, string of number otherwise.

---

## 3. Notification Panel (`src/components/NotificationPanel.tsx`)

Dropdown anchored to the bell button:
- Badge count on bell (hidden when zero; shows `99+` for counts > 99)
- Panel opens/closes on bell click; closes on outside click or Escape
- Rows grouped by severity via sort order; each row is a `<Link>` that navigates to `href` and closes the panel
- Color-coded left border (red/critical, amber/warning, blue/info) and type-specific icon
- Relative time display (`Xm ago`, `Xh ago`, `Xd ago`)
- "Mark all read" button clears badge count (local state — no DB write needed)
- Empty state with `BellOff` icon

---

## 4. Tests

| File | Tests |
|---|---|
| `src/test/notificationService.test.ts` | 7 tests: overdue tasks (severity by priority), expiring docs (severity by days), unreviewed training, pending check-ins (only Pending past-due emitted), all-sources-error returns `[]`, `formatBadgeCount` (≤99, >99) |
| `src/test/header.test.tsx` | 6 tests: profile name from profileService, live re-fetch on `userProfileUpdated`, avatar fallback when no URL, badge count shown, badge hidden when empty, `99+` at 100 items |

---

## Exit Criteria

- ✅ Header shows real name/title from `profiles` table, updates on save without re-login
- ✅ Header avatar fallback is a User icon, not a hardcoded external URL
- ✅ Notification bell shows live badge count from 4 real data sources
- ✅ Notification panel opens, renders items color-coded by severity, navigates on click, closes on outside click/Escape
- ✅ "Mark all read" clears badge
- ✅ 363 unit tests pass, zero TypeScript errors
