import { ApiError, apiGet, apiPost, renewCsrf, resetSessionRequests } from './apiClient'
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
    const controller = new AbortController()
    let expired = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const endSession = async () => {
      await apiPost('/auth/logout', {}, { signal: controller.signal })
      if (expired) return
      resetSessionRequests()
      await renewCsrf(controller.signal)
    }
    try {
      await Promise.race([
        endSession(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            expired = true
            controller.abort()
            reject(new ApiError('Unable to confirm sign-out', 408, 'SESSION_UNAVAILABLE'))
          }, 10_000)
        }),
      ])
    } finally {
      clearTimeout(timer)
    }
  },
}
