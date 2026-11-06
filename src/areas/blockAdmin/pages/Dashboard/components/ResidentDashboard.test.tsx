import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { renderWithProviders } from '../../../../../../tests/render'
import { RoleContext } from '../../../../../contexts/RoleContext'
import * as portal from '../../../../../hooks/useApartmentData'
import * as water from '../../../../../hooks/useResidentWaterIndex'
import { residentFinanceApi } from '../../../../../services/residentFinanceApi'
import type { ResidentWaterMeterRow } from '../../../../../types/waterReadings'
import ResidentDashboard from './ResidentDashboard'

const reading = (utilityType: string, month: number, value: number): ResidentWaterMeterRow => ({
  id: `00000000-0000-0000-0000-00000000${utilityType === 'ColdWater' ? '01' : '02'}${String(month).padStart(2, '0')}`,
  meterId: utilityType === 'ColdWater' ? '00000000-0000-0000-0000-000000000100' : '00000000-0000-0000-0000-000000000103',
  apartmentId: '00000000-0000-0000-0000-000000000101',
  apartmentNumber: '12', blockId: '00000000-0000-0000-0000-000000000102', blockName: 'Fixture block', staircaseName: null,
  utilityType, locationType: 'Kitchen', meterName: 'Kitchen', year: 2026, month, value, householdCount: 2, submittedAt: '2026-10-29T12:00:00Z',
})

const renderDashboard = (rows: ResidentWaterMeterRow[], language: 'en' | 'ro', mode: 'light' | 'dark') => {
  vi.spyOn(water, 'useResidentWaterIndex').mockReturnValue({
    apartments: [], error: null, hasConfiguredSubmissionDate: true, readingEligibility: {}, loading: false,
    meters: [], month: 10, refresh: vi.fn(), resident: null, rows, setPeriod: vi.fn(), year: 2026,
  })
  return renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, account: { ...residentContext.account, personId: undefined } }}>
    <ResidentDashboard />
  </RoleContext.Provider></MemoryRouter>, { language, mode })
}

const portalFixture: ReturnType<typeof portal.useResidentPortal> = {
  apartment: undefined, apartments: [], apartmentsByBlock: {}, currentBalance: 0, familyLabel: '', financeAvailable: true,
  lastPayment: undefined, resident: undefined, residentInvoices: [], residentPayments: [], residentReadings: [], role: 'Resident',
}

beforeEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  vi.spyOn(portal, 'useResidentPortal').mockReturnValue(portalFixture)
})

describe('resident water dashboard units', () => {
  it.each([['en', 'light'], ['ro', 'dark']] as const)('adds m³ to both indices and consumption in %s/%s', (language, mode) => {
    renderDashboard([reading('ColdWater', 9, 100), reading('ColdWater', 10, 104), reading('HotWater', 9, 50), reading('HotWater', 10, 52)], language, mode)
    expect(screen.getByText('100 m³ → 104 m³')).toBeVisible()
    expect(screen.getByText('50 m³ → 52 m³')).toBeVisible()
    expect(screen.getByText('4 m³')).toBeVisible()
    expect(screen.getByText('2 m³')).toBeVisible()
  })

  it('keeps missing indices as text and adds units to a baseline without a previous reading', () => {
    renderDashboard([reading('ColdWater', 10, 100)], 'en', 'light')
    expect(screen.getByText('100 m³')).toBeVisible()
    expect(screen.getByText('0 m³')).toBeVisible()
    expect(screen.getAllByText('No registered index yet')).toHaveLength(2)
  })
})

it('shows real expense publications in the recent announcements list', async () => {
  vi.mocked(portal.useResidentPortal).mockReturnValue({ ...portalFixture, financeAvailable: false })
  const summary = vi.spyOn(residentFinanceApi, 'summary').mockResolvedValue({
    currentAmountDue: 40, currency: 'RON', unpaidBillCount: 1, totalBillCount: 1,
    recentPublications: [{ id: '00000000-0000-0000-0000-000000000110', type: 'reportPublished',
      occurredAt: '2026-11-05T08:00:00Z', blockName: 'Bloc A', year: 2026, month: 10 }],
  })
  renderDashboard([], 'ro', 'dark')
  const announcement = await screen.findByText('Raport de cheltuieli publicat pentru octombrie 2026 · Bloc A')
  expect(announcement.closest('li')).toHaveTextContent('10:00')
  expect(screen.queryByText(/Revizia liftului/)).not.toBeInTheDocument()
  expect(summary).toHaveBeenCalledOnce()
})
