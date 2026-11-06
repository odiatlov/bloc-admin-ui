import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { billDetail, residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { residentFinanceApi } from '../../../../../services/residentFinanceApi'
import ResidentBills from './ResidentBills'

const element = (id = residentContext.account.id) => <MemoryRouter><RoleContext.Provider value={{ ...residentContext, account: { ...residentContext.account, id } }}><ResidentBills /></RoleContext.Provider></MemoryRouter>
const openBillDetails = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: 'More actions' }))
  await user.click(await screen.findByRole('menuitem', { name: 'View bill' }))
}
beforeEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  vi.spyOn(residentFinanceApi, 'periods').mockResolvedValue(['2026-11', '2026-10'])
})

describe('resident published bills', () => {
  it('filters published bills by month after OK and can return to all months', async () => {
    const list = vi.spyOn(residentFinanceApi, 'bills')
      .mockResolvedValue({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
    const user = userEvent.setup()
    renderWithProviders(element())
    await waitFor(() => expect(screen.getByRole('button', { name: /choose date/i })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    const picker = within(screen.getByRole('dialog'))
    expect(picker.getByRole('radio', { name: 'September' })).toBeDisabled()
    await user.click(picker.getByRole('radio', { name: 'October' }))
    expect(list).toHaveBeenCalledTimes(1)
    await user.click(picker.getByRole('button', { name: 'OK' }))
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(1, '2026-10', expect.any(AbortSignal)))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'All months' }))
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(1, '', expect.any(AbortSignal)))
  })

  it('distinguishes loading, failure with retry, and successful empty history', async () => {
    let reject!: (error: Error) => void
    const list = vi.spyOn(residentFinanceApi, 'bills').mockReturnValueOnce(new Promise((_, no) => { reject = no }))
      .mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10 })
    renderWithProviders(element())
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByText('No published bills yet')).not.toBeInTheDocument()
    reject(new Error('offline'))
    expect(await screen.findByText('Your bills could not be loaded. Please retry.')).toBeVisible()
    expect(screen.queryByText('No published bills yet')).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /retry/i }))
    expect(await screen.findByText('No published bills yet')).toBeVisible()
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('shows one error and retries both requests when bills and months fail together', async () => {
    const months = vi.mocked(residentFinanceApi.periods).mockRejectedValueOnce(new Error('offline'))
    const list = vi.spyOn(residentFinanceApi, 'bills').mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10 })
    renderWithProviders(element())
    expect(await screen.findByText('Your bills could not be loaded. Please retry.')).toBeVisible()
    expect(screen.queryByText('Billing months could not be loaded. Please retry.')).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /retry/i }))
    expect(await screen.findByText('No published bills yet')).toBeVisible()
    expect(months).toHaveBeenCalledTimes(2)
    expect(list).toHaveBeenCalledTimes(2)
  })

  it.each(['light', 'dark'] as const)('opens a bill through its keyboard-accessible details action in %s mode and supports Back', async (mode) => {
    vi.spyOn(residentFinanceApi, 'bills').mockResolvedValue({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
    const details = vi.spyOn(residentFinanceApi, 'bill').mockResolvedValue(billDetail)
    const user = userEvent.setup()
    renderWithProviders(element(), { mode })
    const moreActions = await screen.findByRole('button', { name: 'More actions' })
    moreActions.focus()
    await user.keyboard('{Enter}')
    const action = await screen.findByRole('menuitem', { name: 'View bill' })
    action.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('dialog', { name: 'Invoice details' })).toBeVisible()
    expect(details).toHaveBeenCalledWith(billDetail.bill.id, expect.any(AbortSignal))
    expect(screen.getByText('Credit correction')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('keeps bill references and card content as plain text without opening details', async () => {
    vi.spyOn(residentFinanceApi, 'bills').mockResolvedValue({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
    const details = vi.spyOn(residentFinanceApi, 'bill').mockResolvedValue(billDetail)
    renderWithProviders(element())
    const references = await screen.findAllByText(billDetail.bill.reference)
    expect(screen.queryByRole('button', { name: billDetail.bill.reference })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: billDetail.bill.reference })).not.toBeInTheDocument()
    const user = userEvent.setup()
    for (const reference of references) {
      expect(reference.closest('button,a')).toBeNull()
      await user.click(reference)
    }
    await user.click(screen.getAllByText('Fixture block / A / Apartment 12').at(-1)!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(details).not.toHaveBeenCalled()
    await openBillDetails(user)
    expect(await screen.findByRole('dialog')).toBeVisible()
  })

  it('clears another account’s bill list and open detail immediately', async () => {
    vi.spyOn(residentFinanceApi, 'bills').mockResolvedValueOnce({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
      .mockImplementation(() => new Promise(() => undefined))
    vi.spyOn(residentFinanceApi, 'bill').mockResolvedValue(billDetail)
    const view = renderWithProviders(element())
    await openBillDetails(userEvent.setup())
    await screen.findByRole('dialog')
    view.rerender(element('different-account'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(billDetail.bill.reference)).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeVisible()
  })

  it('shows a compact breakdown and requests cash for just the selected bill', async () => {
    const requested = { ...billDetail.bill, cashRequestedAt: '2026-11-05T12:00:00Z' }
    vi.spyOn(residentFinanceApi, 'bills')
      .mockResolvedValueOnce({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
      .mockResolvedValue({ items: [requested], totalCount: 1, pageNumber: 1, pageSize: 10 })
    vi.spyOn(residentFinanceApi, 'bill').mockResolvedValue(billDetail)
    const request = vi.spyOn(residentFinanceApi, 'requestCash').mockResolvedValue(requested)
    const user = userEvent.setup()
    renderWithProviders(element())
    await user.click(await screen.findByRole('button', { name: 'Pay' }))
    const breakdown = await screen.findByRole('dialog', { name: 'Cost breakdown' })
    const charge = await within(breakdown).findByRole('heading', { name: 'Cold supply' })
    expect(charge.parentElement).toHaveTextContent('40.00')
    expect(within(breakdown).queryByText('Agreed repair contribution')).not.toBeInTheDocument()
    await user.click(within(breakdown).getByRole('button', { name: 'Pay bill' }))
    const methods = await screen.findByRole('dialog', { name: 'Choose payment method' })
    expect(within(methods).getByRole('radio', { name: /pay by card/i })).toBeDisabled()
    expect(within(methods).getByText('Coming soon')).toBeVisible()
    await user.click(within(methods).getByRole('button', { name: 'Send cash request' }))
    expect(request).toHaveBeenCalledExactlyOnceWith(billDetail.bill.id)
    expect(await screen.findAllByText('Awaiting confirmation')).not.toHaveLength(0)
    expect(screen.queryByText('Unpaid')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pay' })).not.toBeInTheDocument()
  })

  it('opens payment options directly from the bill drawer', async () => {
    vi.spyOn(residentFinanceApi, 'bills').mockResolvedValue({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
    vi.spyOn(residentFinanceApi, 'bill').mockResolvedValue(billDetail)
    const user = userEvent.setup()
    renderWithProviders(element())
    await openBillDetails(user)
    const drawer = await screen.findByRole('dialog', { name: 'Invoice details' })
    await user.click(await within(drawer).findByRole('button', { name: 'Pay bill' }))
    expect(await screen.findByRole('dialog', { name: 'Choose payment method' })).toBeVisible()
    expect(screen.queryByRole('dialog', { name: 'Cost breakdown' })).not.toBeInTheDocument()
  })
})
