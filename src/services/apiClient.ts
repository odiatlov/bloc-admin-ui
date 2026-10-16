export type ApiResponse<T> = {
  success: boolean
  message: string
  code?: string
  data?: T
}

type ProblemDetails = {
  title?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type ApiRequestOptions = RequestInit & { trustedSession?: boolean }

const apiRequest = async <T>(path: string, options?: ApiRequestOptions): Promise<T> => {
  const { trustedSession, ...init } = options ?? {}
  const token = !trustedSession && typeof window !== 'undefined' ? localStorage.getItem('mockJwt') : null
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    ...(trustedSession ? { credentials: 'same-origin' as const, cache: 'no-store' as const } : {}),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null) as (ApiResponse<T> & ProblemDetails) | null

  if (!response.ok || !payload?.success || payload.data === undefined) {
    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat()[0]
      : undefined
    throw new ApiError(payload?.message || validationMessage || payload?.title || 'Request failed', response.status, payload?.code)
  }

  return payload.data
}

export const apiGet = <T>(path: string, signal?: AbortSignal, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, signal })

export const apiPost = <TRequest, TResponse>(path: string, body: TRequest, options?: ApiRequestOptions) =>
  apiRequest<TResponse>(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  })

export const apiPut = <TRequest, TResponse>(path: string, body: TRequest) =>
  apiRequest<TResponse>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })

export const apiPatch = <TRequest, TResponse>(path: string, body: TRequest) =>
  apiRequest<TResponse>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

export const apiDelete = <TResponse>(path: string) =>
  apiRequest<TResponse>(path, {
    method: 'DELETE',
  })
