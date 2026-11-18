import React from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import { residentContext } from '../../../tests/financeFixtures'
import { RoleContext } from '../../contexts/RoleContext'
import { notificationsApi } from '../../services/notificationsApi'
import type { NotificationResponse } from '../../types/notifications'
import NotificationsButton from './NotificationsButton'
import NotificationsProvider from './NotificationsProvider'
import { useNotifications } from './useNotifications'

vi.mock('../../services/notificationsApi', () => ({ notificationsApi: {
  getAll: vi.fn(), getUnreadCount: vi.fn(), markAsRead: vi.fn(), markAllAsRead: vi.fn(),
} }))

const notification: NotificationResponse = {
  id: 'd2354c8f-b70c-4ad8-87b6-58286fb2a7eb', recipientType: 'User', type: 'TestNotification', severity: 'info',
  title: 'Account notification', message: 'An event for this account.', isRead: false, createdAt: '2026-11-18T10:00:00Z',
}
type RoleState = React.ContextType<typeof RoleContext>
const platformContext: RoleState = {
  ...residentContext, role: 'SuperAdmin', token: 'platform-session',
  account: { ...residentContext.account, id: 'superadmin-91bc64d3-92f3-4790-b52a-90b00b7b6282',
    systemRole: 'SuperAdmin', roles: ['SuperAdmin'], blockRoles: [], defaultRole: 'SuperAdmin' },
}
function Count() {
  return <output data-testid="unread-count">{useNotifications().unreadCount}</output>
}
function tree(context: RoleState) {
  return <React.StrictMode><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <RoleContext.Provider value={context}><NotificationsProvider>
      <NotificationsButton /><NotificationsButton /><Count />
    </NotificationsProvider></RoleContext.Provider>
  </MemoryRouter></React.StrictMode>
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
async function refreshEvents() {
  await act(async () => {
    window.dispatchEvent(new Event('focus'))
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('finance-review-changed'))
  })
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.mocked(notificationsApi.getAll).mockResolvedValue([notification])
  vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue(1)
  vi.mocked(notificationsApi.markAsRead).mockResolvedValue(notification.id)
  vi.mocked(notificationsApi.markAllAsRead).mockResolvedValue(true)
})
afterEach(() => vi.restoreAllMocks())

