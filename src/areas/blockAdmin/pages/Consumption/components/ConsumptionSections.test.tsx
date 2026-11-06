import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { renderWithProviders } from '../../../../../../tests/render'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'
import type { WaterConsumptionRow } from '../../../../../types/waterReadings'
import ConsumptionSections from './ConsumptionSections'

vi.mock('../../../../../components/shared/PagedResponsiveDataView', () => ({
  default: ({ query }: { query: { staircaseId?: string } }) =>
    <output aria-label="Staircase query">{query.staircaseId ?? 'all'}</output>,
}))

const blocks = [
  { id: '00000000-0000-0000-0000-000000000101', name: 'First', firstReadingPeriod: null, firstSubmissionPeriod: null },
  { id: '00000000-0000-0000-0000-000000000102', name: 'Second', firstReadingPeriod: null, firstSubmissionPeriod: null },
]
const rows: WaterConsumptionRow[] = blocks.map((block, index) => ({
  id: `00000000-0000-0000-0000-00000000030${index}`,
  apartment: {
    id: `00000000-0000-0000-0000-00000000030${index}`, blockId: block.id, blockName: block.name,
    staircaseId: `00000000-0000-0000-0000-00000000020${index}`, staircaseName: 'A', number: '1', householdCount: 2,
  },
  canSubmitReadings: true, readingSetupIssue: null, householdCount: 2, hasMeters: false, meters: [],
  usage: null, status: 'noMeters', canRemind: false, reminderSent: false,
}))

beforeEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

describe('consumption staircase filter', () => {
  it.each(['Admin', 'Censor'] as const)('passes the selected staircase to pagination for %s and resets it on block change', async role => {
    vi.spyOn(waterReadingsApi, 'getConsumptions').mockResolvedValue({ blocks, rows })
    renderWithProviders(<MemoryRouter initialEntries={['/admin/consumption']}>
      <RoleContext.Provider value={{ ...residentContext, role }}>
        <ConsumptionSections mode={role === 'Admin' ? 'admin' : 'censor'} />
      </RoleContext.Provider>
    </MemoryRouter>)
    const user = userEvent.setup()
    const staircase = screen.getByRole('combobox', { name: /^Staircase/ })
    await waitFor(() => expect(staircase).not.toHaveAttribute('aria-disabled', 'true'))
    await user.click(staircase)
    await user.click(screen.getByRole('option', { name: 'First / Staircase A' }))
    expect(screen.getByLabelText('Staircase query')).toHaveTextContent(rows[0].apartment.staircaseId!)
    await user.click(screen.getByRole('combobox', { name: /^Block/ }))
    await user.click(screen.getByRole('option', { name: 'Block Second' }))
    await waitFor(() => expect(screen.getByLabelText('Staircase query')).toHaveTextContent('all'))
  })
})
