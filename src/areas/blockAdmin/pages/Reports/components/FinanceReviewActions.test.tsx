import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { maintenanceReport, residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeReviewApi } from '../../../../../services/financeReviewApi'
import type { MaintenanceReport } from '../../../../../types/finance'
import MaintenanceReportActions from './MaintenanceReportActions'

const assigned: MaintenanceReport = { ...maintenanceReport, review: { ...maintenanceReport.review!,
  censorRequired: true, censorAssignmentId: 'e1c23c0c-5f6b-47a0-9a45-bb066aeab5e1', canPublish: false, canSubmit: true } }
const renderActions = (report = assigned, onPublished = vi.fn()) => renderWithProviders(<MemoryRouter>
  <RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}><MaintenanceReportActions report={report} onExport={vi.fn()} onPublished={onPublished} /></RoleContext.Provider>
</MemoryRouter>)
beforeEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

describe('financial review action policy', () => {
  it('submits the reviewed revision and assignment, without offering publication', async () => {
    const user = userEvent.setup()
    const submit = vi.spyOn(financeReviewApi, 'submit').mockResolvedValue({ eventId: '2c1f9d9b-d94a-4033-8f60-1d4c344fca62', submissionId: 'fdd00150-bd3a-446a-a996-a582e2e49024', runId: assigned.id, cycle: 1, outcome: 'Submitted' })
    const completed = vi.fn()
    renderActions(assigned, completed)
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Submit for review' }))
    expect(submit).not.toHaveBeenCalled()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Submit for review' }))
    await waitFor(() => expect(completed).toHaveBeenCalledOnce())
    expect(submit).toHaveBeenCalledWith(assigned.id, expect.objectContaining({ expectedInputVersion: assigned.inputVersion,
      expectedReviewVersion: 'none', expectedCensorAssignmentId: assigned.review!.censorAssignmentId }))
  })
  it('cancels without making a submission request', async () => {
    const user = userEvent.setup()
    const submit = vi.spyOn(financeReviewApi, 'submit')
    renderActions()
    await user.click(screen.getByRole('button', { name: 'Submit for review' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(submit).not.toHaveBeenCalled()
  })
  it('fails closed while a cycle is pending or review metadata is absent', () => {
    const first = renderActions({ ...assigned, review: { ...assigned.review!, status: 'Submitted', canSubmit: false } })
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit for review' })).not.toBeInTheDocument()
    first.unmount()
    renderActions({ ...maintenanceReport, review: undefined })
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
  })
  it('offers resubmission after rejection and preserves the request identity after an uncertain result', async () => {
    const user = userEvent.setup()
    const report = { ...assigned, review: { ...assigned.review!, status: 'Rejected' as const, version: 'rejected-cycle', canSubmit: false, canResubmit: true } }
    const submit = vi.spyOn(financeReviewApi, 'submit').mockRejectedValue(new Error('offline'))
    const first = renderActions(report)
    await user.click(screen.getByRole('button', { name: 'Resubmit' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resubmit' }))
    await screen.findByRole('alert')
    const original = submit.mock.calls[0]
    first.unmount()
    renderActions(report)
    await user.click(screen.getByRole('button', { name: 'Resubmit' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resubmit' }))
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2))
    expect(submit.mock.calls[1]).toEqual(original)
  })
})