describe('shared notification scope', () => {
  it.each(['en', 'ro'] as const)('keeps the platform UI without regular-user requests in %s', async language => {
    const user = userEvent.setup()
    renderWithProviders(tree(platformContext), { language })
    const label = language === 'en' ? 'Notifications' : 'Notificări'
    await user.click(screen.getAllByRole('button', { name: new RegExp(label) })[0])
    expect(await screen.findByText(language === 'en'
      ? 'Platform notifications will be available here.' : 'Notificările platformei vor fi disponibile aici.')).toBeVisible()
    expect(screen.getByRole('button', { name: language === 'en' ? 'Mark all read' : 'Marchează toate ca citite' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: language === 'en' ? 'Refresh' : 'Reîmprospătează' })).not.toBeInTheDocument()
    await refreshEvents()
    expect(notificationsApi.getAll).not.toHaveBeenCalled()
    expect(notificationsApi.getUnreadCount).not.toHaveBeenCalled()
    expect(notificationsApi.markAsRead).not.toHaveBeenCalled()
    expect(notificationsApi.markAllAsRead).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('chooses the source from the server-confirmed actor rather than the view role', async () => {
    renderWithProviders(tree({ ...platformContext, role: 'Admin' }))
    await refreshEvents()
    expect(notificationsApi.getUnreadCount).not.toHaveBeenCalled()
    expect(notificationsApi.getAll).not.toHaveBeenCalled()
  })

  it('loads one count and shares a single drawer between both responsive controls', async () => {
    const user = userEvent.setup()
    renderWithProviders(tree(residentContext))
    await waitFor(() => expect(screen.getByTestId('unread-count')).toHaveTextContent('1'))
    expect(notificationsApi.getUnreadCount).toHaveBeenCalledOnce()
    const buttons = screen.getAllByRole('button', { name: /Notifications/ })
    expect(buttons).toHaveLength(2)
    await user.click(buttons[1])
    expect(await screen.findByText('Account notification')).toBeVisible()
    expect(screen.getAllByRole('heading', { name: 'Notifications', exact: true })).toHaveLength(1)
    expect(notificationsApi.getAll).toHaveBeenCalledOnce()
    expect(notificationsApi.getUnreadCount).toHaveBeenCalledTimes(2)
  })

  it('coalesces focus, visibility and domain events while a refresh is already pending', async () => {
    const pending = deferred<NotificationResponse[]>()
    vi.mocked(notificationsApi.getAll).mockReturnValue(pending.promise)
    renderWithProviders(tree(residentContext))
    await waitFor(() => expect(notificationsApi.getUnreadCount).toHaveBeenCalledOnce())
    await refreshEvents()
    await refreshEvents()
    expect(notificationsApi.getAll).toHaveBeenCalledOnce()
    expect(notificationsApi.getUnreadCount).toHaveBeenCalledTimes(2)
    await act(async () => pending.resolve([notification]))
  })

  it('keeps a failed regular-user request distinct from an empty inbox and retries', async () => {
    vi.mocked(notificationsApi.getAll).mockRejectedValueOnce(new Error('Notification service unavailable'))
    const user = userEvent.setup()
    renderWithProviders(tree(residentContext))
    await waitFor(() => expect(notificationsApi.getUnreadCount).toHaveBeenCalledOnce())
    await user.click(screen.getAllByRole('button', { name: /Notifications/ })[0])
    expect(await screen.findByText('Notification service unavailable')).toBeVisible()
    expect(screen.queryByText('No notifications yet')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry', exact: true }))
    expect(await screen.findByText('Account notification')).toBeVisible()
    expect(notificationsApi.getAll).toHaveBeenCalledTimes(2)
  })

  it('marks all notifications read and refreshes the shared unread count', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValue(0)
    const user = userEvent.setup()
    renderWithProviders(tree(residentContext))
    await waitFor(() => expect(notificationsApi.getUnreadCount).toHaveBeenCalledOnce())
    await user.click(screen.getAllByRole('button', { name: /Notifications/ })[0])
    await screen.findByText('Account notification')
    await user.click(screen.getByRole('button', { name: 'Mark all read', exact: true }))
    await waitFor(() => expect(screen.getByTestId('unread-count')).toHaveTextContent('0'))
    expect(notificationsApi.markAllAsRead).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Mark all read', exact: true })).toBeDisabled()
    expect(notificationsApi.getUnreadCount).toHaveBeenCalledTimes(3)
  })

  it('discards pending regular-user data when switching to a platform identity', async () => {
    const pending = deferred<NotificationResponse[]>()
    vi.mocked(notificationsApi.getAll).mockReturnValue(pending.promise)
    const user = userEvent.setup()
    const view = renderWithProviders(tree(residentContext))
    await waitFor(() => expect(notificationsApi.getUnreadCount).toHaveBeenCalledOnce())
    await user.click(screen.getAllByRole('button', { name: /Notifications/ })[0])
    view.rerender(tree(platformContext))
    await act(async () => pending.resolve([notification]))
    await user.click(screen.getAllByRole('button', { name: /Notifications/ })[0])
    expect(await screen.findByText('Platform notifications will be available here.')).toBeVisible()
    expect(screen.queryByText('Account notification')).not.toBeInTheDocument()
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    expect(notificationsApi.getAll).toHaveBeenCalledOnce()
  })

  it('does not restore an old account unread count after another account is active', async () => {
    const pending = deferred<number>()
    vi.mocked(notificationsApi.getUnreadCount).mockReturnValueOnce(pending.promise).mockResolvedValue(7)
    const view = renderWithProviders(tree(residentContext))
    await waitFor(() => expect(notificationsApi.getUnreadCount).toHaveBeenCalledOnce())
    view.rerender(tree({ ...residentContext, account: { ...residentContext.account, id: 'user-7c1c1543-2022-4842-871d-62d4d06313bc' } }))
    await waitFor(() => expect(screen.getByTestId('unread-count')).toHaveTextContent('7'))
    await act(async () => pending.resolve(42))
    expect(screen.getByTestId('unread-count')).toHaveTextContent('7')
    expect(notificationsApi.getUnreadCount).toHaveBeenCalledTimes(2)
  })

  it('waits for session verification before loading regular-user notifications', async () => {
    const view = renderWithProviders(tree({ ...residentContext, accountsLoading: true }))
    await refreshEvents()
    expect(notificationsApi.getUnreadCount).not.toHaveBeenCalled()
    expect(notificationsApi.getAll).not.toHaveBeenCalled()
    expect(screen.getAllByRole('button', { name: /Notifications/ })[0]).toBeDisabled()
    view.rerender(tree(residentContext))
    await waitFor(() => expect(notificationsApi.getUnreadCount).toHaveBeenCalledOnce())
  })
})
