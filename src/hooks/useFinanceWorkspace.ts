import React from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { financeApi } from '../services/financeApi'
import type { FinanceBlock, FinanceWorkspace } from '../types/finance'

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
