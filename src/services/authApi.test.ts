import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost, resetSessionRequests } from './apiClient'
import { authApi } from './authApi'

const response = (data: unknown, status = 200) => new Response(JSON.stringify({ success: status === 200, data }), {
  status, headers: { 'Content-Type': 'application/json' },
})

beforeEach(() => { resetSessionRequests(); vi.useFakeTimers() })
afterEach(() => { resetSessionRequests(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('logout transport', () => {
  it.each(['csrf', 'logout', 'renew'] as const)('bounds a stalled %s request and aborts its transport', async stage => {
    const fetch = vi.fn(() => new Promise<Response>(() => {}))
    if (stage !== 'csrf') fetch.mockResolvedValueOnce(response({ requestToken: 'before-logout' }))
    if (stage === 'renew') fetch.mockResolvedValueOnce(response(true))
    vi.stubGlobal('fetch', fetch)
    const result = authApi.logout().catch(error => error)

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(stage === 'csrf' ? 1 : stage === 'logout' ? 2 : 3))
    await vi.advanceTimersByTimeAsync(10_000)

    expect(await result).toMatchObject({ status: 408, code: 'SESSION_UNAVAILABLE' })
    const lastCall = fetch.mock.calls.at(-1) as unknown as [string, RequestInit]
    expect(lastCall[1].signal?.aborted).toBe(true)
  })

  it('renews anonymous CSRF after confirmed logout and uses it for the next mutation', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response({ requestToken: 'before-logout' }))
      .mockResolvedValueOnce(response(true))
      .mockResolvedValueOnce(response({ requestToken: 'after-logout' }))
      .mockResolvedValueOnce(response(true))
    vi.stubGlobal('fetch', fetch)

    await authApi.logout()
    await apiPost('/next-mutation', {})

    expect(fetch.mock.calls.map(call => call[0])).toEqual([
      '/api/auth/csrf', '/api/auth/logout', '/api/auth/csrf', '/api/next-mutation',
    ])
    expect(fetch.mock.calls[1][1].headers.get('X-CSRF-TOKEN')).toBe('before-logout')
    expect(fetch.mock.calls[3][1].headers.get('X-CSRF-TOKEN')).toBe('after-logout')
  })

  it('does not report success or renew CSRF when server revocation fails', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response({ requestToken: 'before-logout' }))
      .mockResolvedValueOnce(response(null, 500))
    vi.stubGlobal('fetch', fetch)

    await expect(authApi.logout()).rejects.toMatchObject({ status: 500 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('ignores a late logout body without cancelling newer requests after a timeout', async () => {
    let completeLogout!: (value: unknown) => void
    const logoutResponse = response(true)
    vi.spyOn(logoutResponse, 'json').mockImplementation(() => new Promise(resolve => { completeLogout = resolve }))
    let completeNewRequest!: (value: Response) => void
    const fetch = vi.fn()
      .mockResolvedValueOnce(response({ requestToken: 'before-logout' }))
      .mockResolvedValueOnce(logoutResponse)
      .mockImplementationOnce(() => new Promise<Response>(resolve => { completeNewRequest = resolve }))
    vi.stubGlobal('fetch', fetch)
    const logoutResult = authApi.logout().catch(error => error)
    await vi.waitFor(() => expect(completeLogout).toBeTypeOf('function'))
    await vi.advanceTimersByTimeAsync(10_000)
    expect(await logoutResult).toMatchObject({ status: 408 })

    const next = apiGet('/new-session')
    completeLogout({ success: true, data: true })
    completeNewRequest(response({ active: true }))

    await expect(next).resolves.toEqual({ active: true })
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch.mock.calls[2][1].signal.aborted).toBe(false)
  })
})
