import React from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../tests/render'
import { authApi } from '../services/authApi'
import { ApiError } from '../services/apiClient'
import { RoleContext, RoleProvider } from './RoleContext'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../app/routes/ProtectedRoute'
import LogoutConfirmButton from '../components/shared/LogoutConfirmButton'
import Login from '../pages/Login/Login'
vi.mock('../services/authApi', () => ({ authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() } }))
const account = { id: 'user-9ebd9e07-f672-4a1e-bd5a-227cb040cb3c', name: 'Pilot', email: 'pilot@example.test', systemRole: 'None' as const, roles: [], blockRoles: [], defaultRole: 'None' as const, token: '' }
function Probe() {
  const state = React.useContext(RoleContext)
  return <><div data-testid="session">{state.accountsLoading ? 'checking' : state.accountsError ? 'unavailable' : state.isAuthenticated ? state.account.name : 'signed out'}</div>
    <button onClick={() => { void state.logout().catch(() => {}) }}>Log out</button></>
}
const render = () => renderWithProviders(<RoleProvider><Probe /></RoleProvider>)
const renderLogoutFlow = () => renderWithProviders(
  <MemoryRouter initialEntries={['/admin/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <RoleProvider><Routes>
      <Route path="/admin/dashboard" element={<section aria-label="Private shell">
        <LogoutConfirmButton />
        <ProtectedRoute permission="dashboard"><h1>Private dashboard</h1></ProtectedRoute>
      </section>} />
      <Route path="/login" element={<Login />} />
    </Routes></RoleProvider>
  </MemoryRouter>,
)
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
  it('leaves the private shell immediately while logout is pending, then shows the login form', async () => {
    let finishLogout!: () => void
    vi.mocked(authApi.me).mockResolvedValue(account)
    vi.mocked(authApi.logout).mockImplementation(() => new Promise(resolve => { finishLogout = resolve }))
    renderLogoutFlow()
    await screen.findByRole('heading', { name: 'Private dashboard' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^Logout$/ }))
    await user.click(screen.getByRole('button', { name: 'Yes, log out' }))

    expect(await screen.findByText('Ending your session…')).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Private shell' })).not.toBeInTheDocument()
    await act(async () => finishLogout())
    expect(await screen.findByLabelText(/^Password/)).toBeVisible()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
  it('keeps a failed logout on the login page and retries revocation instead of restoring the old session', async () => {
    vi.mocked(authApi.me).mockResolvedValue(account)
    vi.mocked(authApi.logout).mockRejectedValueOnce(new ApiError('Timeout', 408)).mockResolvedValueOnce()
    renderLogoutFlow()
    await screen.findByRole('heading', { name: 'Private dashboard' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^Logout$/ }))
    await user.click(screen.getByRole('button', { name: 'Yes, log out' }))

    expect(await screen.findByText('We could not confirm that your session ended. Please retry logging out.')).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Private shell' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByLabelText(/^Password/)).toBeVisible()
    expect(authApi.logout).toHaveBeenCalledTimes(2)
    expect(authApi.me).toHaveBeenCalledOnce()
  })
  it('does not overwrite a newer server-confirmed session with a late logout failure', async () => {
    let failLogout!: (error: Error) => void
    vi.mocked(authApi.me).mockResolvedValueOnce(account).mockResolvedValueOnce({
      ...account, id: 'user-0b94fe4f-9151-4202-b120-58e9d4a27bb0', name: 'New account',
    })
    vi.mocked(authApi.logout).mockImplementation(() => new Promise((_, reject) => { failLogout = reject }))
    render()
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('Pilot'))
    await userEvent.setup().click(screen.getByRole('button', { name: 'Log out' }))
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'blocadmin:session-change', newValue: 'new-session' }))
    })
    await waitFor(() => expect(authApi.me).toHaveBeenCalledTimes(2))
    await act(async () => failLogout(new Error('Old logout failed')))
    expect(screen.getByTestId('session')).toHaveTextContent('New account')
  })
})
