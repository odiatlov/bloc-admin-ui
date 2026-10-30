import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { renderWithProviders } from '../../../../../../tests/render'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { apartmentsApi } from '../../../../../services/apartmentsApi'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'
import ReportGenerator from './ReportGenerator'

beforeEach(() => {
  sessionStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 30, 12))
  vi.spyOn(apartmentsApi, 'getAll').mockResolvedValue([])
})
afterEach(() => vi.useRealTimers())

describe('report month filter', () => {
  it('uses the consumption calendar bounds, applies only on OK, and retains All months', async () => {
    const load = vi.spyOn(waterReadingsApi, 'getConsumptions').mockResolvedValue({ blocks: [
      { id: '00000000-0000-0000-0000-000000000101', name: 'Fixture block', firstReadingPeriod: 202608, firstSubmissionPeriod: 202609 },
    ], rows: [] })
    renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Censor' }}>
      <ReportGenerator />
    </RoleContext.Provider></MemoryRouter>)
    const user = userEvent.setup()
    await waitFor(() => expect(screen.getByRole('button', { name: /choose date/i })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    expect(screen.getByRole('radio', { name: 'August' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'September' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'October' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'November' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: 'September' }))
    expect(load).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'OK' }))
    await waitFor(() => expect(load).toHaveBeenCalledWith(2026, 9, 'Censor'))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'All months' })).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('button', { name: /choose date/i })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'All months' }))
    await waitFor(() => expect(load).toHaveBeenCalledWith(null, null, 'Censor'))
  })
})
