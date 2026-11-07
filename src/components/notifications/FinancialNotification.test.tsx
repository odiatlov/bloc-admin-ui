import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import type { NotificationResponse } from '../../types/notifications'
import NotificationListItem from './NotificationListItem'
import NotificationsDrawer from './NotificationsDrawer'
import { RoleContext } from '../../contexts/RoleContext'
import { residentContext } from '../../../tests/financeFixtures'

const notification: NotificationResponse = { id: '734cb554-6365-447c-bb7a-a23da3c76303', recipientType: 'User', type: 'FinanceReviewRejected', severity: 'warning',
  relatedYear: 2026, relatedMonth: 9, relatedRevision: 3, relatedCycle: 2, title: 'FinanceReviewRejected', message: 'Full reason remains in the report history.',
  context: 'Block A', isRead: false, createdAt: '2026-11-03T08:00:00Z', actionUrl: '/admin/reports/maintenance/76df6377-6e91-4103-bf8b-41f53456a1ec?submissionId=75655156-5cbb-41ef-bfb4-4824e6270faf' }

describe('financial notifications', () => {
  const paid: NotificationResponse = { ...notification, type: 'BillPaymentConfirmed', title: 'BillPaymentConfirmed',
    message: '', severity: 'success', relatedRevision: null, relatedCycle: null,
    actionUrl: '/admin/finance?billId=00000000-0000-0000-0000-000000000010' }

  it.each(['en', 'ro'] as const)('localizes full-payment confirmation for the billed month in %s', language => {
    renderWithProviders(<NotificationListItem notification={paid} onClick={vi.fn()} />, { language })
    expect(screen.getByText(language === 'en' ? 'Bill paid' : 'Factura a fost achitată')).toBeVisible()
    expect(screen.getByText(language === 'en' ? /confirmed full payment.*September 2026/ : /confirmat achitarea integrală.*septembrie 2026/)).toBeVisible()
    expect(screen.getByText('Block A')).toBeVisible()
    expect(screen.queryByText('BillPaymentConfirmed')).not.toBeInTheDocument()
  })

  it('opens the confirmed bill in the resident role after marking the notification as read', async () => {
    const user = userEvent.setup()
    const read = vi.fn().mockResolvedValue(undefined)
    const setRole = vi.fn(); const close = vi.fn()
    const Location = () => { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output> }
    renderWithProviders(<MemoryRouter initialEntries={['/admin/notifications']}>
      <RoleContext.Provider value={{ ...residentContext, role: 'Admin', setRole,
        account: { ...residentContext.account, roles: ['Admin', 'Resident'] } }}>
        <Location /><NotificationsDrawer open error={null} loading={false} notifications={[paid]} onClose={close}
          onMarkAllAsRead={vi.fn().mockResolvedValue(undefined)} onNotificationClick={read} onRetry={vi.fn()} />
      </RoleContext.Provider>
    </MemoryRouter>)
    await user.click(screen.getByText('Bill paid'))
    await waitFor(() => expect(setRole).toHaveBeenCalledWith('Resident'))
    expect(read).toHaveBeenCalledWith(paid)
    expect(screen.getByTestId('location')).toHaveTextContent(paid.actionUrl!)
    expect(close).toHaveBeenCalledOnce()
  })
  it.each(['en', 'ro'] as const)('localizes a correction notification and identifies the affected billing month in %s', language => {
    renderWithProviders(<NotificationListItem onClick={vi.fn()} notification={{ ...notification,
      type: 'BillCorrectionPublished', title: 'BillCorrectionPublished', message: 'Supplier invoice corrected',
      actionUrl: '/admin/finance?billId=00000000-0000-0000-0000-000000000010' }} />, { language })
    expect(screen.getByText(language === 'en' ? 'Your bill has been corrected' : 'Factura ta a fost corectată')).toBeVisible()
    expect(screen.getByText(language === 'en' ? /Block A.*September 2026.*3/ : /Block A.*septembrie 2026.*3/)).toBeVisible()
    expect(screen.getByText('Supplier invoice corrected')).toBeVisible()
    expect(screen.queryByText('BillCorrectionPublished')).not.toBeInTheDocument()
  })

  it.each(['en', 'ro'] as const)('localizes the event and identifies its exact revision/cycle in %s', language => {
    renderWithProviders(<NotificationListItem notification={notification} onClick={vi.fn()} />, { language })
    expect(screen.getByText(language === 'en' ? 'Financial report rejected' : 'Raport financiar respins')).toBeVisible()
    expect(screen.getByText(/Block A.*3.*2/)).toBeVisible()
    expect(screen.getByText(notification.message)).toBeVisible()
    expect(screen.queryByText('FinanceReviewRejected')).not.toBeInTheDocument()
    expect(screen.getByText(language === 'ro' ? /noiembrie.*\d{2}:\d{2}/ : /November.*\d{2}:\d{2}/)).toBeVisible()
    expect(screen.queryByText(/\d{1,2}:\d{2} [AP]M/)).not.toBeInTheDocument()
  })
  it('does not navigate or switch roles after the notification scope is closed during a request', async () => {
    const user = userEvent.setup()
    let finish!: () => void
    const read = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    const setRole = vi.fn()
    const Location = () => <output data-testid="location">{useLocation().pathname}</output>
    const scope = (open: boolean) => <MemoryRouter initialEntries={['/admin/notifications']}>
      <RoleContext.Provider value={{ ...residentContext, setRole, account: { ...residentContext.account, roles: ['Admin', 'Resident'] } }}>
        <Location />
        {open && <NotificationsDrawer open error={null} loading={false} notifications={[notification]} onClose={vi.fn()}
          onMarkAllAsRead={vi.fn().mockResolvedValue(undefined)} onNotificationClick={read} onRetry={vi.fn()} />}
      </RoleContext.Provider>
    </MemoryRouter>
    const view = renderWithProviders(scope(true))
    await user.click(screen.getByText('Financial report rejected'))
    expect(read).toHaveBeenCalledOnce()
    view.rerender(scope(false))
    await act(async () => { finish(); await Promise.resolve() })
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/notifications')
    expect(setRole).not.toHaveBeenCalled()
  })
})
