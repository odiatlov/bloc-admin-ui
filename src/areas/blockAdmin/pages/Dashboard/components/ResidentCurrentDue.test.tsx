import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { residentFinanceApi } from '../../../../../services/residentFinanceApi'
import ResidentCurrentDue from './ResidentCurrentDue'

const element = (id = residentContext.account.id) => <MemoryRouter><RoleContext.Provider value={{ ...residentContext, account: { ...residentContext.account, id } }}><ResidentCurrentDue /></RoleContext.Provider></MemoryRouter>
beforeEach(() => vi.restoreAllMocks())

describe('resident current amount due', () => {
  it('shows the server total across all bills and the unpaid count', async () => {
    vi.spyOn(residentFinanceApi, 'summary').mockResolvedValue({ currentAmountDue: 350.25, currency: 'RON', unpaidBillCount: 12, totalBillCount: 15 })
    renderWithProviders(element())
    expect(await screen.findByText(/350.25/)).toBeVisible()
    expect(screen.getByText('12 unpaid bills across your linked apartments')).toBeVisible()
  })

  it('keeps failures separate from zero and retries successfully', async () => {
    vi.spyOn(residentFinanceApi, 'summary').mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ currentAmountDue: 0, currency: 'RON', unpaidBillCount: 0, totalBillCount: 0 })
    renderWithProviders(element())
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(await screen.findByText('Your amount due could not be loaded. Please retry.')).toBeVisible()
    expect(screen.queryByText(/0.00/)).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /retry/i }))
    expect(await screen.findByText(/0.00/)).toBeVisible()
    expect(screen.getByText('No published bills yet')).toBeVisible()
  })

  it('never shows the previous account’s balance while loading another account', async () => {
    vi.spyOn(residentFinanceApi, 'summary').mockResolvedValueOnce({ currentAmountDue: 350.25, currency: 'RON', unpaidBillCount: 12, totalBillCount: 15 })
      .mockImplementation(() => new Promise(() => undefined))
    const view = renderWithProviders(element())
    await screen.findByText(/350.25/)
    view.rerender(element('different-account'))
    expect(screen.queryByText(/350.25/)).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeVisible()
  })
})
