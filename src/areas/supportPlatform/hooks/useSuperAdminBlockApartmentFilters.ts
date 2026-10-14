import React from 'react'
import { RoleContext } from '../../../contexts/RoleContext'
import { ApiError } from '../../../services/apiClient'
import { superAdminApi, type SuperAdminBlockApartmentFiltersResponse } from '../../../services/superAdminApi'

export const useSuperAdminBlockApartmentFilters = (blockId: string) => {
  const { account, token } = React.useContext(RoleContext)
  const [retry, setRetry] = React.useState(0)
  const scope = JSON.stringify([blockId, account.id, token, retry])
  const [result, setResult] = React.useState<{
    scope: string
    data?: SuperAdminBlockApartmentFiltersResponse
    error?: boolean
    notFound?: boolean
  }>()

  React.useEffect(() => {
    const controller = new AbortController()
    void superAdminApi.getBlockApartmentFilters(blockId, controller.signal).then(
      (data) => { if (!controller.signal.aborted) setResult({ scope, data }) },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ scope, error: true, notFound: error instanceof ApiError && error.status === 404 })
      },
    )
    return () => controller.abort()
  }, [blockId, scope])

  const current = result?.scope === scope ? result : undefined
  return {
    data: current?.data,
    loading: !current,
    error: current?.error,
    notFound: current?.notFound,
    refresh: () => setRetry((value) => value + 1),
  }
}
