import { StrictMode, type ContextType } from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../tests/render'
import { RoleContext } from '../../../contexts/RoleContext'
import * as apiClient from '../../../services/apiClient'
import { superAdminApi, type SuperAdminUserFiltersResponse } from '../../../services/superAdminApi'
import { useSuperAdminUsers } from './useSuperAdminUsers'

const filters: SuperAdminUserFiltersResponse = { blocks: [], statuses: ['Active'] }
const account: ContextType<typeof RoleContext>['account'] = {
  id: '608044c0-6d18-47e8-86da-8a05692a630d', name: 'Platform operator', email: 'operator@example.test',
  systemRole: 'SuperAdmin', roles: ['SuperAdmin'], blockRoles: [], defaultRole: 'SuperAdmin', token: '',
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

function Probe() {
  const users = useSuperAdminUsers()
  return <output aria-label="Filter state">{users.optionsLoading ? 'loading'
    : users.optionsError ? 'error' : users.options?.statuses.join(', ')}</output>
}

function tree(token = 'platform-session') {
  const state: ContextType<typeof RoleContext> = {
    account, accounts: [account], role: 'SuperAdmin', token,
    isAuthenticated: true, accountsLoading: false, accountsError: null,
    refreshAccounts: vi.fn(), login: vi.fn(), logout: vi.fn(), setRole: vi.fn(),
  }
  return <StrictMode>
    <MemoryRouter initialEntries={['/superadmin/users']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RoleContext.Provider value={state}><Probe /></RoleContext.Provider>
    </MemoryRouter>
  </StrictMode>
}

beforeEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  vi.spyOn(apiClient, 'apiGet').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 10, totalCount: 0 })
})

describe('Platform Users filter requests', () => {
  it('keeps one active filter request when StrictMode replays the mount effects', async () => {
    const pending = deferred<SuperAdminUserFiltersResponse>()
    const load = vi.spyOn(superAdminApi, 'getUserFilters').mockReturnValue(pending.promise)
    renderWithProviders(tree(), { reactStrictMode: true })

    await waitFor(() => expect(load).toHaveBeenCalledOnce())
    expect(load.mock.calls[0][0]?.aborted).toBe(false)
    await act(async () => pending.resolve(filters))
    expect(screen.getByLabelText('Filter state')).toHaveTextContent('Active')
  })

  it('still cancels the request when the page actually unmounts', async () => {
    const pending = deferred<SuperAdminUserFiltersResponse>()
    const load = vi.spyOn(superAdminApi, 'getUserFilters').mockReturnValue(pending.promise)
    const view = renderWithProviders(tree(), { reactStrictMode: true })
    await waitFor(() => expect(load).toHaveBeenCalled())
    const signal = load.mock.calls.at(-1)?.[0]

    await act(async () => { view.unmount(); await Promise.resolve() })

    expect(signal?.aborted).toBe(true)
    await act(async () => pending.resolve(filters))
  })

  it('discards filters from an earlier session and loads the current session', async () => {
    const oldRequest = deferred<SuperAdminUserFiltersResponse>()
    const newRequest = deferred<SuperAdminUserFiltersResponse>()
    const load = vi.spyOn(superAdminApi, 'getUserFilters')
      .mockReturnValueOnce(oldRequest.promise).mockReturnValue(newRequest.promise)
    const view = renderWithProviders(tree('old-session'), { reactStrictMode: true })
    await waitFor(() => expect(load).toHaveBeenCalledOnce())

    view.rerender(tree('new-session'))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    expect(load.mock.calls[0][0]?.aborted).toBe(true)
    expect(load.mock.calls[1][0]?.aborted).toBe(false)
    await act(async () => oldRequest.resolve({ blocks: [], statuses: ['Old session'] }))
    expect(screen.getByLabelText('Filter state')).not.toHaveTextContent('Old session')
    await act(async () => newRequest.resolve(filters))
    expect(screen.getByLabelText('Filter state')).toHaveTextContent('Active')
  })
})
