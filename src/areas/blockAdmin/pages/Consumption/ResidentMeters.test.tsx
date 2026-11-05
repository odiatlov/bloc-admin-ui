import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../tests/render'
import { apiGet } from '../../../../services/apiClient'
import type { ApartmentMeterHistory, ResidentWaterMeter } from '../../../../types/waterReadings'
import ResidentMeters from './ResidentMeters'

vi.mock('../../../../services/apiClient', () => ({ apiGet: vi.fn() }))

const meter: ResidentWaterMeter = {
  id: 'bathroom-meter', name: 'Baie', utilityType: 'HotWater', isActive: true,
  apartmentId: 'apartment-a', apartmentNumber: '3', blockName: 'B55 T2', staircaseName: 'A',
}
const readings = [317, 321, 325].map((value, index) => ({
  id: `bathroom-reading-${index}`, year: 2026, month: 8 + index, value, submittedAt: '2026-11-05T08:00:00', submittedBy: null,
}))
const history: ApartmentMeterHistory = {
  apartment: { id: meter.apartmentId, number: meter.apartmentNumber, blockId: 'block-a', blockName: meter.blockName, staircaseName: meter.staircaseName, householdCount: 2 },
  meters: [
    { id: 'kitchen-meter', name: 'Bucătărie', utilityType: 'ColdWater', isActive: true, readings: [] },
    { id: meter.id, name: meter.name, utilityType: meter.utilityType, isActive: true, readings },
  ],
}

describe('Resident meters', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset()
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('opens the chosen meter in the shared chart and history', async () => {
    const user = userEvent.setup()
    vi.mocked(apiGet).mockImplementation(async path => {
      if (path.startsWith('/resident-water/meters/page?')) return { items: [meter], pageNumber: 1, pageSize: 10, totalCount: 1 }
      if (path === '/resident-water/apartments/apartment-a/meters') return history
      throw new Error('Unexpected endpoint ' + path)
    })
    renderWithProviders(<MemoryRouter><ResidentMeters /></MemoryRouter>, { language: 'ro', mode: 'dark' })
    expect(screen.getByRole('status')).toBeInTheDocument()
    const details = (await screen.findAllByRole('button', { name: 'Vezi detalii' }))[0]
    await user.click(details)

    const drawer = await screen.findByRole('dialog', { name: 'Detalii contor' })
    const dialog = within(drawer)
    expect(await dialog.findByRole('combobox', { name: /Contor/ })).toHaveTextContent('Apă caldă - Baie')
    const chart = dialog.getByRole('img', { name: 'Indexul contorului (m³)' })
    expect(chart).toBeVisible()
    expect(within(chart).getAllByText(/^\d+$/).map(label => label.textContent))
      .toEqual(['316', '317', '318', '319', '320', '321', '322', '323', '324', '325', '326'])
    const gridLine = chart.querySelector('line')
    const points = chart.querySelectorAll('circle')
    expect(Number(points[0].getAttribute('cx')) - Number(gridLine?.getAttribute('x1'))).toBe(8)
    expect(Number(gridLine?.getAttribute('x2')) - Number(points[points.length - 1].getAttribute('cx'))).toBe(8)
    expect(dialog.getAllByText('octombrie 2026').length).toBeGreaterThan(0)
    expect(dialog.queryByText('Înregistrat de')).not.toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Înapoi' }))
    await waitFor(() => expect(drawer).not.toBeInTheDocument())
  })

  it('offers retry after failure and shows the empty state after a successful empty response', async () => {
    const user = userEvent.setup()
    vi.mocked(apiGet).mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValueOnce({ items: [], pageNumber: 1, pageSize: 10, totalCount: 0 })
    renderWithProviders(<MemoryRouter><ResidentMeters /></MemoryRouter>)

    const error = await screen.findByRole('alert')
    expect(screen.queryByText('No associated meters')).not.toBeInTheDocument()
    await user.click(within(error).getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('No associated meters')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
