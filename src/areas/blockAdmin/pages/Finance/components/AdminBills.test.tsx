import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { billDetail, residentContext } from '../../../../../../tests/financeFixtures'
import { renderWithProviders } from '../../../../../../tests/render'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeApi } from '../../../../../services/financeApi'
import { financeBillsApi } from '../../../../../services/financeBillsApi'
import AdminBills from './AdminBills'

const adminContext: typeof residentContext = {
  ...residentContext, role: 'Admin',
  account: { ...residentContext.account, defaultRole: 'Admin', roles: ['Admin'], blockRoles: ['Admin'] },
}
const first = { ...billDetail.bill, cashRequestedAt: '2026-11-05T12:00:00Z' }
const second = { ...first, id: '00000000-0000-0000-0000-000000000012', month: 11, cashRequestedAt: null }
const paid = { ...first, status: 'paid' as const, cashRequestedAt: null, remainingAmount: 0, paidAmount: first.originalAmount }
const page = (...bills: (typeof first | typeof second | typeof paid)[]) => ({
  items: bills.map(bill => ({ bill, residentName: 'Resident fixture' })),
  totalCount: bills.length, pageNumber: 1, pageSize: 10,
})

beforeEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  vi.spyOn(financeApi, 'blocks').mockResolvedValue([])
  vi.spyOn(financeBillsApi, 'periods').mockResolvedValue(['2026-11', '2026-10'])
})

