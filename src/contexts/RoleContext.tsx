import React from 'react'
import { authApi } from '../services/authApi'
import { ApiError, resetSessionRequests } from '../services/apiClient'
import type { AuthRole, MockAccount } from '../types/apartment'
export type Role = AuthRole
const guest: MockAccount = { id: '', name: '', email: '', systemRole: 'None', blockRoles: [], roles: [], defaultRole: 'None', token: '' }
type RoleContextType = {
  role: Role; account: MockAccount; accounts: MockAccount[]; accountsError: string | null; accountsLoading: boolean
  token: string; isAuthenticated: boolean
  logoutRequested?: boolean
  refreshAccounts: () => Promise<void>; login: (email: string, password: string) => Promise<MockAccount>
  logout: () => Promise<void>; setRole: (role: Role) => void
}
// eslint-disable-next-line react-refresh/only-export-components
export const RoleContext = React.createContext<RoleContextType>({
  role: 'None', account: guest, accounts: [], accountsError: null, accountsLoading: true, token: '', isAuthenticated: false, logoutRequested: false,
  refreshAccounts: async () => {}, login: async () => { throw new Error('Session provider unavailable') }, logout: async () => {}, setRole: () => {},
})
export const RoleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [account, setAccount] = React.useState(guest)
  const [role, setActiveRole] = React.useState<Role>('None')
  const [accountsError, setError] = React.useState<string | null>(null)
  const [accountsLoading, setLoading] = React.useState(true)
  const [logoutRequested, setLogoutRequested] = React.useState(false)
  const [revision, setRevision] = React.useState(0)
  const serial = React.useRef(0)
  const channel = React.useRef<BroadcastChannel | null>(null)
  const accept = React.useCallback((next: MockAccount) => {
    setLogoutRequested(false)
    setAccount(next)
    setActiveRole(previous => next.roles.includes(previous) ? previous : next.defaultRole)
    setError(null)
    setLoading(false)
  }, [])
  const clear = React.useCallback(() => {
    serial.current++
    resetSessionRequests()
    try {
      for (const key of Object.keys(sessionStorage)) if (key.startsWith('["page-filters-v1",')) sessionStorage.removeItem(key)
    } catch { /* Private filters also work without storage. */ }
    setAccount(guest)
    setActiveRole('None')
    setError(null)
    setLoading(false)
    setRevision(value => value + 1)
  }, [])
  const refreshAccounts = React.useCallback(async () => {
    const request = ++serial.current
    setLoading(true)
    setError(null)
    try {
      const next = await authApi.me()
      if (request === serial.current) accept(next)
    } catch (error) {
      if (request !== serial.current) return
      if (error instanceof ApiError && error.status === 401) clear()
      else { setAccount(guest); setError('SESSION_UNAVAILABLE'); setLoading(false) }
    }
  }, [accept, clear])
  React.useEffect(() => {
    // Historical mock selections can never establish a session.
    try { for (const key of ['mockJwt', 'mockAccountId', 'mockActiveRole', 'mockSessionActive']) localStorage.removeItem(key) } catch { /* storage may be disabled */ }
    let active = true
    const requestSerial = serial
    queueMicrotask(() => { if (active) void refreshAccounts() })
    const expired = () => clear()
    const changed = () => { clear(); void refreshAccounts() }
    window.addEventListener('blocadmin:session-expired', expired)
    const onStorage = (event: StorageEvent) => { if (event.key === 'blocadmin:session-change') changed() }
    window.addEventListener('storage', onStorage)
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('blocadmin:session')
      channel.current.onmessage = changed
    }
    return () => {
      active = false
      requestSerial.current++
      window.removeEventListener('blocadmin:session-expired', expired)
      window.removeEventListener('storage', onStorage)
      channel.current?.close()
      channel.current = null
    }
  }, [refreshAccounts, clear])
  const broadcast = () => {
    channel.current?.postMessage('changed')
    try { localStorage.setItem('blocadmin:session-change', String(Date.now()) + Math.random()) } catch { /* BroadcastChannel still works */ }
  }
  const login = async (email: string, password: string) => {
    const request = ++serial.current
    const next = await authApi.login(email, password)
    if (request !== serial.current) throw new DOMException('Session changed', 'AbortError')
    accept(next)
    setRevision(value => value + 1)
    broadcast()
    return next
  }
  const logout = async () => {
    setLogoutRequested(true)
    clear()
    const request = serial.current
    setLoading(true)
    try {
      await authApi.logout()
      if (request !== serial.current) throw new DOMException('Session changed', 'AbortError')
      setLoading(false)
      broadcast()
    } catch (error) {
      if (request === serial.current) { setError('SESSION_UNAVAILABLE'); setLoading(false) }
      throw error
    }
  }
  const setRole = (next: Role) => {
    if (account.roles.includes(next)) { resetSessionRequests(); setActiveRole(next); setRevision(value => value + 1) }
  }
  return <RoleContext.Provider value={{ account, accounts: account.id ? [account] : [], role, token: String(revision),
    accountsError, accountsLoading, logoutRequested, isAuthenticated: !!account.id, refreshAccounts, login, logout, setRole }}>
    <React.Fragment key={revision}>{children}</React.Fragment>
  </RoleContext.Provider>
}
export default RoleProvider
