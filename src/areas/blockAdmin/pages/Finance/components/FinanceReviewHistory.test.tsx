import { screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { maintenanceReport, residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import type { FinanceReviewState } from '../../../../../types/financeReview'
import MaintenanceReportActions from '../../Reports/components/MaintenanceReportActions'
import FinanceReviewHistory from './FinanceReviewHistory'

const review: FinanceReviewState = { ...maintenanceReport.review!, status: 'Ready', censorRequired: true,
  version: '5e25e388-512d-4241-97d4-62e3c0cbfc8f:0db3f33b-0eca-44da-b46c-b17eb0b7c559',
  censorAssignmentId: 'c4069375-4291-4b15-a8cb-b29d0164077d',
  canPublish: false, canSubmit: false, canResubmit: true, history: [{
    id: '5e25e388-512d-4241-97d4-62e3c0cbfc8f', runId: 'a41538e3-2535-4f9b-aafd-b6bcde87b5df',
    revision: 1, cycle: 1, submittedAt: '2026-11-03T08:00:00Z', status: 'Rejected', rule: 'Individual', ruleVersion: 1,
    reviewers: [{ userId: '281f0bd3-0521-4804-a737-baf0da8cc210', assignmentId: 'c4069375-4291-4b15-a8cb-b29d0164077d' }],
    reason: 'Check the heating allocation', decidedAt: '2026-11-03T09:00:00Z', decidedByUserId: '281f0bd3-0521-4804-a737-baf0da8cc210',
  }] }

describe('ready revision with prior rejection history', () => {
  it.each([
    { language: 'en' as const, ready: 'Ready', rejected: 'Rejected', resubmit: 'Resubmit', publish: 'Publish' },
    { language: 'ro' as const, ready: 'Gata', rejected: 'Respins', resubmit: 'Retrimite', publish: 'Publică' },
  ])('shows a neutral current status and preserves the old rejection in $language', labels => {
    renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
      <FinanceReviewHistory review={review} />
      <MaintenanceReportActions report={{ ...maintenanceReport, review }} onExport={vi.fn()} onPublished={vi.fn()} />
    </RoleContext.Provider></MemoryRouter>, { language: labels.language })
    expect(screen.getByText(labels.ready).closest('.MuiChip-root')).toHaveClass('MuiChip-colorDefault')
    const history = within(screen.getByRole('table', { hidden: true }))
    expect(history.getByText(labels.rejected)).toBeInTheDocument()
    expect(history.getByText('Check the heating allocation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: labels.resubmit })).toBeEnabled()
    expect(screen.queryByRole('button', { name: labels.publish })).not.toBeInTheDocument()
  })
})
