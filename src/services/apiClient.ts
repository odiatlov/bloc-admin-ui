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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null) as (ApiResponse<T> & ProblemDetails) | null

  if (!response.ok || !payload?.success || payload.data === undefined) {
    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat()[0]
      : undefined
    throw new Error(payload?.message || validationMessage || payload?.title || 'Request failed')
  }

  return payload.data
}

export const apiGet = <T>(path: string) => apiRequest<T>(path)

export const apiPost = <TRequest, TResponse>(path: string, body: TRequest) =>
  apiRequest<TResponse>(path, {
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
