import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { maintenanceReport, residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeReviewApi } from '../../../../../services/financeReviewApi'
import type { FinanceReviewDetail } from '../../../../../types/financeReview'
import FinanceReviewDecisions from './FinanceReviewDecisions'

const detail: FinanceReviewDetail = { submissionId: '4f0569dc-f19e-44e0-84da-49a67e80de79', report: {
  ...maintenanceReport, review: { ...maintenanceReport.review!, version: 'pending-cycle', status: 'Submitted', canDecide: true, canPublish: false, censorRequired: true },
}, submission: { id: '4f0569dc-f19e-44e0-84da-49a67e80de79', runId: maintenanceReport.id, revision: 1, cycle: 2,
  submittedAt: '2026-11-03T08:00:00Z', status: 'Resubmitted', rule: 'Individual', ruleVersion: 1, reviewers: [] } }
const renderActions = (data = detail, refresh = vi.fn()) => renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Censor' }}>
  <FinanceReviewDecisions detail={data} refresh={refresh} onExport={vi.fn()} />
</RoleContext.Provider></MemoryRouter>)
beforeEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })
describe('censor review decisions', () => {
  it('requires a non-whitespace rejection reason and submits the exact cycle/version', async () => {
    const user = userEvent.setup()
    const decide = vi.spyOn(financeReviewApi, 'decide').mockResolvedValue({ eventId: '8f4b12f9-2fef-49a3-aefd-f97269db6554', submissionId: detail.submissionId, runId: maintenanceReport.id, cycle: 2, outcome: 'Rejected' })
    const refresh = vi.fn()
    renderActions(detail, refresh)
    await user.click(screen.getByRole('button', { name: 'Reject' }))
    const dialog = screen.getByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Reject' })
    expect(confirm).toBeDisabled()
    await user.type(screen.getByLabelText(/Rejection reason/), '   ')
    expect(confirm).toBeDisabled()
    await user.type(screen.getByLabelText(/Rejection reason/), 'Check the heating allocation')
    await user.click(confirm)
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(decide).toHaveBeenCalledWith(detail.submissionId, expect.objectContaining({ outcome: 'Rejected', reason: 'Check the heating allocation',
      expectedReviewVersion: 'pending-cycle', expectedInputVersion: detail.report.inputVersion }))
  })
  it('does not record a decision on cancellation', async () => {
    const user = userEvent.setup()
    const decide = vi.spyOn(financeReviewApi, 'decide')
    renderActions()
    await user.click(screen.getByRole('button', { name: 'Verify report' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(decide).not.toHaveBeenCalled()
  })
  it('keeps completed or ineligible cycles read-only', () => {
    renderActions({ ...detail, report: { ...detail.report, review: { ...detail.report.review!, canDecide: false } } })
    expect(screen.queryByRole('button', { name: 'Verify report' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export Excel' })).toBeEnabled()
  })
})
