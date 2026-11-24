export type ApiResponse<T> = { success: boolean; message: string; code?: string; data?: T }
type ProblemDetails = { title?: string; errors?: Record<string, string[]> }
export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) { super(message); this.status = status; this.code = code }
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
// Browser sessions deliberately require the same-origin reverse proxy.
if (!API_BASE_URL.startsWith('/') || API_BASE_URL.startsWith('//')) throw new Error('Use a same-origin API URL')
type ApiRequestOptions = RequestInit & { trustedSession?: boolean }
let epoch = 0
let csrf: { epoch: number; promise: Promise<string> } | undefined
const pending = new Set<AbortController>()
export const resetSessionRequests = () => {
  epoch++
  csrf = undefined
  pending.forEach(controller => controller.abort())
  pending.clear()
}
const assertEpoch = (value: number) => {
  if (value !== epoch) throw new DOMException('Session changed', 'AbortError')
}
const transport = async (path: string, options: RequestInit, version: number) => {
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) controller.abort()
  pending.add(controller)
  try {
    const response = await fetch(API_BASE_URL + path, { ...options, credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
    assertEpoch(version)
    return response
  } finally {
    pending.delete(controller)
    options.signal?.removeEventListener('abort', abort)
  }
}
const csrfToken = async (signal?: AbortSignal | null): Promise<string> => {
  if (!csrf || csrf.epoch !== epoch) {
    const version = epoch
    const promise = transport('/auth/csrf', { signal }, version).then(async response => {
      const payload = await response.json() as ApiResponse<{ requestToken: string }>
      assertEpoch(version)
      if (!response.ok || !payload.success || !payload.data?.requestToken) throw new ApiError('Unable to verify session', response.status)
      return payload.data.requestToken
    })
    csrf = { epoch: version, promise }
    void promise.catch(() => { if (csrf?.promise === promise) csrf = undefined })
  }
  return csrf.promise
}
export const renewCsrf = async (signal?: AbortSignal) => { csrf = undefined; await csrfToken(signal) }
const checkUnauthorized = (response: Response, path: string) => {
  if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('blocadmin:session-expired'))
}
const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const version = epoch
  const { trustedSession: _trustedSession, ...init } = options
  void _trustedSession
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes((init.method ?? 'GET').toUpperCase())) headers.set('X-CSRF-TOKEN', await csrfToken(init.signal))
  assertEpoch(version)
  if (init.signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
  const response = await transport(path, { ...init, headers }, version)
  const payload = await response.json().catch(() => null) as (ApiResponse<T> & ProblemDetails) | null
  assertEpoch(version)
  checkUnauthorized(response, path)
  if (!response.ok || !payload?.success || payload.data === undefined) {
    if (payload?.code === 'CSRF_INVALID') csrf = undefined
    throw new ApiError(payload?.message || (payload?.errors ? Object.values(payload.errors).flat()[0] : undefined) || payload?.title || 'Request failed', response.status, payload?.code)
  }
  return payload.data
}
export const apiGet = <T>(path: string, signal?: AbortSignal, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, signal })
export const apiPost = <TRequest, TResponse>(path: string, body: TRequest, options?: ApiRequestOptions) => apiRequest<TResponse>(path, { ...options, method: 'POST', body: JSON.stringify(body) })
export const apiPut = <TRequest, TResponse>(path: string, body: TRequest) => apiRequest<TResponse>(path, { method: 'PUT', body: JSON.stringify(body) })
export const apiPatch = <TRequest, TResponse>(path: string, body: TRequest) => apiRequest<TResponse>(path, { method: 'PATCH', body: JSON.stringify(body) })
export const apiDelete = <TResponse>(path: string) => apiRequest<TResponse>(path, { method: 'DELETE' })
export const apiDownload = async (path: string) => {
  const version = epoch
  const response = await transport(path, {}, version)
  checkUnauthorized(response, path)
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    const payload = await response.json().catch(() => null)
    assertEpoch(version)
    throw new ApiError(payload?.message ?? 'Excel export failed', response.status)
  }
  const blob = await response.blob()
  assertEpoch(version)
  return { blob, disposition: response.headers.get('Content-Disposition') ?? '' }
}
