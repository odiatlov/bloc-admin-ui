import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { residentContext } from '../../tests/financeFixtures'
import { renderWithProviders } from '../../tests/render'
import { RoleContext } from '../contexts/RoleContext'
import { waterReadingsApi } from '../services/waterReadingsApi'
import type { WaterConsumptionReportResponse } from '../types/waterReadings'
import { useWaterConsumptions } from './useWaterConsumptions'

const firstBlock = '00000000-0000-0000-0000-000000000101'
const secondBlock = '00000000-0000-0000-0000-000000000102'
const report: WaterConsumptionReportResponse = { blocks: [
  { id: firstBlock, name: 'First block', firstReadingPeriod: null, firstSubmissionPeriod: 202609 },
  { id: secondBlock, name: 'Second block', firstReadingPeriod: null, firstSubmissionPeriod: 202611 },
], rows: [] }

const Probe = () => {
  const water = useWaterConsumptions({ submissionPeriodsOnly: true, includeBaselinePeriod: true })
  return <>
    <output aria-label="Period">{water.period}</output>
    <output aria-label="Start">{water.minimumPeriod}</output>
    <output aria-label="Last month">{water.maximumPeriod}</output>
    <output aria-label="State">{water.loading ? 'Loading' : 'Ready'}</output>
    <button onClick={() => water.setBlockFilter(secondBlock)}>Second block</button>
  </>
}

const renderProbe = (savedPeriod: string) => {
  sessionStorage.setItem(JSON.stringify(['page-filters-v1', residentContext.account.id, 'Admin', '/admin/consumption', 'water.period']), JSON.stringify(savedPeriod))
  return renderWithProviders(<MemoryRouter initialEntries={['/admin/consumption']}>
    <RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}><Probe /></RoleContext.Provider>
  </MemoryRouter>)
}

beforeEach(() => {
  sessionStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 30, 12))
})
afterEach(() => vi.useRealTimers())

describe('consumption period bounds', () => {
  it('replaces a restored future month before requesting data', async () => {
    const load = vi.spyOn(waterReadingsApi, 'getConsumptions').mockResolvedValue(report)
    renderProbe('2026-11')
    await waitFor(() => expect(screen.getByLabelText('State')).toHaveTextContent('Ready'))
    expect(screen.getByLabelText('Period')).toHaveTextContent('2026-10')
    expect(screen.getByLabelText('Last month')).toHaveTextContent('2026-10')
    expect(load).toHaveBeenCalledWith(2026, 10, 'Admin')
    expect(load.mock.calls.every(([year, month]) => year === 2026 && month === 10)).toBe(true)
  })

  it('preserves the administrator baseline and adjusts the month when block scope changes', async () => {
    vi.spyOn(waterReadingsApi, 'getConsumptions').mockResolvedValue(report)
    renderProbe('2026-08')
    await waitFor(() => expect(screen.getByLabelText('State')).toHaveTextContent('Ready'))
    expect(screen.getByLabelText('Start')).toHaveTextContent('2026-08')
    expect(screen.getByLabelText('Period')).toHaveTextContent('2026-08')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Second block' }))
    await waitFor(() => expect(screen.getByLabelText('Period')).toHaveTextContent('2026-10'))
    expect(screen.getByLabelText('Start')).toHaveTextContent('2026-10')
    await waitFor(() => expect(screen.getByLabelText('State')).toHaveTextContent('Ready'))
  })

  it('finishes loading when submission settings begin after the current month', async () => {
    vi.spyOn(waterReadingsApi, 'getConsumptions').mockResolvedValue({ blocks: [
      { ...report.blocks[0], firstSubmissionPeriod: 202701 },
    ], rows: [] })
    renderProbe('2026-10')
    await waitFor(() => expect(screen.getByLabelText('State')).toHaveTextContent('Ready'))
    expect(screen.getByLabelText('Period')).toHaveTextContent('2026-10')
    expect(screen.getByLabelText('Start')).toHaveTextContent('2026-12')
  })
})
