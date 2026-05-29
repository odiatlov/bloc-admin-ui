# Bloc Admin Maintenance Architecture

## Folder Structure

Mock data is split by business domain and re-exported through `src/mocks/index.ts`. The legacy `src/mocks/apartmentData.ts` remains as a compatibility barrel so existing imports keep working while new code can import from domain modules.

- `src/types/apartment.ts` contains shared TypeScript contracts.
- `src/mocks/blocks` contains blocks, staircases, and apartments.
- `src/mocks/residents` contains residents and family declarations.
- `src/mocks/finance` contains invoices, payments, cash entries, expense categories, allocation rules, debts, and penalties.
- `src/mocks/utilities` contains monthly inputs, apartment meter readings, main meter readings, and allocation snapshots.
- `src/mocks/reports` contains reporting periods.
- `src/utils/maintenanceEngine.ts` contains rule-based allocation and monthly maintenance generation.

## Domain Model

Apartments include the Romanian association fields needed for realistic allocation: usable surface, total surface, heated surface, optional balcony surface, indivisible share, declared family/person records, resident-apartment ownership links, and apartment/building heating configuration. Surface values are stored in square meters and validated with `validateApartmentSurfaces`.

Residents no longer belong to a single apartment directly. `ResidentApartment` is the junction model and stores ownership type (`owner`, `tenant`, `co_owner`, `family_member`), start/end dates, and the primary residence flag. This supports one resident owning or renting apartments across buildings with different administrators.

Apartments and residents are separate setup records. An apartment can be created before any resident is assigned, can remain empty, and can be marked as unconfigured while required administrative details are still missing. Residents can be created manually with name, optional email, optional phone, optional apartment assignment, and account status (`no_account`, `invited`, `active`). A resident without email or without an authenticated user account is valid, because not every resident will log in to the platform.

Administrator assignment is modeled with `BuildingAdminAssignment`. Each record stores the building, admin, active dates, audit fields (`createdBy`, `updatedBy`), and the assignment reason. The current active admin is derived from active assignment history rather than hardcoded in page logic.

Monthly generated data is separated from static setup:

- Static setup: blocks, staircases, apartments, residents, families, expense categories, allocation rules.
- Monthly inputs: utility invoices, manual expenses, water readings, main meter readings, historical debts, penalties.
- Generated data: draft or published monthly maintenance runs with apartment totals and explainable line items.

## Expense Engine

The engine never hardcodes formulas in invoice code. Each `MonthlyExpense` points to an `AllocationRule`, and the rule selects one of:

- `per_person`
- `per_apartment`
- `by_surface`
- `by_heating_area`
- `individual_meter`
- `equal_split`
- `custom`

Scopes support whole building, staircase, individual apartment, and custom apartment groups. This covers common Romanian flows such as garbage by declared persons, administration by apartment, heating by heating area, water by meter, staircase electricity by eligible apartments, and manual repairs by a custom group.

Heating is modeled through `HeatingType`: `central`, `individual`, `gas_boiler`, and `district`. The maintenance engine keeps heating allocation modular through `by_heating_area`, and gas-boiler apartments can add a configurable boiler fee line, currently using the Romanian demo rule of 20% over eligible shared costs.

## Permissions Model

Mock authentication uses account identities with one or more roles. A person can be both `Admin` and `Resident`, or `Resident` and `Censor`, but the active role is chosen only at login. The app no longer exposes a top-bar account switcher, so users cannot jump into another account after authentication.

- `SuperAdmin`: application support team account with full visibility for maintenance/support.
- `Admin`: sees only buildings from active `BuildingAdminAssignment` records.
- `Resident`: sees only apartments linked through `ResidentApartment`.
- `Censor`: sees review/reporting surfaces according to configured role permissions.

## API Shape Recommendation

Recommended resource endpoints for a backend migration:

- `GET /auth/mock-accounts`, `POST /auth/login`, `POST /auth/logout`
- `GET /buildings`, `GET /buildings/:id`, `GET /buildings/:id/admin-assignments`
- `POST /buildings/:id/admin-assignments`, `PATCH /admin-assignments/:id/end`
- `GET /apartments`, `POST /apartments`, `GET /apartments/:id`, `PATCH /apartments/:id`
- `GET /residents`, `POST /residents`, `GET /residents/:id/apartments`, `POST /resident-apartments`, `PATCH /resident-apartments/:id`
- `POST /maintenance-runs`, `GET /maintenance-runs/:id`
- `GET /reports/monthly?month=YYYY-MM&buildingId=...`

## Database Schema Suggestions

- `buildings(id, name, address, heating_type, created_at, updated_at)`
- `apartments(id, building_id, staircase_id, floor, number, family_name, primary_owner_id, setup_status, usable_surface, total_surface, heated_surface, balcony_surface, indivisible_share, heating_type, boiler_tax_enabled, boiler_tax_percentage)`
- `residents(id, name, email, phone, status, account_status, user_account_id)`
- `resident_apartments(id, resident_id, apartment_id, ownership_type, ownership_start_date, ownership_end_date, is_primary_residence)`
- `administrators(id, name, email, phone, role)`
- `building_admin_assignments(id, building_id, admin_id, start_date, end_date, is_active, assignment_reason, created_by, updated_by)`
- `monthly_expenses(id, building_id, month, category_id, amount, rule_id, source)`
- `maintenance_runs(id, building_id, month, status, generated_at, published_at)`

## Workflows

Admin workflow:

1. Configure apartments, owners, residents, areas, heating status, and family declarations.
2. Record utility invoices, main meter readings, apartment readings, manual expenses, debts, and penalties.
3. Generate a monthly draft maintenance run.
4. Review explanations per apartment and correct inputs or rules.
5. Publish the month and expose invoices to residents.

Resident workflow:

1. View current maintenance balance and invoice history.
2. Review line-level explanations for charges.
3. Submit water index readings.
4. Pay by bank or cash and track verification status.

## State Management Recommendation

Keep this mock module shape while the app is frontend-only. When backend APIs arrive, introduce a thin repository layer per domain, then move async server state to TanStack Query. Keep local UI state in component hooks and keep role/locale/theme in React context. Avoid global stores for derived maintenance totals; generate them from normalized inputs so drafts remain explainable and auditable.
