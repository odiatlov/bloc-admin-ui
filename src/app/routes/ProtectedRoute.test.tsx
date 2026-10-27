import type { ContextType } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import { RoleContext } from '../../contexts/RoleContext'
import type { Permission } from '../../mocks/roles'
import ProtectedRoute from './ProtectedRoute'

type RoleState = ContextType<typeof RoleContext>

function renderRoute(overrides: Partial<RoleState> = {}, permission: Permission = 'blocks') {
  const role = overrides.role ?? 'Admin'
  const account: RoleState['account'] = {
    id: '1b507ebb-329f-434a-b77b-4bd1ee58d134',
    name: 'Test account', email: 'account@example.test',
    systemRole: role === 'SuperAdmin' ? 'SuperAdmin' : 'None',
    blockRoles: role === 'SuperAdmin' ? [] : [role],
    roles: [role], defaultRole: role, token: 'test-token',
  }
  const value: RoleState = {
    account, accounts: [account], role, token: account.token,
    accountsLoading: false, accountsError: null, isAuthenticated: true,
    refreshAccounts: vi.fn(async () => {}), login: vi.fn(), logout: vi.fn(), setRole: vi.fn(),
    ...overrides,
  }
  renderWithProviders(<RoleContext.Provider value={value}>
    <MemoryRouter initialEntries={['/protected']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/protected" element={<ProtectedRoute permission={permission}><h1>Protected content</h1></ProtectedRoute>} />
        <Route path="/login" element={<h1>Login</h1>} />
        <Route path="/admin/dashboard" element={<h1>Admin dashboard</h1>} />
        <Route path="/superadmin/dashboard" element={<h1>Platform dashboard</h1>} />
      </Routes>
    </MemoryRouter>
  </RoleContext.Provider>)
  return value
}

describe('ProtectedRoute', () => {
  it('renders the children when the current role has permission', () => {
    renderRoute()
    expect(screen.getByRole('heading', { name: 'Protected content' })).toBeInTheDocument()
  })

  it('redirects an unauthenticated account to login before showing loading or errors', async () => {
    renderRoute({ isAuthenticated: false, accountsLoading: true, accountsError: 'Unavailable' })
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('shows loading without exposing the protected children', () => {
    renderRoute({ accountsLoading: true })
    expect(screen.getByRole('progressbar')).toHaveAccessibleName()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('shows account-loading errors and retries without exposing the protected children', async () => {
    const user = userEvent.setup()
    const { refreshAccounts } = renderRoute({ accountsError: 'Unavailable' })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refreshAccounts).toHaveBeenCalledOnce()
  })

  it.each(['Resident', 'Censor'] as const)('redirects %s away from block management', async (role) => {
    renderRoute({ role })
    expect(await screen.findByRole('heading', { name: 'Admin dashboard' })).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects SuperAdmin away from block-admin permissions to the platform dashboard', async () => {
    renderRoute({ role: 'SuperAdmin' })
    expect(await screen.findByRole('heading', { name: 'Platform dashboard' })).toBeInTheDocument()
  })

  it('allows SuperAdmin to access its platform area', () => {
    renderRoute({ role: 'SuperAdmin' }, 'superAdmin')
    expect(screen.getByRole('heading', { name: 'Protected content' })).toBeInTheDocument()
  })

  it('does not grant platform permissions to Admin', async () => {
    renderRoute({}, 'superAdmin')
    expect(await screen.findByRole('heading', { name: 'Admin dashboard' })).toBeInTheDocument()
  })
})
