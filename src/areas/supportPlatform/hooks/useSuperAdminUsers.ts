import React from 'react'
import { usePageFilter } from '../../../hooks/usePageFilter'
import { RoleContext } from '../../../contexts/RoleContext'
import { usePagedList } from '../../../hooks/usePagedList'
import { superAdminApi, type SuperAdminUserFiltersResponse, type SuperAdminUserResponse } from '../../../services/superAdminApi'

export const useSuperAdminUsers = () => {
  const { account, token } = React.useContext(RoleContext)
  const [search, setSearch] = usePageFilter('users.search', '')
  const [blockId, setBlockId] = usePageFilter('users.block', '')
  const [associatedRole, setAssociatedRole] = usePageFilter('users.role', '')
  const [status, setStatus] = usePageFilter('users.status', '')
  const [profile, setProfile] = usePageFilter('users.profile', '')
  const [retry, setRetry] = React.useState(0)
  const scope = JSON.stringify([account.id, token, retry])
  const [options, setOptions] = React.useState<{ scope: string; data?: SuperAdminUserFiltersResponse; error?: boolean }>()
  React.useEffect(() => {
    const controller = new AbortController()
    void superAdminApi.getUserFilters(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setOptions({ scope, data }) },
      () => { if (!controller.signal.aborted) setOptions({ scope, error: true }) },
    )
    return () => controller.abort()
  }, [scope])
  React.useEffect(() => {
    if (options?.scope !== scope || !options.data) return
    const data = options.data
    const timer = window.setTimeout(() => {
      if (blockId && !data.blocks.some(block => block.blockId === blockId)) setBlockId('')
      if (status && !data.statuses.includes(status)) setStatus('')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [options, scope, blockId, status, setBlockId, setStatus])
  const query = { search, blockId, associatedRole, status, hasResidentProfile: profile === '' ? undefined : profile === 'linked' }
  const page = usePagedList<SuperAdminUserResponse>('SuperAdminUsers', '/super-admin/users/page', query, '')
  const clearFilters = () => { setSearch(''); setBlockId(''); setAssociatedRole(''); setStatus(''); setProfile('') }
  return {
    search, setSearch, blockId, setBlockId, associatedRole, setAssociatedRole, status, setStatus, profile, setProfile,
    page, options: options?.scope === scope ? options.data : undefined,
    optionsError: options?.scope === scope && options.error,
    optionsLoading: options?.scope !== scope,
    hasFilters: Boolean(search.trim() || blockId || associatedRole || status || profile),
    clearFilters, refresh: () => { setRetry((value) => value + 1); page.refresh() },
  }
}
