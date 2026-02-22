# Equipment Vehicle Fields Design

## Goal
Add the provided vehicle, sales vehicle, truck, and trailer fields to the `equipment` table with typed columns and enums, and surface all fields in the Equipment create/edit/view UI.

## Roles/Constraints
- All new fields are optional initially.
- Enums are used where possible to protect data integrity.
- `Ins. Class` remains free-text until a controlled list is defined.

## Schema (Equipment Table)

### New Columns (Typed)
- Dates
  - `removed_from_fleet` (DATE)
  - `added_to_fleet` (DATE)
  - `follow_up` (DATE)
  - `as_of_date` (DATE) — for the `2/1/2026` field
- Numbers
  - `gross_weight` (INT)
  - `vehicle_value` (NUMERIC)
  - `mth_lease_charge` (NUMERIC)
  - `mileage_charge` (NUMERIC)
  - `months_in_service` (INT)
  - `avg_miles_per_month` (INT)
  - `estimated_odometer_6mo` (INT)
  - `lease_expir_year` (INT)
- Text
  - `div_number` (TEXT)
  - `division` (TEXT)
  - `corp` (TEXT)
  - `owner` (TEXT)
  - `city` (TEXT)
  - `vin` (TEXT)
  - `ins_class` (TEXT) — free-text
  - `gl_acct` (TEXT)
  - `geotab` (TEXT)
  - `toll_transponder` (TEXT)
  - `driver` (TEXT)
  - `rep_code` (TEXT)
  - `driver_check_number` (TEXT)
  - `license_plate` (TEXT)
  - `notes` (TEXT)
  - `mgr` (TEXT)
  - `email` (TEXT)
  - `phone` (TEXT)
  - `imei` (TEXT)
  - `eld_notes` (TEXT)
  - `vehicle_number` (TEXT)

### Enums
- `own_lease` (ENUM): `Own`, `Lease`, `Rent`
- `eld_logging` (ENUM): `Enabled`, `Disabled`, `Exempt`
- `state` (ENUM): US states only
- `vehicle_type` (ENUM): `Sales Vehicle`, `Truck`, `Trailer`

## UI (Equipment Create/Edit/View)
Add a `Vehicle & Leasing` section in the Equipment modal and detail view with subsections:

1. **Identity**
   - Vehicle #, VIN, License Plate #, State, Vehicle Type
2. **Ownership & Leasing**
   - Own/Lease/Rent, Owner, Mth Lease Charge, Mileage Charge, Lease Expir. Year
3. **Operations**
   - Added to Fleet, Removed from Fleet, Gross Weight, Geotab, Toll Transponder, ELD Logging, IMEI #, ELD Notes
4. **Assignment**
   - Driver, Rep Code, Driver Check #, MGR, Email, Ph #
5. **Metrics**
   - Vehicle Value, Months In Service, 2/1/2026, Avg Miles Per Month, Estimated Odometer 6 months
6. **Accounting**
   - Div #, Div, Corp, GL Acct, Ins. Class
7. **Notes**
   - Notes (multiline)

## Validation
- All enum fields rendered as dropdowns.
- Typed input controls with minimal validation:
  - Dates: date inputs
  - Numbers: numeric inputs with `min=0` where appropriate
  - Email: `type="email"`
  - Phone: `type="tel"`
- All fields optional.

## Dependencies
- Add SQL migration for new columns and enums.
- Update Equipment UI form and view logic.
- Update any equipment service typings to include new fields.

