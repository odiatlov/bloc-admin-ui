import { useCallback, useContext, useEffect, useState } from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { residentFinanceApi } from '../services/residentFinanceApi'
import { useFinanceIdentity } from './useFinanceWorkspace'

function useResidentFinanceRequest<T>(scope: string, load: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const identity = useFinanceIdentity()
  const { role } = useContext(RoleContext)
  const active = enabled && role === 'Resident'
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>()
  const key = `${identity}:${scope}:${revision}`
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    if (!active) return
    const abort = new AbortController()
    load(abort.signal).then(data => { if (!abort.signal.aborted) setState({ key, data }) })
      .catch((error: unknown) => { if (!abort.signal.aborted) setState({ key, error: error instanceof Error ? error.message : 'Request failed' }) })
    return () => abort.abort()
  }, [active, key, load])
  useEffect(() => {
    if (!active) return
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [active, refresh])
  const current = active && state?.key === key ? state : undefined
  return { data: current?.data, error: current?.error, loading: active && !current, refresh }
}

export const useResidentFinanceSummary = () => useResidentFinanceRequest('summary', residentFinanceApi.summary)
export const useResidentBills = (page: number) => {
  const load = useCallback((signal: AbortSignal) => residentFinanceApi.bills(page, signal), [page])
  return useResidentFinanceRequest(`bills:${page}`, load)
}
export const useResidentBill = (id: string | null) => {
  const load = useCallback((signal: AbortSignal) => residentFinanceApi.bill(id!, signal), [id])
  return useResidentFinanceRequest(`bill:${id}`, load, !!id)
}