describe('admin bills', () => {
  it('enables Staircase only after selecting a block and offers every stair from that block, even without bills', async () => {
    const blockId = '00000000-0000-0000-0000-000000000061'
    const emptyStairId = '00000000-0000-0000-0000-000000000063'
    vi.mocked(financeApi.blocks).mockResolvedValue([
      { id: blockId, name: 'Block A', hasStaircases: true, staircases: [
        { id: '00000000-0000-0000-0000-000000000062', name: 'Stair A1' }, { id: emptyStairId, name: 'Stair A2 without bills' },
      ] },
      { id: '00000000-0000-0000-0000-000000000064', name: 'Block B', hasStaircases: true,
        staircases: [{ id: '00000000-0000-0000-0000-000000000065', name: 'Stair B1' }] },
    ])
    const list = vi.spyOn(financeBillsApi, 'list').mockResolvedValue(page())
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter><RoleContext.Provider value={adminContext}><AdminBills /></RoleContext.Provider></MemoryRouter>)
    expect(screen.getByRole('combobox', { name: /^Staircase/ })).toHaveAttribute('aria-disabled', 'true')
    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Block/ })).not.toHaveAttribute('aria-disabled', 'true'))
    expect(screen.getByRole('combobox', { name: /^Staircase/ })).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('combobox', { name: /^Block/ }))
    await user.click(await screen.findByRole('option', { name: 'Block A' }))
    expect(screen.getByRole('combobox', { name: /^Staircase/ })).not.toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('combobox', { name: /^Staircase/ }))
    expect(await screen.findByRole('option', { name: 'Stair A1' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Stair A2 without bills' })).toBeVisible()
    expect(screen.queryByRole('option', { name: 'Stair B1' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Stair A2 without bills' }))
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ blockId, staircaseId: emptyStairId }), expect.any(AbortSignal)))
  })

  it('clears the stair when changing or clearing the block and disables it for blocks without stairs', async () => {
    const a = '00000000-0000-0000-0000-000000000071'
    const b = '00000000-0000-0000-0000-000000000072'
    const stairA = '00000000-0000-0000-0000-000000000073'
    const stairB = '00000000-0000-0000-0000-000000000074'
    vi.mocked(financeApi.blocks).mockResolvedValue([
      { id: a, name: 'Block A', hasStaircases: true, staircases: [{ id: stairA, name: 'Stair A' }] },
      { id: b, name: 'Block B', hasStaircases: true, staircases: [{ id: stairB, name: 'Stair B' }] },
      { id: '00000000-0000-0000-0000-000000000075', name: 'No stairs', hasStaircases: false, staircases: [] },
    ])
    const list = vi.spyOn(financeBillsApi, 'list').mockResolvedValue(page())
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter><RoleContext.Provider value={adminContext}><AdminBills /></RoleContext.Provider></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Block/ })).not.toHaveAttribute('aria-disabled', 'true'))
    await user.click(screen.getByRole('combobox', { name: /^Block/ }))
    await user.click(await screen.findByRole('option', { name: 'Block A' }))
    await user.click(screen.getByRole('combobox', { name: /^Staircase/ }))
    await user.click(await screen.findByRole('option', { name: 'Stair A' }))
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ blockId: a, staircaseId: stairA }), expect.any(AbortSignal)))
    await user.click(screen.getByRole('combobox', { name: /^Block/ }))
    await user.click(await screen.findByRole('option', { name: 'Block B' }))
    expect(screen.getByRole('combobox', { name: /^Staircase/ })).toHaveTextContent('All')
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ blockId: b, staircaseId: '' }), expect.any(AbortSignal)))
    await user.click(screen.getByRole('combobox', { name: /^Staircase/ }))
    await user.click(await screen.findByRole('option', { name: 'Stair B' }))
    await user.click(screen.getByRole('combobox', { name: /^Block/ }))
    await user.click(await screen.findByRole('option', { name: 'All' }))
    expect(screen.getByRole('combobox', { name: /^Staircase/ })).toHaveAttribute('aria-disabled', 'true')
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ blockId: '', staircaseId: '' }), expect.any(AbortSignal)))
    await user.click(screen.getByRole('combobox', { name: /^Block/ }))
    await user.click(await screen.findByRole('option', { name: 'No stairs' }))
    expect(screen.getByRole('combobox', { name: /^Staircase/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('ignores a restored staircase filter without a selected block', async () => {
    const stairId = '00000000-0000-0000-0000-000000000082'
    vi.mocked(financeApi.blocks).mockResolvedValue([{ id: '00000000-0000-0000-0000-000000000081', name: 'Block A', hasStaircases: true,
      staircases: [{ id: stairId, name: 'Stair A' }] }])
    sessionStorage.setItem(JSON.stringify(['page-filters-v1', adminContext.account.id, 'Admin', '/admin/bills', 'adminBills.filters']),
      JSON.stringify({ blockId: '', staircaseId: stairId, period: '2026-11', search: '' }))
    const list = vi.spyOn(financeBillsApi, 'list').mockResolvedValue(page())
    renderWithProviders(<MemoryRouter initialEntries={['/admin/bills']}><RoleContext.Provider value={adminContext}><AdminBills /></RoleContext.Provider></MemoryRouter>)
    await waitFor(() => expect(list).toHaveBeenCalled())
    expect(screen.getByRole('combobox', { name: /^Staircase/ })).toHaveAttribute('aria-disabled', 'true')
    expect(list.mock.calls.every(([filters]) => !filters.blockId && !filters.staircaseId && !filters.year && !filters.month)).toBe(true)
  })

  it('validates a partial receipt and reuses its identity after an uncertain result', async () => {
    const partial = { ...first, paidAmount: 30, remainingAmount: first.remainingAmount - 30, cashRequestedAt: null }
    vi.spyOn(financeBillsApi, 'list').mockResolvedValueOnce(page(first)).mockResolvedValue(page(partial))
    const record = vi.spyOn(financeBillsApi, 'recordCash').mockRejectedValueOnce(new Error('offline')).mockResolvedValue(partial)
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter><RoleContext.Provider value={adminContext}><AdminBills /></RoleContext.Provider></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: 'Record cash payment' }))
    const dialog = within(screen.getByRole('dialog'))
    const amount = dialog.getByRole('spinbutton', { name: 'Amount received' })
    await user.clear(amount)
    await user.type(amount, String(first.remainingAmount + 1))
    expect(dialog.getByRole('button', { name: 'Confirm cash received' })).toBeDisabled()
    await user.clear(amount)
    await user.type(amount, '30')
    await user.click(dialog.getByRole('button', { name: 'Confirm cash received' }))
    await waitFor(() => expect(record).toHaveBeenCalledOnce())
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Confirm cash received' })).toBeEnabled())
    await user.click(dialog.getByRole('button', { name: 'Confirm cash received' }))
    await waitFor(() => expect(record).toHaveBeenCalledTimes(2))
    expect(record.mock.calls[1]).toEqual(record.mock.calls[0])
    expect(record.mock.calls[0][2]).toEqual({ requestId: expect.any(String), amount: 30 })
  })

  it('restores the block, staircase, billing month and search after leaving Bills', async () => {
    const blockId = '00000000-0000-0000-0000-000000000051'
    const staircaseId = '00000000-0000-0000-0000-000000000052'
    vi.mocked(financeApi.blocks).mockResolvedValue([{ id: blockId, name: 'Fixture block', hasStaircases: true,
      staircases: [{ id: staircaseId, name: 'Stair A' }] }])
    const list = vi.spyOn(financeBillsApi, 'list').mockResolvedValue(page(first))
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/admin/bills']}>
      <RoleContext.Provider value={adminContext}>
        <Routes>
          <Route path="/admin/bills" element={<><Link to="/admin/dashboard">Other page</Link><AdminBills /></>} />
          <Route path="/admin/dashboard" element={<Link to="/admin/bills">Return to bills</Link>} />
        </Routes>
      </RoleContext.Provider>
    </MemoryRouter>)

    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Block/ })).not.toHaveAttribute('aria-disabled', 'true'))
    await user.click(screen.getByRole('combobox', { name: /^Block/ }))
    await user.click(await screen.findByRole('option', { name: 'Fixture block' }))
    await user.click(screen.getByRole('combobox', { name: /^Staircase/ }))
    await user.click(await screen.findByRole('option', { name: 'Stair A' }))
    await user.type(screen.getByRole('searchbox', { name: 'Resident name or apartment number' }), 'Ion')
    await waitFor(() => expect(screen.getByRole('button', { name: /choose date/i })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    const picker = within(screen.getByRole('dialog'))
    await user.click(picker.getByRole('radio', { name: 'October' }))
    await user.click(picker.getByRole('button', { name: 'OK' }))

    const filters = { blockId, staircaseId, year: 2026, month: 10, search: 'Ion', requestsOnly: false, pageNumber: 1 }
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(filters, expect.any(AbortSignal)))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('link', { name: 'Other page' }))
    list.mockClear()
    await user.click(screen.getByRole('link', { name: 'Return to bills' }))

    await waitFor(() => expect(list).toHaveBeenCalledExactlyOnceWith(filters, expect.any(AbortSignal)))
    expect(screen.getByRole('searchbox', { name: 'Resident name or apartment number' })).toHaveValue('Ion')
  })

  it('confirms one bill from the request tab and leaves another month unpaid', async () => {
    const list = vi.spyOn(financeBillsApi, 'list').mockResolvedValueOnce(page(first))
      .mockResolvedValueOnce(page()).mockResolvedValue(page(paid, second))
    const record = vi.spyOn(financeBillsApi, 'recordCash').mockResolvedValue(paid)
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/admin/finance/bills?tab=requests']}>
      <RoleContext.Provider value={adminContext}><AdminBills /></RoleContext.Provider>
    </MemoryRouter>)
    expect(await screen.findAllByText('Cash requested')).not.toHaveLength(0)
    expect(screen.queryByText('Unpaid')).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Record cash payment' }))
    const dialog = await screen.findByRole('dialog', { name: 'Record cash payment' })
    expect(within(dialog).getByText(/October 2026/)).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Confirm cash received' }))
    expect(record).toHaveBeenCalledExactlyOnceWith(first.id, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      { requestId: expect.any(String), amount: first.remainingAmount })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('No open payment requests match these filters.')).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'All bills' }))
    expect(await screen.findAllByText('Paid')).not.toHaveLength(0)
    expect(screen.getAllByText('Unpaid')).not.toHaveLength(0)
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ requestsOnly: false }), expect.any(AbortSignal))
  })
})
