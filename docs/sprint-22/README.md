# Sprint 22: Fleet Asset System Completion

Status: Complete

## Objective
Convert the Equipment module from a hardcoded, demo-only experience into a durable, persistent, role-aware fleet asset system.

## Implemented in this sprint

### Database migration (`20260307000000_equipment_lifecycle_sprint22.sql`)
- Added `next_service_date`, `archived_at`, `retired_at` columns to `equipment`
- Added CHECK constraint for expanded status values: `active | inactive | out_of_service | maintenance | archived | retired`
- Created `equipment_status_history` table with org-scoped RLS policy for lifecycle audit trail
- Added `linked_equipment_id` FK column to `documents` table with index

### Types (`src/types/index.ts`)
- Expanded `EquipmentStatus` to include `'maintenance' | 'archived' | 'retired'`
- Added optional fields to `Equipment`: `nextServiceDate`, `archivedAt`, `retiredAt`
- Loosened `Equipment.type` from `EquipmentType` enum to `string` to match real-world DB values
- Added `EquipmentStatusHistoryEntry` interface

### `src/services/equipmentService.ts` (new)
- `getEquipment(filters?)` — org-scoped list with optional type and status filters
- `getEquipmentById(id)` — single asset fetch with org scope
- `createEquipment(asset, role?)` — requires `canManageFleet`; inserts with org context
- `updateEquipment(id, updates, role?)` — requires `canManageFleet`; writes status history on status change
- `archiveEquipment(id, role?)` — sets `archived` status and stamps `archived_at`
- `retireEquipment(id, role?)` — sets `retired` status and stamps `retired_at`
- `getStatusHistory(equipmentId)` — fetch ordered status change history
- `getLinkedInspections(equipmentId)` — query inspections by `vehicle_name = asset_tag`
- `getLinkedWorkOrders(equipmentId)` — query `work_orders` by `equipment_id` FK
- `getLinkedDocuments(equipmentId)` — query `documents` by `linked_equipment_id`

### `src/services/documentService.ts`
- Added `linkedEquipmentId` to `AppDocument` interface
- Extended `UploadDocumentInput` with `linkedEquipmentId?`
- `uploadDocument` now includes `linked_equipment_id` in DB insert
- `mapDocument` now maps `linked_equipment_id` to `linkedEquipmentId`

### `src/pages/Equipment.tsx` (rewritten)
- Removed all hardcoded `vehicles` seed data (7 demo rows)
- Added `useAuth()` for role and capability checks
- Equipment list loads via `equipmentService.getEquipment()` on mount and on category/status filter changes
- `handleAddAsset` and `handleEdit` persist through `equipmentService.createEquipment` / `updateEquipment`
- Add/Edit buttons are hidden for roles without `canManageFleet`
- Archive and Retire actions added per row (fleet-capable roles only); write lifecycle records
- Status filter dropdown added to asset list (All / Active / Maintenance / Out of Service / Inactive / Archived / Retired)
- `selectedEquipmentId` state: clicking "View" on a row selects that asset
- Inspections tab: loads `equipmentService.getLinkedInspections(selectedEquipmentId)`
- Maintenance tab: loads `maintenanceService.getTemplates()` filtered by asset type
- Work Orders tab: loads `equipmentService.getLinkedWorkOrders(selectedEquipmentId)`
- Documents tab: loads `equipmentService.getLinkedDocuments(selectedEquipmentId)`
- `equipmentProfileTabs` updated to include `'Documents'`

### Tests
- `src/test/equipmentService.test.ts` (new) — 14 tests covering:
  - Org scoping on `getEquipment`
  - Type filter passthrough
  - Role gate rejections for `safety`, `readonly`, `coaching` on mutations
  - `maintenance` and `full` roles can create equipment
  - `organization_id` is stamped on insert
  - Status history insert triggered on status change
  - `archiveEquipment` / `retireEquipment` pass correct status
  - `getLinkedWorkOrders` queries correct table/column
  - `getLinkedDocuments` queries correct table/column
- `src/test/equipmentTabs.test.ts` — updated to assert 5 tabs including `'Documents'`

## Verification
- `npm run test:unit` — 298 tests, all passing
- `npm run build` — clean

## Exit Criteria Met
- Equipment CRUD is fully persistent: all mutations go through `equipmentService`, no local demo state remains
- Equipment CRUD is role-aware: `canManageFleet` gates create/update/archive/retire; Add/Edit/Archive/Retire UI controls hidden for non-fleet roles
- Asset detail views reflect linked downstream workflows: Inspections, Maintenance, Work Orders, Documents all fetch real data per selected asset
- No hardcoded fleet inventory remains in the primary equipment workflow

## Notes
- Inspection linkage uses `vehicle_name = asset_tag` (text match) because the `inspections` table has no `equipment_id` FK yet. Sprint 24 (Inspection and Compliance Operations) will add a proper FK and migrate existing records.
- RLS on `equipment` and `pm_templates` remains `FOR ALL USING (true)` from the Sprint 10 baseline migration. Schema-level RLS tightening is deferred to Sprint 29 (Admin/Enterprise Controls) per the Sprint 21 closeout note.
