import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost, resetSessionRequests, ApiError } from './apiClient'
const response = (data: unknown, status = 200) => new Response(JSON.stringify({ success: status === 200, data }), { status, headers: { 'Content-Type': 'application/json' } })
beforeEach(() => resetSessionRequests())
afterEach(() => { vi.unstubAllGlobals(); resetSessionRequests(); localStorage.removeItem('mockJwt') })
describe('cookie API transport', () => {
  it('obtains CSRF before a mutation and never sends a stored mock bearer', async () => {
    localStorage.setItem('mockJwt', 'forged')
    const fetch = vi.fn().mockResolvedValueOnce(response({ requestToken: 'request-token' })).mockResolvedValueOnce(response(true))
    vi.stubGlobal('fetch', fetch)
    await apiPost('/test', { value: 1 })
    expect(fetch.mock.calls[0][0]).toBe('/api/auth/csrf')
    const options = fetch.mock.calls[1][1]
    expect(options.credentials).toBe('same-origin')
    expect(options.cache).toBe('no-store')
    expect(options.headers.get('X-CSRF-TOKEN')).toBe('request-token')
    expect(options.headers.has('Authorization')).toBe(false)
  })
  it('discards a late response after the session boundary changes', async () => {
    let resolve!: (value: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(done => { resolve = done })))
    const request = apiGet('/private')
    resetSessionRequests()
    resolve(response({ secret: 'old actor' }))
    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })
  it('does not sign out a valid session on 403', async () => {
    const listener = vi.fn()
    window.addEventListener('blocadmin:session-expired', listener)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(null, 403)))
    await expect(apiGet('/private')).rejects.toBeInstanceOf(ApiError)
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener('blocadmin:session-expired', listener)
  })
  it('notifies the provider when a protected request returns 401', async () => {
    const listener = vi.fn()
    window.addEventListener('blocadmin:session-expired', listener)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(null, 401)))
    await expect(apiGet('/private')).rejects.toMatchObject({ status: 401 })
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('blocadmin:session-expired', listener)
  })
})
