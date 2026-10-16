import { ApiError, apiDelete, apiPost } from './apiClient'

let developmentSession = false
let exchange: { token: string; promise: Promise<void> } | null = null
const selectedToken = () => typeof window !== 'undefined' ? localStorage.getItem('mockJwt') : null
const requestOptions = () => {
  const token = selectedToken()
  const headers: Record<string, string> = {}
  if (developmentSession && token) headers.Authorization = `Bearer ${token}`
  return {
    trustedSession: true,
    headers,
  }
}

// The API decides whether development exchange is available. Production returns 404.
export const withPlatformDeletionSession = async <T,>(request: (options: ReturnType<typeof requestOptions>) => Promise<T>): Promise<T> => {
  try { return await request(requestOptions()) }
  catch (error: unknown) {
    const token = selectedToken()
    if (!(error instanceof ApiError) || ![401, 403].includes(error.status) || !token?.startsWith('mock-jwt-superadmin-')) throw error
    if (!exchange || exchange.token !== token) {
      const promise = apiPost<Record<string, never>, { mode: string }>('/development/super-admin-session', {},
        { credentials: 'same-origin', headers: { Authorization: `Bearer ${token}` } }).then((result) => {
        if (result.mode !== 'development') throw new Error('Unexpected development session response')
        developmentSession = true
      })
      exchange = { token, promise }
    }
    const current = exchange
    try { await current.promise }
    catch (exchangeError: unknown) {
      if (exchangeError instanceof ApiError && exchangeError.status === 404) throw error
      throw exchangeError
    }
    finally { if (exchange === current) exchange = null }
    return request(requestOptions())
  }
}

export const endDevelopmentPlatformSession = () => {
  if (!developmentSession) return
  developmentSession = false
  void apiDelete<boolean>('/development/super-admin-session').catch(() => undefined)
}
