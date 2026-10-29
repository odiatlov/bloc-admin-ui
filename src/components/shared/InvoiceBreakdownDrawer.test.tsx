import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import { billDetail } from '../../../tests/financeFixtures'
import InvoiceBreakdownDrawer from './InvoiceBreakdownDrawer'

describe('published resident bill drawer', () => {
  it.each(['light', 'dark'] as const)('shows every report component, reasons and saved totals in %s mode', async mode => {
    const user = userEvent.setup()
    const close = vi.fn()
    renderWithProviders(<InvoiceBreakdownDrawer invoice={null} bill={billDetail} onClose={close} formatCurrency={String} />, { mode })
    const drawer = screen.getByRole('dialog', { name: 'Invoice details' })
    for (const line of billDetail.breakdown.row.charges) expect(within(drawer).getByText(line.name)).toBeInTheDocument()
    for (const entry of billDetail.breakdown.row.adjustmentDetails!) {
      expect(within(drawer).getByText(entry.name)).toBeVisible()
      expect(within(drawer).getByText(`Reason: ${entry.reason}`)).toBeVisible()
    }
    expect(within(drawer).getByText(/measured usage is 4 m³/)).toBeVisible()
    expect(within(drawer).getByText(/not charged twice/)).toBeVisible()
    expect(within(drawer).getByText('Saved report total').parentElement).toHaveTextContent('212.00')
    expect(within(drawer).getByText('Amount issued on this bill').parentElement).toHaveTextContent('112.00')
    await user.click(within(drawer).getByRole('button', { name: /Garden repair/ }))
    expect(within(drawer).getByText('Reason: Agreed repair contribution')).toBeVisible()
    expect(within(drawer).queryByRole('button', { name: /pay bill/i })).not.toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Back' }))
    expect(close).toHaveBeenCalledOnce()
  })

  it('explains rates and heating calculations in Romanian', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InvoiceBreakdownDrawer invoice={null} bill={billDetail} onClose={vi.fn()} formatCurrency={String} />, { language: 'ro' })
    expect(screen.getByRole('dialog', { name: 'Detalii factură' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Rubbish/ }))
    expect(screen.getByText(/cantitatea ta este 3 persoane/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: /^Heating/ }))
    expect(screen.getByText(/suprafață utilă/)).toBeVisible()
    expect(screen.getByText(/20,1%/)).toBeVisible()
  })

  it('keeps loading and detail failure distinct and retries', async () => {
    const retry = vi.fn()
    const props = { invoice: null, open: true, onClose: vi.fn(), formatCurrency: String }
    const view = renderWithProviders(<InvoiceBreakdownDrawer {...props} loading />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    view.rerender(<InvoiceBreakdownDrawer {...props} error="Bill unavailable" onRetry={retry} />)
    expect(screen.getByText('Bill unavailable')).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: /retry/i }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
