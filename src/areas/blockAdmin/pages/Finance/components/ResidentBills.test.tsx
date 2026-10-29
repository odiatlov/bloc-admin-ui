import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { billDetail, residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { residentFinanceApi } from '../../../../../services/residentFinanceApi'
import ResidentBills from './ResidentBills'

const element = (id = residentContext.account.id) => <MemoryRouter><RoleContext.Provider value={{ ...residentContext, account: { ...residentContext.account, id } }}><ResidentBills /></RoleContext.Provider></MemoryRouter>
beforeEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

describe('resident published bills', () => {
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

  it('opens a clicked bill in the drawer with saved details and supports Back', async () => {
    vi.spyOn(residentFinanceApi, 'bills').mockResolvedValue({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
    const details = vi.spyOn(residentFinanceApi, 'bill').mockResolvedValue(billDetail)
    const user = userEvent.setup()
    renderWithProviders(element())
    const reference = await screen.findByRole('button', { name: billDetail.bill.reference })
    reference.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('dialog', { name: 'Invoice details' })).toBeVisible()
    expect(details).toHaveBeenCalledWith(billDetail.bill.id, expect.any(AbortSignal))
    expect(screen.getByText('Credit correction')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('opens the same drawer by clicking bill card content', async () => {
    vi.spyOn(residentFinanceApi, 'bills').mockResolvedValue({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
    vi.spyOn(residentFinanceApi, 'bill').mockResolvedValue(billDetail)
    renderWithProviders(element())
    await screen.findByRole('button', { name: billDetail.bill.reference })
    await userEvent.setup().click(screen.getAllByText('Fixture block / A / Apartment 12').at(-1)!)
    expect(await screen.findByRole('dialog')).toBeVisible()
  })

  it('clears another account’s bill list and open detail immediately', async () => {
    vi.spyOn(residentFinanceApi, 'bills').mockResolvedValueOnce({ items: [billDetail.bill], totalCount: 1, pageNumber: 1, pageSize: 10 })
      .mockImplementation(() => new Promise(() => undefined))
    vi.spyOn(residentFinanceApi, 'bill').mockResolvedValue(billDetail)
    const view = renderWithProviders(element())
    await userEvent.setup().click(await screen.findByRole('button', { name: billDetail.bill.reference }))
    await screen.findByRole('dialog')
    view.rerender(element('different-account'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: billDetail.bill.reference })).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeVisible()
  })
})
