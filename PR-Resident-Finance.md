## Summary

Residents can see their current amount due and published bill history, and open every bill's saved components with clear explanations. Administrators can publish reports from the existing report workflow.

## Changes Made

- Order report actions as primary Publish, secondary Export Excel, then borderless Back to Reports.
- Add publication review with due-date/debt choices, pending protection, saved retry identities and Published status.
- Connect resident balances, paginated bills and detail loading to the new backend APIs. Dashboard Pay navigates to My Bills.
- Reuse the drawer for all report charges/adjustments, matching totals, saved quantities and resident-friendly calculation explanations.
- Preserve separate loading/error/retry/empty states and clear old account data immediately. Keep explicit demo fixtures isolated.

## Architecture Notes

Reuse shared API, identity/filter, date-picker, dialog, responsive-list and drawer patterns. Add focused resident finance hooks and dashboard components. Published amounts come from saved report evidence; the frontend does not recalculate historical bills or simulate payment completion.

## Reuse & Integration

Extend ResponsiveDataView with an optional row/card click callback and preserve existing drawer callers. Publish is disabled for outdated, superseded or already-published reports. Operational payment-confirmation/download placeholders are excluded.

## Translation Impact

Add English/Romanian publication controls, errors, statuses and explanations for allocations, rates, manual amounts, water differences, heating, debts and signed adjustments. Preserve existing locale formatting/encoding and validate JSON.

## Testing Notes

- Full suite: 15 files, 86 tests pass. Five new finance test files cover 21 cases, rerun after final drawer changes.
- Cover button hierarchy in both themes, publication validation/retry, all bill components/reasons, Romanian copy, navigation, request states and account isolation.
- Changed-file ESLint, TypeScript and production build pass. Existing large-bundle warning remains.
- Live browser checks were blocked by the browser permission gate; responsive geometry remains visually unverified. Ports and running services were left untouched at the user's request.

Branch: existing `feature/36-add-finance-resident`. Suggested commit: `add resident billing`.
