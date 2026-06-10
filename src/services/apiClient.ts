export type ApiResponse<T> = {
  success: boolean
  message: string
  code?: string
  data?: T
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5153/api'

export const apiGet = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`)
  const payload = await response.json().catch(() => null) as ApiResponse<T> | null

  if (!response.ok || !payload?.success || payload.data === undefined) {
    throw new Error(payload?.message || 'Request failed')
  }

  return payload.data
}
