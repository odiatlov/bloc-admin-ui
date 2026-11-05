import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTranslation } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { useResidentWaterIndex } from '../../../../../hooks/useResidentWaterIndex'
import { apiGet } from '../../../../../services/apiClient'
import ResidentWaterIndexSection from './ResidentWaterIndexSection'

vi.mock('../../../../../hooks/useResidentWaterIndex', () => ({ useResidentWaterIndex: vi.fn() }))
vi.mock('../../../../../services/apiClient', () => ({ apiGet: vi.fn() }))

function ResidentWaterIndexWithLanguageSwitch() {
  const { i18n } = useTranslation()
  return <>
    <button onClick={() => void i18n.changeLanguage('ro')}>Română</button>
    <ResidentWaterIndexSection />
  </>
}

it('formats saved reading months using the current UI language', async () => {
  const user = userEvent.setup()
  vi.mocked(useResidentWaterIndex).mockReturnValue({
    apartments: [{ linkId: 'link-a', apartmentId: 'apartment-a', apartmentNumber: '3', blockId: 'block-a', blockName: 'B55 T2',
      staircaseId: null, staircaseName: null, livesHere: true, householdCount: 0 }],
    error: null, hasConfiguredSubmissionDate: true, readingEligibility: {}, loading: false, meters: [],
    month: 11, year: 2026, resident: null, rows: [], refresh: vi.fn(), setPeriod: vi.fn(),
  })
  vi.mocked(apiGet).mockResolvedValue({
    items: [{ id: 'summary-a', apartmentId: 'apartment-a', year: 2026, month: 11,
      householdCount: 0, coldPreviousTotal: null, coldTotal: null, coldConsumption: null,
      hotPreviousTotal: null, hotTotal: null, hotConsumption: null, missingCount: 1, submittedCount: 0, totalCount: 1 }],
    pageNumber: 1, pageSize: 10, totalCount: 1,
  })
  renderWithProviders(<MemoryRouter><ResidentWaterIndexWithLanguageSwitch /></MemoryRouter>)

  expect((await screen.findAllByText('November 2026')).length).toBeGreaterThan(0)
  await user.click(screen.getByRole('button', { name: 'Română' }))
  expect((await screen.findAllByText('noiembrie 2026')).length).toBeGreaterThan(0)
  expect(screen.queryByText('November 2026')).not.toBeInTheDocument()
})
