import React from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { financeApi } from '../services/financeApi'
import { waterReadingsApi } from '../services/waterReadingsApi'
import type { FinanceBlock, FinanceWorkspace } from '../types/finance'
import { getCurrentReadingPeriod, getReadingBaselinePeriod } from '../utils/readingPeriods'

export const useFinanceIdentity = () => {
  const { account, role, token } = React.useContext(RoleContext)
  return `${account.id}:${role}:${token}`
}

export const useFinanceActionScope = () => {
  const active = React.useRef(false)
  React.useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  return active
}

export const useFinanceBlocks = () => {
  const identity = useFinanceIdentity()
  const { role } = React.useContext(RoleContext)
  const [retry, setRetry] = React.useState(0)
  const [state, setState] = React.useState<{ key: string; blocks: FinanceBlock[]; error: string | null }>()
  const key = `${identity}:${retry}`
  React.useEffect(() => {
    if (role !== 'Admin') return
    const abort = new AbortController()
    financeApi.blocks(abort.signal).then((blocks) => { if (!abort.signal.aborted) setState({ key, blocks, error: null }) }).catch((error) => {
      if (!abort.signal.aborted) setState({ key, blocks: [], error: error.message })
    })
    return () => abort.abort()
  }, [key, role])
  return { blocks: state?.key === key ? state.blocks : [], loading: role === 'Admin' && state?.key !== key, error: state?.key === key ? state.error : null, refresh: () => setRetry((value) => value + 1) }
}

export const useFinanceWorkspace = (blockId: string, period: string) => {
  const identity = useFinanceIdentity()
  const [retry, setRetry] = React.useState(0)
  const [state, setState] = React.useState<{ key: string; data: FinanceWorkspace | null; error: string | null }>()
  const key = `${identity}:${blockId}:${period}:${retry}`
  const [year, month] = period.split('-').map(Number)
  React.useEffect(() => {
    if (!blockId || !year || !month) return
    const abort = new AbortController()
    financeApi.workspace(blockId, year, month, abort.signal).then((data) => {
      if (!abort.signal.aborted) setState({ key, data, error: null })
    }).catch((error) => {
      if (!abort.signal.aborted) setState({ key, data: null, error: error.message })
    })
    return () => abort.abort()
  }, [blockId, key, month, year])
  return { data: state?.key === key ? state.data : null, loading: !!blockId && state?.key !== key, error: state?.key === key ? state.error : null, refresh: React.useCallback(() => setRetry((value) => value + 1), []) }
}

export const useFinancePeriodBounds = (blockId: string) => {
  const identity = useFinanceIdentity()
  const maximumPeriod = getCurrentReadingPeriod()
  const [retry, setRetry] = React.useState(0)
  const [state, setState] = React.useState<{ key: string; minimumPeriod: string | null; error: string | null }>()
  const key = `${identity}:${blockId}:${retry}`
  React.useEffect(() => {
    if (!blockId) return
    let active = true
    waterReadingsApi.getBlockSettings(blockId).then((settings) => {
      const firstSubmission = settings.firstSubmissionDate ? Number(settings.firstSubmissionDate.slice(0, 7).replace('-', '')) : null
      if (active) setState({ key, minimumPeriod: getReadingBaselinePeriod(firstSubmission), error: null })
    }).catch((error) => {
      if (active) setState({ key, minimumPeriod: null, error: error.message })
    })
    return () => { active = false }
  }, [blockId, key])
  const current = state?.key === key ? state : undefined
  return {
    minimumPeriod: current?.minimumPeriod ?? maximumPeriod,
    maximumPeriod,
    loading: !!blockId && !current,
    error: current?.error ?? null,
    refresh: React.useCallback(() => setRetry((value) => value + 1), []),
  }
}
