import { apiGet, apiPost, renewCsrf, resetSessionRequests } from './apiClient'
import type { MockAccount } from '../types/apartment'
type SessionAccount = Omit<MockAccount, 'token'>
export const authApi = {
  me: async () => ({ ...await apiGet<SessionAccount>('/auth/me'), token: '' }),
  login: async (email: string, password: string) => {
    resetSessionRequests()
    await apiPost('/auth/login', { email, password })
    resetSessionRequests()
    await renewCsrf()
    return authApi.me()
  },
  logout: async () => {
    resetSessionRequests()
    await apiPost('/auth/logout', {})
    resetSessionRequests()
    await renewCsrf()
  },
}
