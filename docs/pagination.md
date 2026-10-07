# Shared List Pagination

Every `ResponsiveDataView` displays at most 10 records per page. Tables and responsive cards use the same sliced rows and page state.

## Integration

- Each instance supplies a unique `paginationId` within its route.
- Filterable instances supply `paginationResetKey` containing their search, filters, or selected entity.
- `DataViewPaginationProvider` sits above the route content, preserving independent list pages when loading temporarily unmounts a list.
- Route, account, or role changes reset the provider. Language, theme, and width changes preserve the current page.
- A shortened collection clamps the page to the last valid page before rendering.
- The entire pagination footer is hidden when the filtered total is 10 records or fewer, using the API total for server-paged lists.
- Wider containers show numbered navigation; narrower containers show previous/next controls and a page counter.

## API Boundary

Database-backed lists use `PagedResponsiveDataView`, which delegates rendering to the same `ResponsiveDataView` with controlled server pagination. The shared hook cancels superseded requests, hides results from old filters/accounts, and retains the previous page with a busy indicator during page navigation. Server pages are never sliced again locally.

Paginated GET endpoints:

| Endpoint | Data |
| --- | --- |
| `/blocks/overview/page` | Authorized block overviews |
| `/apartments/page` | Apartments with block, staircase, floor, status and search filters |
| `/staircases/page` | Staircases with block and search filters |
| `/residents/page` | Scoped residents with name, block, staircase and status filters |
| `/super-admin/admin-accounts/page` | Administrator accounts and invitations |
| `/super-admin/blocks/page` | Global block overviews |
| `/water-consumptions/page` | Scoped consumption with period, block and administrator filters |
| `/super-admin/water/readings/page` | Meter history within the selected date range |
| `/water-readings/resident-summary/page` | Configured resident apartment/period summaries, including missing indexes |

Requests use one-based `pageNumber` and a fixed `pageSize=10`. Responses retain the `ApiResponse` envelope and contain `items`, `pageNumber`, `pageSize`, and `totalCount`. The API validates active database accounts, applies authorization and filters before counting/paging, and includes unique ID ordering. Invalid page sizes are rejected. Oversized page numbers recover to the last valid page. No schema changes or migrations are needed.

Resident summaries include synthetic periods with no readings. The repository derives their total from authorized apartment settings, selects at most 10 period keys, and queries SQL aggregates only for those keys.

All 11 database-backed list instances now use these endpoints. Remaining display-only fixture lists retain local pagination. Existing array GETs remain compatible, and parent collections still serve existing selectors, summaries, charts, exports, and mutation refreshes. Some pages therefore still fetch complete supporting collections during initial loading; reducing those separate dependencies further requires metadata/aggregate-specific contracts.

## Verification

Run `npm run build`, `dotnet build --no-restore` in the API project, and lint the shared pagination source. Temporary read-only GET checks verified live SQL-backed endpoints, filtered totals, page traversal, authorization, invitations, history and resident summaries without modifying database data. No verification scripts or UI test files are included. Browser interaction and screenshot verification were not completed because the browser launch was declined.

## PR Description

Add fixed pagination of 10 items to all 31 shared list instances across the admin and support areas. Desktop tables and responsive cards share the same page. Keep pagination state across loading refreshes, reset it for changed filters or account scope, and recover when the final page shrinks after deletion. Include English and Romanian labels and responsive navigation controls.

Add validated, authorized paginated GET contracts and SQL-backed queries, and connect all 11 database-backed list instances through a shared cancellable fetching hook and controlled pagination adapter. Preserve array-based GET consumers and supporting collections used by selectors, summaries, charts and exports. Remaining fixture lists paginate locally.

Validation: frontend and API builds, shared pagination source lint, and read-only live API checks pass. Linting all changed callers reports six existing `react-hooks/set-state-in-effect` errors in unchanged effect code. Browser interaction and screenshot verification were not completed. No UI tests are included.

Suggested branch: `feature/list-pagination`

Suggested commit: `add list pagination`
