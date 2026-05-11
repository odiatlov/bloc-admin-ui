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

Apartments include the Romanian association fields needed for realistic allocation: usable surface, heating area, indivisible share, declared family/person records, owner/tenant/inactive resident roles, and district/private heating status.

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
