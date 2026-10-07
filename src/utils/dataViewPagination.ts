export const DATA_VIEW_PAGE_SIZE = 10

export type DataViewPageState = { page: number; resetKey: string }

export const resolveDataViewPage = (state: DataViewPageState | undefined, resetKey: string, totalCount: number): DataViewPageState => ({
  page: state?.resetKey === resetKey
    ? Math.max(1, Math.min(state.page, Math.max(1, Math.ceil(totalCount / DATA_VIEW_PAGE_SIZE))))
    : 1,
  resetKey,
})

export const getDataViewPage = <T,>(rows: readonly T[], page: number) =>
  rows.slice((page - 1) * DATA_VIEW_PAGE_SIZE, page * DATA_VIEW_PAGE_SIZE)
