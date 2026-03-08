# Sprint 23: Maintenance, PM, Parts, and Work Order Completion

## Summary
Sprint 23 completes the maintenance management and work order lifecycle layers of the Fleet Asset System, connecting PM templates to real service history, enabling work order generation from PM dues, and introducing a full closeout workflow with SLA tracking.

## Deliverables

### Database Migration (`20260307000100_maintenance_workorder_sprint23.sql`)
- `maintenance_history` table: `equipment_id`, `template_id`, `service_date`, `service_miles`, `service_hours`, `notes`, `performed_by`, `work_order_id`, org-scoped RLS
- `work_orders` new columns: `created_from_template_id` (FK → pm_templates), `repeat_of_work_order_id` (FK → work_orders), `closeout_notes`, `closed_by`
- `work_order_line_items` new columns: `labor_hours`, `technician`
- `parts` catalog table: `sku`, `name`, `category`, `unit_cost`, `quantity_on_hand`

### Type Extensions (`src/types/index.ts`)
- `MaintenanceHistoryEntry` — full service record with optional miles/hours fields
- `PMDueItem` — template + due reason for display in Maintenance page
- `Part` — parts catalog item
- `WorkOrderLineItem` extended with `laborHours?`, `technician?`
- `WorkOrder` extended with `createdFromTemplateId?`, `repeatOfWorkOrderId?`, `closeoutNotes?`, `closedBy?`

### Maintenance Service (`src/services/maintenanceService.ts`)
- `getMaintenanceHistory(equipmentId)` — org-scoped history ordered by service_date desc
- `recordServiceCompletion(input)` — inserts maintenance_history row with optional template/WO linkage
- `generatePMDues(equipmentId, currentMiles, currentHours)` — loads equipment type, applicable PM templates, last service per template, applies `isTemplateDue()` with real data; returns `PMDueItem[]` with human-readable reason strings

### Work Order Service (`src/services/workOrderService.ts`)
- `createWorkOrderFromInspection(inspectionId, details, role?)` — creates Draft WO linked to inspection
- `createWorkOrderFromTemplate(templateId, details, role?)` — creates Draft WO linked to PM template
- `closeOut(id, closeoutNotes, closedBy, role?)` — transitions to Closed with sign-off capture
- `getSLACompliance(orders)` — % of Completed/Closed WOs finished on or before due date
- `getRepeatServiceCount(orders)` — count of WOs with `repeatOfWorkOrderId` set
- `getBacklogCount(orders)` — WOs not in terminal states
- `getOverdueCount(orders)` — open WOs past due date
- `getMTTRDays(orders)` — mean days from created to completed
- `mapWorkOrder` updated for all new columns

### Maintenance Page (`src/pages/Maintenance.tsx`)
- Equipment selector dropdown — triggers `generatePMDues()` + `getMaintenanceHistory()` for selected asset
- PM templates table shows "Due" badge for templates in the due list
- Due Reminders section lists all due items with reason string and "Generate WO" button
- "Generate WO" calls `createWorkOrderFromTemplate()` with equipment+template context
- Service history table shows real `maintenance_history` records for selected asset
- Template create modal extended with `appliesToType`, `intervalMiles`, `intervalHours` fields

### Work Orders Page (`src/pages/WorkOrders.tsx`)
- Equipment selector in create modal — links WO to an asset
- SLA metric card showing `getSLACompliance()` result; repeat-count card
- Work order rows show "PM" badge (`createdFromTemplateId`) and "repeat" badge (`repeatOfWorkOrderId`)
- Asset column shows linked equipment's `assetTag`
- "Close" status transition opens closeout modal instead of direct transition
- Closeout modal captures notes → calls `workOrderService.closeOut()`

## Exit Criteria
- [x] `maintenance_history` and `parts` tables created with RLS
- [x] `generatePMDues()` uses real DB data (equipment type, templates, history)
- [x] PM page shows live due status per template per selected asset
- [x] "Generate WO" creates draft work order linked to PM template
- [x] Work orders can be created linked to equipment
- [x] Close transition requires closeout notes; calls `closeOut()` service method
- [x] SLA compliance metric computed from real WO data
- [x] Zero TypeScript errors (`npm run build` clean)
- [x] All 298 unit tests pass
