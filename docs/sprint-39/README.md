# Sprint 39 — PWA and Offline Field Operations

## Scope completed
- Added `vite-plugin-pwa` configuration with a generated service worker and web manifest.
- Added an IndexedDB-backed offline queue service for:
  - inspection submissions
  - work-order status transitions
  - work-order closeouts
- Wired the Compliance inspection form to queue submissions when offline and sync them when connectivity returns.
- Wired Work Orders status transitions and closeouts to queue while offline and apply optimistic UI updates.
- Added a global offline/pending-sync banner in the app shell with a manual sync action and live queue count.
- Added unit coverage for queue enqueue/flush behavior.

## Verification
- `npm exec vitest --run src/test/offlineQueueService.test.ts src/test/inspectionService.test.ts src/test/inspectionRemediation.test.ts`
- `npm run build`
- Browser verification on the local app:
  - toggled offline state
  - submitted an inspection from Compliance
  - confirmed the offline banner showed `1 queued change(s) pending sync.`
