import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { billDetail } from '../../../tests/financeFixtures'
import { renderWithProviders } from '../../../tests/render'
import type { ResidentBillDetail } from '../../types/finance'
import ResidentBillBreakdown from './ResidentBillBreakdown'

const money = (amount: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'RON' })
  .format(amount).replace(/\s+/g, ' ')
const detail = (amount: number, bill: Partial<ResidentBillDetail['bill']>): ResidentBillDetail => ({
  bill: { ...billDetail.bill, originalAmount: amount, correctedAmount: amount, reportTotal: amount,
    carriedForwardArrears: 0, paidAmount: 0, remainingAmount: amount, ...bill },
  breakdown: { ...billDetail.breakdown, row: { ...billDetail.breakdown.row,
    charges: [{ ...billDetail.breakdown.row.charges[3], amount }], currentCharges: amount,
    arrears: 0, adjustments: 0, adjustmentDetails: [], totalDue: amount } },
})

describe('resident correction balances', () => {
  it('deducts an eligible credit from the next bill without recording a payment', () => {
    renderWithProviders(<ResidentBillBreakdown onClose={vi.fn()}
      detail={detail(100, { compensationReceived: 30, remainingAmount: 70 })} />)
    expect(screen.getByText('Credit applied to this bill').parentElement).toHaveTextContent(money(-30))
    expect(screen.getAllByText(money(70)).length).toBeGreaterThan(0)
    expect(screen.queryByText('Amount paid')).not.toBeInTheDocument()
  })

  it('keeps a paid month settled and explains an increased correction on the next bill', () => {
    renderWithProviders(<ResidentBillBreakdown onClose={vi.fn()} detail={detail(130, {
      originalAmount: 100, paidAmount: 100, remainingAmount: 0, status: 'paid', correctionAmount: 30,
      pendingCorrectionDebit: 30,
      payments: [{ id: '00000000-0000-0000-0000-000000000080', amount: 100, receivedOn: '2026-11-01' }],
      corrections: [{ publicationId: '00000000-0000-0000-0000-000000000081', revision: 3, amount: 30,
        reason: 'Supplier invoice increased', publishedAt: '2026-11-07T12:00:00Z', carryToNextBill: true }],
    })} />)
    expect(screen.getByText(/from this correction will be added to your next bill/)).toHaveTextContent(money(30))
    expect(screen.getByText('The bill was fully settled before this correction. The difference is carried to the next bill.')).toBeVisible()
    expect(screen.getByText('Supplier invoice increased')).toBeVisible()
    expect(screen.getByText('Amount paid').parentElement).toHaveTextContent(money(100))
    expect(screen.getByText('Cash payment history')).toBeVisible()
  })

  it('adds a previous paid correction to the next bill without describing it as cash paid', () => {
    renderWithProviders(<ResidentBillBreakdown onClose={vi.fn()}
      detail={detail(100, { correctionDebitApplied: 30, remainingAmount: 130 })} />)
    expect(screen.getByText('Correction added from a previous bill').parentElement).toHaveTextContent(money(30))
    expect(screen.getAllByText(money(130)).length).toBeGreaterThan(0)
    expect(screen.queryByText('Amount paid')).not.toBeInTheDocument()
  })

  it('updates a partially paid month to 220 minus 100 and does not carry the difference forward', () => {
    renderWithProviders(<ResidentBillBreakdown onClose={vi.fn()} detail={detail(220, {
      originalAmount: 250, paidAmount: 100, remainingAmount: 120, correctionAmount: -30,
      corrections: [{ publicationId: '00000000-0000-0000-0000-000000000082', revision: 3, amount: -30,
        reason: 'Maintenance corrected', publishedAt: '2026-11-07T12:00:00Z', carryToNextBill: false }],
    })} />)
    expect(screen.getAllByText(money(120)).length).toBeGreaterThan(0)
    expect(screen.getByText('The bill was not fully settled before this correction. Its balance is updated for this month.')).toBeVisible()
    expect(screen.queryByText(/from this correction will be added to your next bill/)).not.toBeInTheDocument()
    expect(within(screen.getByText('Amount paid').parentElement!).getByText(money(100))).toBeVisible()
  })
})
