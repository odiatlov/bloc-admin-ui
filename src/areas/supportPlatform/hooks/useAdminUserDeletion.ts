import React from 'react'
import { ApiError } from '../../../services/apiClient'
import { superAdminApi } from '../../../services/superAdminApi'
import type { AdminUserDeletionPreview, AdminUserDeletionResult, DeleteAdminUserRequest } from '../types/adminUserDeletion'

type PendingDeletion = { userId: string; request: DeleteAdminUserRequest; csrf: string }
type Stage = 'loading' | 'ready' | 'error' | 'submitting' | 'unknown' | 'completed'
type State = { stage: Stage; preview?: AdminUserDeletionPreview; error?: string; result?: AdminUserDeletionResult }
const errorCode = (error: unknown) => error instanceof ApiError
  ? error.status === 401 || error.status === 403 ? 'TRUSTED_AUTH_REQUIRED' : error.code ?? 'DELETION_FAILED'
  : 'DELETION_FAILED'

export const useAdminUserDeletion = (userId: string, actorKey: string, onCommitted: () => void) => {
  const storageKey = `admin-user-deletion:${actorKey}:${userId}`
  const [pending, setPending] = React.useState<PendingDeletion | null>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey)
      if (!stored) return null
      const value = JSON.parse(stored) as PendingDeletion
      return value.userId === userId && value.request?.operationId && value.csrf ? value : null
    } catch { return null }
  })
  const [state, setState] = React.useState<State>(() => ({ stage: pending ? 'unknown' : 'loading' }))
  const [email, setEmail] = React.useState('')
  const [acknowledged, setAcknowledged] = React.useState(false)
  const [revision, setRevision] = React.useState(0)
  const [expired, setExpired] = React.useState(false)
  const busy = React.useRef(false)
  const mounted = React.useRef(true)
  const committed = React.useRef(onCommitted)
  React.useEffect(() => { committed.current = onCommitted }, [onCommitted])
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  React.useEffect(() => {
    if (pending || state.stage !== 'loading') return
    const controller = new AbortController()
    void superAdminApi.getDeletionPreview(userId, controller.signal).then(
      (preview) => { if (!controller.signal.aborted) setState({ stage: 'ready', preview }) },
      (error: unknown) => { if (!controller.signal.aborted) setState({ stage: 'error', error: errorCode(error) }) },
    )
    return () => controller.abort()
  }, [userId, revision, pending, state.stage])

  React.useEffect(() => {
    if (!state.preview) return
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, Date.parse(state.preview.expiresAt) - Date.now()))
    return () => window.clearTimeout(timer)
  }, [state.preview])

  const clearPending = () => {
    try { sessionStorage.removeItem(storageKey) } catch { /* Storage may be unavailable. */ }
    setPending(null)
  }
  const complete = (result: AdminUserDeletionResult) => {
    clearPending()
    setState({ stage: 'completed', result })
    committed.current()
  }
  const execute = async (operation: PendingDeletion, recovering: boolean) => {
    if (busy.current) return
    busy.current = true
    setState((previous) => ({ ...previous, stage: 'submitting', error: undefined }))
    try {
      const result = await superAdminApi.deleteUserAndManagedData(operation.userId, operation.request, operation.csrf)
      if (mounted.current) complete(result)
    } catch (error: unknown) {
      if (mounted.current) {
        const knownRejection = error instanceof ApiError && error.status >= 400 && error.status < 500
        if (knownRejection && !recovering) clearPending()
        setState((previous) => ({ ...previous, stage: knownRejection && !recovering ? 'error' : 'unknown', error: errorCode(error) }))
      }
    } finally { busy.current = false }
  }
  const refresh = () => {
    if (pending || busy.current) return
    setEmail(''); setAcknowledged(false); setExpired(false)
    setState({ stage: 'loading' }); setRevision((value) => value + 1)
  }
  const canSubmit = state.stage === 'ready' && !expired && acknowledged
    && email.trim().toLowerCase() === state.preview?.email.toLowerCase()
  const submit = () => {
    if (!canSubmit || !state.preview || busy.current) return
    const operation: PendingDeletion = {
      userId, csrf: state.preview.antiforgeryToken,
      request: { operationId: crypto.randomUUID(), confirmationToken: state.preview.confirmationToken,
        confirmationEmail: email.trim(), acknowledgePermanentDeletion: true, deleteWaterHistory: true },
    }
    // Persist before dispatch so a reload can recover the same operation instead of issuing another.
    try { sessionStorage.setItem(storageKey, JSON.stringify(operation)) }
    catch { setState((previous) => ({ ...previous, stage: 'error', error: 'DELETION_STORAGE_REQUIRED' })); return }
    setPending(operation)
    void execute(operation, false)
  }
  const checkOutcome = async () => {
    if (!pending || busy.current) return
    busy.current = true
    setState((previous) => ({ ...previous, stage: 'submitting' }))
    try {
      const status = await superAdminApi.getDeletionOperation(pending.request.operationId)
      if (mounted.current) {
        if (status.status === 'completed' && status.result) complete(status.result)
        else setState((previous) => ({ ...previous, stage: 'unknown', error: undefined }))
      }
    } catch (error: unknown) {
      if (mounted.current) setState((previous) => ({ ...previous, stage: 'unknown', error: errorCode(error) }))
    } finally { busy.current = false }
  }
  return { ...state, email, setEmail, acknowledged, setAcknowledged, expired, canSubmit, submit, refresh,
    operationId: pending?.request.operationId, checkOutcome,
    retrySameOperation: () => { if (pending) void execute(pending, true) } }
}
