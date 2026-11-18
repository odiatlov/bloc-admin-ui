import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import { RoleContext } from '../../contexts/RoleContext'
import Login from './Login'
import type { ContextType } from 'react'
function setup() {
  const account: ContextType<typeof RoleContext>['account'] = { id: '', name: '', email: '', roles: [], blockRoles: [], systemRole: 'None', defaultRole: 'None', token: '' }
  const login = vi.fn().mockRejectedValue(new Error('failed'))
  renderWithProviders(<RoleContext.Provider value={{ account, accounts: [], role: 'None', token: '', isAuthenticated: false,
    accountsLoading: false, accountsError: null, refreshAccounts: vi.fn(), login, logout: vi.fn(), setRole: vi.fn() }}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Login /></MemoryRouter>
  </RoleContext.Provider>)
  return login
}
describe('Login', () => {
  it('preserves password whitespace and case and clears the password after failure', async () => {
    const login = setup()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'pilot@example.test')
    const password = screen.getByLabelText(/^Password/)
    await user.type(password, '  A unique passphrase  ')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(login).toHaveBeenCalledWith('pilot@example.test', '  A unique passphrase  ')
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed')
    expect(password).toHaveValue('')
  })
})
