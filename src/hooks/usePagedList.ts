import React from 'react'
import { usePageFilter } from './usePageFilter'
import { RoleContext } from '../contexts/RoleContext'
import { apiGet } from '../services/apiClient'
import { acquirePagedListRequest } from '../services/pagedListRequests'

export type ListQuery = Record<string, string | number | boolean | null | undefined>
export type PagedResponse<T> = { items: T[]; pageNumber: number; pageSize: number; totalCount: number }

export const usePagedList = <T,>(id: string, endpoint: string, query: ListQuery, revision: string) => {
  const { account, role, token } = React.useContext(RoleContext)
  const [localPage, setLocalPage] = usePageFilter(`pagination.server.${id}`, { page: 1, resetKey: '' })
  const [retry, setRetry] = React.useState(0)
  const params = new URLSearchParams()
  Object.entries(query).sort(([left], [right]) => left.localeCompare(right)).forEach(([name, value]) => {
    if (value !== null && value !== undefined && value !== '') params.set(name, String(value))
  })
  params.set('role', role)
  const resetKey = `${endpoint}?${params}:${account.id}`
  const saved = localPage
  const page = saved?.resetKey === resetKey ? saved.page : 1
  params.set('pageNumber', String(page))
  params.set('pageSize', '10')
  const url = `${endpoint}?${params}`
  const key = JSON.stringify([id, url, account.id, token, revision, retry])
  const [result, setResult] = React.useState<{ key: string; resetKey: string; revision: string; data?: PagedResponse<T>; error?: string }>()
  const loading = result?.key !== key
  const data = result?.key === key || (loading && result?.resetKey === resetKey && result.revision === revision) ? result?.data : undefined

  React.useEffect(() => {
    let subscribed = true
    const request = acquirePagedListRequest(key, async (signal) => {
      const next = await apiGet<PagedResponse<T>>(url, signal)
      if (next.pageSize !== 10 || next.items.length > 10 || next.pageNumber < 1 || next.totalCount < 0) {
        throw new Error('Invalid pagination response')
      }
      return next
    })
    void request.promise.then((next) => {
      if (subscribed) setResult({ key, resetKey, revision, data: next })
    }, (error: unknown) => {
      if (subscribed) setResult({ key, resetKey, revision, error: error instanceof Error ? error.message : 'Unable to load list' })
    })
    return () => {
      subscribed = false
      request.release()
    }
  }, [key, url, resetKey, revision])

  React.useEffect(() => {
    if (data && !loading) {
      const next = { page: data.pageNumber, resetKey }
      if (localPage.page !== next.page || localPage.resetKey !== next.resetKey) setLocalPage(next)
    }
  }, [data, resetKey, loading, localPage.page, localPage.resetKey, setLocalPage])

  return {
    data, loading, error: result?.key === key ? result.error : undefined,
    refresh: () => setRetry((value) => value + 1),
    setPage: (next: number) => {
      const state = { page: next, resetKey }
      setLocalPage(state)
    },
  }
}
