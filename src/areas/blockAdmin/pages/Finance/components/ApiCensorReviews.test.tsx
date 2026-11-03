import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeReviewApi } from '../../../../../services/financeReviewApi'
import ApiCensorReviews from './ApiCensorReviews'
import type { FinanceReviewList } from '../../../../../types/financeReview'

const renderPage = () => renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Censor' }}><ApiCensorReviews /></RoleContext.Provider></MemoryRouter>)
beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(financeReviewApi, 'blocks').mockResolvedValue([{ id: '947813d5-20ed-4b9d-85e4-175a9fc4b1dc', name: 'Assigned block', hasStaircases: false, staircases: [] }])
  vi.spyOn(financeReviewApi, 'periods').mockResolvedValue(['2026-09'])
  vi.spyOn(financeReviewApi, 'list').mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10 })
})
describe('backend censor review queue', () => {
  it('discards a late response after switching identities', async () => {
    let resolveOld!: (value: FinanceReviewList) => void
    vi.mocked(financeReviewApi.list).mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve }))
    const view = renderPage()
    await waitFor(() => expect(financeReviewApi.list).toHaveBeenCalledOnce())
    view.rerender(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Censor',
      account: { ...residentContext.account, id: '70f4caed-3be4-41f5-9cb5-341ac2096752' } }}><ApiCensorReviews /></RoleContext.Provider></MemoryRouter>)
    expect(await screen.findByText('No reviews match this selection')).toBeVisible()
    await act(async () => resolveOld({ items: [{ id: '51131ae1-7da5-4471-9c15-34161da20e84', runId: 'e63502c7-8321-4920-a829-106a47aee0dc', blockId: '5a88457c-2ede-4e71-a897-8d3f3da53727', blockName: 'Old scope data',
      year: 2026, month: 9, revision: 1, cycle: 1, status: 'Submitted', submittedAt: '2026-11-03T08:00:00Z', totalDue: 5 }], totalCount: 1, pageNumber: 1, pageSize: 10 }))
    expect(screen.queryByText('Old scope data')).not.toBeInTheDocument()
  })
  it('shows an error with retry independently of a successful empty queue', async () => {
    const user = userEvent.setup()
    vi.mocked(financeReviewApi.list).mockRejectedValueOnce(new Error('offline'))
    renderPage()
    expect(await screen.findByText(/request could not be completed/)).toBeVisible()
    expect(screen.queryByText('No reviews match this selection')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry|try again/i }))
    expect(await screen.findByText('No reviews match this selection')).toBeVisible()
    await waitFor(() => expect(financeReviewApi.list).toHaveBeenCalledTimes(2))
  })
  it('links the exact submission and uses server pagination data', async () => {
    const user = userEvent.setup()
    vi.mocked(financeReviewApi.list).mockResolvedValue({ items: [{ id: '75655156-5cbb-41ef-bfb4-4824e6270faf', runId: '76df6377-6e91-4103-bf8b-41f53456a1ec', blockId: '947813d5-20ed-4b9d-85e4-175a9fc4b1dc', blockName: 'Assigned block',
      year: 2026, month: 9, revision: 3, cycle: 2, status: 'Resubmitted', submittedAt: '2026-11-03T08:00:00Z', totalDue: 100 }], totalCount: 21, pageNumber: 1, pageSize: 10 })
    renderPage()
    const table = await screen.findByRole('table', { hidden: true })
    expect(within(table).getByText('Resubmitted')).toBeInTheDocument()
    // The desktop table is hidden at JSDOM's layout size, so its links have no computed accessible name.
    expect(within(table).getByLabelText('Preview report', { selector: 'a' })).toHaveAttribute('href', '/admin/reviews/75655156-5cbb-41ef-bfb4-4824e6270faf')
    expect(screen.getByRole('status')).toHaveTextContent('1–10 of 21')
    expect(financeReviewApi.list).toHaveBeenCalledWith(expect.objectContaining({ includeHistory: false, pageNumber: 1 }), expect.any(AbortSignal))
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() => expect(financeReviewApi.list).toHaveBeenCalledWith(expect.objectContaining({ includeHistory: false, pageNumber: 2 }), expect.any(AbortSignal)))
  })
})
