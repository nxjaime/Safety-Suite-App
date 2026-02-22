# Sprint 3 Design

**Goal:** Implement Fleet Operations core with Equipment as the hub, type-specific inspections, PM templates, and work orders.

---

## Information Architecture
- Primary hub: **Fleet > Equipment**
- Dedicated page: **Maintenance**
- Supporting views: **Inspections**, **Work Orders**

## Data Model

### Equipment
- Types: trucks, trailers, forklifts, pallet jacks, sales vehicles
- Ownership: `owned | leased | rented`
- Usage: miles + hours
- Status: active/inactive/out-of-service
- Forklift attachments: multi-select (low mast, forks, box clamp, extended forks, boom)

### Vehicle Attachments
- Cameras and tablets are attachments linked to vehicle records (no standalone equipment records)

### Inspections
- Type-specific templates per equipment type
- Defects logged with severity
- Out-of-service flag triggers work order auto-create

### Preventive Maintenance
- Template-based recurring schedules
- Time + miles + hours triggers
- Applied per asset or asset group

### Work Orders
- Status: Draft → Approved → In Progress → Completed → Closed
- Approvers: Admin + Fleet Manager
- Line items: parts + labor with totals

## Workflows

1. Equipment lifecycle
   - Create equipment record → update usage (miles/hours) → manage attachments

2. Inspections
   - Type-specific form → defect logging → OOS auto work order

3. Preventive Maintenance
   - Create PM templates → assign to equipment → generate work orders when due

4. Work Orders
   - Draft → approval → in-progress → completion → closeout

## UI + Testing

UI changes:
- Equipment profile tabs: Overview, Inspections, Maintenance, Work Orders
- Maintenance page: PM templates + due list
- Inspections: type-specific forms with defect severity + OOS toggle
- Work Orders: status pipeline and line-item table

Testing:
- Unit tests for PM scheduling logic
- Unit tests for work order status transitions
- Integration test: inspection OOS → auto work order created

## Accessibility
- WCAG AA baseline from Sprint 2 applied to new UI components
