import React from 'react'
import { RoleContext } from '../../../contexts/RoleContext'
import { usePagedList } from '../../../hooks/usePagedList'
import { superAdminApi, type SuperAdminUserFiltersResponse, type SuperAdminUserResponse } from '../../../services/superAdminApi'

export const useSuperAdminUsers = () => {
  const { account, token } = React.useContext(RoleContext)
  const [search, setSearch] = React.useState('')
  const [blockId, setBlockId] = React.useState('')
  const [associatedRole, setAssociatedRole] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [profile, setProfile] = React.useState('')
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
