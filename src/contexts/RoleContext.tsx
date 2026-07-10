import React from 'react'
import { mockAccounts } from '../mocks/auth'
import { mockLoginApi } from '../services/mockLoginApi'
import type { AuthRole, MockAccount } from '../types/apartment'

export type Role = AuthRole

const fallbackAccount = mockAccounts[0]
const getDefaultAccount = (accounts: MockAccount[]) =>
  accounts.find((item) => item.systemRole !== 'SuperAdmin') ?? accounts[0] ?? fallbackAccount

type RoleContextType = {
  role: Role
  account: MockAccount
  accounts: MockAccount[]
  accountsError: string | null
  accountsLoading: boolean
  token: string
  isAuthenticated: boolean
  refreshAccounts: () => Promise<void>
  login: (accountId: string, role?: Role) => void
  logout: () => void
  setRole: (r: Role) => void
}

const defaultAccount = getDefaultAccount(mockAccounts)

// eslint-disable-next-line react-refresh/only-export-components
export const RoleContext = React.createContext<RoleContextType>({
  role: 'Admin',
  account: defaultAccount,
  accounts: mockAccounts,
  accountsError: null,
  accountsLoading: false,
  token: defaultAccount.token,
  isAuthenticated: true,
  refreshAccounts: async () => undefined,
  login: () => undefined,
  logout: () => undefined,
  setRole: () => undefined,
})

export const RoleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [accounts, setAccounts] = React.useState<MockAccount[]>(mockAccounts)
  const [accountsError, setAccountsError] = React.useState<string | null>(null)
  const [accountsLoading, setAccountsLoading] = React.useState(true)
  const [account, setAccount] = React.useState<MockAccount>(() => {
    const savedAccountId = typeof window !== 'undefined' ? localStorage.getItem('mockAccountId') : null
    return mockAccounts.find((item) => item.id === savedAccountId) ?? defaultAccount
  })
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('mockSessionActive') !== 'false'
  })
  const [role, setActiveRole] = React.useState<Role>(() => {
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('mockActiveRole') : null
    return account.roles.includes(savedRole as Role) ? savedRole as Role : account.defaultRole
  })

  const refreshAccounts = React.useCallback(async () => {
    setAccountsLoading(true)
    setAccountsError(null)

    try {
      const nextAccounts = await mockLoginApi.getAccounts()
      if (nextAccounts.length === 0) {
        setAccounts(mockAccounts)
        setAccountsError('No database accounts are available yet.')
        return
      }

      setAccounts(nextAccounts)
      const savedAccountId = typeof window !== 'undefined' ? localStorage.getItem('mockAccountId') : null
      const nextAccount = nextAccounts.find((item) => item.id === savedAccountId)
        ?? nextAccounts.find((item) => item.id === account.id)
        ?? getDefaultAccount(nextAccounts)

      const savedRole = typeof window !== 'undefined' ? localStorage.getItem('mockActiveRole') : null
      const nextRole = nextAccount.roles.includes(savedRole as Role) ? savedRole as Role : nextAccount.defaultRole
      setAccount(nextAccount)
      setActiveRole(nextRole)
    } catch (nextError) {
      setAccounts(mockAccounts)
      setAccountsError(nextError instanceof Error ? nextError.message : 'Unable to load database accounts.')
    } finally {
      setAccountsLoading(false)
    }
  }, [account.id])

  React.useEffect(() => {
    void refreshAccounts()
  }, [refreshAccounts])

  const persistAccount = (nextAccount: MockAccount, requestedRole?: Role) => {
    const nextRole = requestedRole && nextAccount.roles.includes(requestedRole) ? requestedRole : nextAccount.defaultRole
    setAccount(nextAccount)
    setActiveRole(nextRole)
    setIsAuthenticated(true)
    try {
      localStorage.setItem('mockAccountId', nextAccount.id)
      localStorage.setItem('mockActiveRole', nextRole)
      localStorage.setItem('mockSessionActive', 'true')
      localStorage.setItem('mockJwt', nextAccount.token)
    } catch {
      // ignore mock persistence failures
    }
  }

  const login = (accountId: string, requestedRole?: Role) => {
    persistAccount(accounts.find((item) => item.id === accountId) ?? getDefaultAccount(accounts), requestedRole)
  }

  const logout = () => {
    setIsAuthenticated(false)
    try {
      localStorage.setItem('mockSessionActive', 'false')
      localStorage.removeItem('mockJwt')
    } catch {
      // ignore
    }
  }

  const setRole = (nextRole: Role) => {
    if (!account.roles.includes(nextRole)) return
    persistAccount(account, nextRole)
  }

  return (
    <RoleContext.Provider
      value={{ account, accounts, accountsError, accountsLoading, isAuthenticated, login, logout, refreshAccounts, role, setRole, token: isAuthenticated ? account.token : '' }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export default RoleProvider
