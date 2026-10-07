import React from 'react'
import type { DataViewPageState } from '../../utils/dataViewPagination'

type PaginationStore = {
  pages: ReadonlyMap<string, DataViewPageState>
  rememberPage: (id: string, state: DataViewPageState) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const DataViewPaginationContext = React.createContext<PaginationStore | null>(null)

const DataViewPaginationProvider = ({ children }: React.PropsWithChildren) => {
  const [pages, setPages] = React.useState<ReadonlyMap<string, DataViewPageState>>(() => new Map())
  const rememberPage = React.useCallback((id: string, state: DataViewPageState) => {
    setPages((previous) => {
      const saved = previous.get(id)
      if (saved?.page === state.page && saved.resetKey === state.resetKey) return previous
      return new Map(previous).set(id, state)
    })
  }, [])
  const value = React.useMemo(() => ({ pages, rememberPage }), [pages, rememberPage])
  return <DataViewPaginationContext.Provider value={value}>{children}</DataViewPaginationContext.Provider>
}

export default DataViewPaginationProvider
