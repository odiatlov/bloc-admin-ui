import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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
  vi.spyOn(financeApi, 'blocks').mockResolvedValue([])
  vi.spyOn(financeBillsApi, 'periods').mockResolvedValue(['2026-11', '2026-10'])
})

describe('admin bills', () => {
  it('confirms one bill from the request tab and leaves another month unpaid', async () => {
    const list = vi.spyOn(financeBillsApi, 'list').mockResolvedValueOnce(page(first))
      .mockResolvedValueOnce(page()).mockResolvedValue(page(paid, second))
    const record = vi.spyOn(financeBillsApi, 'recordCash').mockResolvedValue(paid)
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/admin/finance/bills?tab=requests']}>
      <RoleContext.Provider value={adminContext}><AdminBills /></RoleContext.Provider>
    </MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: 'Mark paid' }))
    const dialog = await screen.findByRole('dialog', { name: 'Mark paid' })
    expect(within(dialog).getByText(/October 2026/)).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Confirm cash received' }))
    expect(record).toHaveBeenCalledExactlyOnceWith(first.id, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('No open payment requests match these filters.')).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'All bills' }))
    expect(await screen.findAllByText('Paid')).not.toHaveLength(0)
    expect(screen.getAllByText('Unpaid')).not.toHaveLength(0)
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ requestsOnly: false }), expect.any(AbortSignal))
  })
})
