import React from 'react'
import { mockAccounts } from '../mocks/auth'
import type { AuthRole, MockAccount } from '../types/apartment'

export type Role = AuthRole

const defaultAccount = mockAccounts.find((item) => item.id === 'acct-demo') ?? mockAccounts[0]

type RoleContextType = {
  role: Role
  account: MockAccount
  token: string
  isAuthenticated: boolean
  login: (accountId: string, role?: Role) => void
  logout: () => void
  setRole: (r: Role) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const RoleContext = React.createContext<RoleContextType>({
  role: 'Admin',
  account: defaultAccount,
  token: defaultAccount.token,
  isAuthenticated: true,
  login: () => undefined,
  logout: () => undefined,
  setRole: () => undefined,
})

export const RoleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
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
    persistAccount(mockAccounts.find((item) => item.id === accountId) ?? defaultAccount, requestedRole)
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
      value={{ account, isAuthenticated, login, logout, role, setRole, token: isAuthenticated ? account.token : '' }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export default RoleProvider
