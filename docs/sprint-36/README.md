# Sprint 36: Notification Context, Sidebar Live Badges, and Dashboard Refresh

## Executive Summary

Sprint 36 lifts notifications from a one-time fetch into a shared context with 60-second auto-polling, feeds live badge counts to every nav item in the Sidebar, and gives the Dashboard a manual Refresh button with a "last updated" timestamp.

---

## Changes

### `src/contexts/NotificationContext.tsx` (new)
- `NotificationProvider` fetches on mount and re-polls every 60s via `setInterval`
- Provides `notifications`, `unreadCount`, `lastRefreshed`, `markAllRead()`, `refresh()`
- Only polls when an authenticated session exists
- `getNavBadgeCounts(notifications)` — pure helper mapping notification types to nav paths (`/tasks`, `/watchlist`, `/training`, `/documents`)

### `src/main.tsx`
- `<NotificationProvider>` wraps `<App>` inside `<AuthProvider>` — single fetch source for the entire app

### `src/components/Layout/Header.tsx`
- Removed local `notificationService.getNotifications()` fetch + `useEffect`
- Now consumes `useNotifications()` context — zero duplicate fetches

### `src/components/Layout/Sidebar.tsx`
- Consumes `useNotifications()` and derives `badgeCounts` via `getNavBadgeCounts`
- Each `NavLink` renders a red pill badge when its path has a count > 0
- Caps at `99+` for large counts

### `src/pages/Dashboard.tsx`
- Added `refreshKey` state — incrementing it re-triggers the data `useEffect`
- Added `refreshedAt` state — shows "Updated Xm ago" next to the window selector
- Added **Refresh** button with spinning `RefreshCw` icon while loading
- Disabled during active load to prevent double-fetches

### `src/test/notificationContext.test.tsx` (new, 6 tests)
Covers: mount fetch, `markAllRead`, `refresh()` re-fetches, error silencing, `getNavBadgeCounts` correct counts, `getNavBadgeCounts` zeros

---

## Exit Criteria

- ✅ Notifications fetched once on app load, auto-refreshed every 60 seconds
- ✅ No duplicate fetches between Header and Sidebar
- ✅ Sidebar shows red badge counts on Tasks, Watchlist, Training, Documents when notifications exist
- ✅ Dashboard shows "Updated Xm ago" and a clickable Refresh button
- ✅ 380 unit tests pass, zero TypeScript errors
