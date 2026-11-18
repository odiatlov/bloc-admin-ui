import React from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../tests/render'
import { authApi } from '../services/authApi'
import { ApiError } from '../services/apiClient'
import { RoleContext, RoleProvider } from './RoleContext'
vi.mock('../services/authApi', () => ({ authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() } }))
const account = { id: 'user-9ebd9e07-f672-4a1e-bd5a-227cb040cb3c', name: 'Pilot', email: 'pilot@example.test', systemRole: 'None' as const, roles: [], blockRoles: [], defaultRole: 'None' as const, token: '' }
function Probe() {
  const state = React.useContext(RoleContext)
  return <><div data-testid="session">{state.accountsLoading ? 'checking' : state.accountsError ? 'unavailable' : state.isAuthenticated ? state.account.name : 'signed out'}</div>
    <button onClick={() => { void state.logout() }}>Log out</button></>
}
const render = () => renderWithProviders(<RoleProvider><Probe /></RoleProvider>)
beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); vi.mocked(authApi.logout).mockResolvedValue() })
describe('session restoration', () => {
  it('does not authenticate from saved account selections and waits for me', async () => {
    localStorage.setItem('mockJwt', 'forged')
    let resolve!: (value: typeof account) => void
    vi.mocked(authApi.me).mockImplementation(() => new Promise(done => { resolve = done }))
    render()
    expect(screen.getByTestId('session')).toHaveTextContent('checking')
    expect(localStorage.getItem('mockJwt')).toBeNull()
    await waitFor(() => expect(authApi.me).toHaveBeenCalledOnce())
    await act(async () => resolve(account))
    expect(await screen.findByTestId('session')).toHaveTextContent('Pilot')
  })
  it('distinguishes an absent session from an infrastructure failure', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError('offline', 500))
    render()
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('unavailable'))
  })
  it('rejects a late startup response after logout', async () => {
    let resolve!: (value: typeof account) => void
    vi.mocked(authApi.me).mockImplementation(() => new Promise(done => { resolve = done }))
    render()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Log out' }))
    await act(async () => resolve(account))
    expect(screen.getByTestId('session')).toHaveTextContent('signed out')
  })
  it('rechecks the server when another tab announces an authentication change', async () => {
    vi.mocked(authApi.me).mockResolvedValueOnce(account).mockRejectedValueOnce(new ApiError('expired', 401))
    render()
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('Pilot'))
    await act(async () => { window.dispatchEvent(new StorageEvent('storage', { key: 'blocadmin:session-change', newValue: 'changed' })) })
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('signed out'))
    expect(authApi.me).toHaveBeenCalledTimes(2)
  })
})
