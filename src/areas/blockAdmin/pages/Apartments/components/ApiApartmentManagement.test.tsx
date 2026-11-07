import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { useBlocks } from '../../../../../hooks/useBlocks'
import type { BlockOverview } from '../../../../../types/block'
import type { ApartmentResidentResponse, ApartmentResponse } from '../../../../../types/management'
import ApiApartmentManagement from './ApiApartmentManagement'

vi.mock('../../../../../hooks/useBlocks', () => ({ useBlocks: vi.fn() }))
vi.mock('../../../../../components/shared/PagedResponsiveDataView', async () => ({
  default: (await import('../../../../../components/shared/ResponsiveDataView')).default,
}))

const blockId = '55002b04-3ff9-4e87-8051-fb530791217f'
const apartmentId = '517548ae-cfb8-4bd4-96ca-6c1ffb52cb4c'
const stamp = '2026-11-03T10:00:00Z'
const block: BlockOverview = { id: blockId, name: 'Block A', displayName: 'Block A', administratorName: 'Admin',
  adminAccountId: 'df9e3afd-3375-4408-8be5-65744d1a05fe', hasStaircases: false, address: null, createdAt: stamp,
  apartmentCount: 1, residentCount: 1, staircaseCount: 0, totalInvoicesAmount: 0, totalPaymentsAmount: 0, unpaidBalance: 0 }
const apartment: ApartmentResponse = { id: apartmentId, blockId, blockName: block.name, staircaseId: null, staircaseName: null,
  number: '1', residentNames: 'Ion Resident', residentCount: 1, floor: 0, usableSqm: 50, setupStatus: 'configured',
  hasBoiler: false, createdAt: stamp, updatedAt: stamp }
const link: ApartmentResidentResponse = { id: '8c55e5bd-9eeb-477b-b860-3f086f418bda', apartmentId, blockId, blockName: block.name,
  personId: '141f800a-b1ec-4b85-a708-760de8a6d2d8', personFirstName: 'Ion', personLastName: 'Resident', personFullName: 'Ion Resident',
  personEmail: null, personPhone: null, personStatus: 'active', apartmentNumber: '1', staircaseId: null, staircaseName: null,
  livesHere: true, createdAt: stamp, updatedAt: stamp }
const response = (data: unknown, status = 200) => new Response(JSON.stringify({ success: status < 400, data, message: status < 400 ? '' : 'Not found' }),
  { status, headers: { 'Content-Type': 'application/json' } })
const getResidents = vi.fn(async () => response([link]))
const getWaterConfiguration = vi.fn(async () => response({ apartmentId, hasBoiler: false,
  zones: [{ locationType: 'Kitchen', name: 'Kitchen', coldWaterCount: 1, hotWaterCount: 1 }] }))

function renderPage() {
  return renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
    <ApiApartmentManagement />
  </RoleContext.Provider></MemoryRouter>)
}

beforeEach(() => {
  sessionStorage.clear()
  getResidents.mockReset().mockImplementation(async () => response([link]))
  getWaterConfiguration.mockReset().mockImplementation(async () => response({ apartmentId, hasBoiler: false,
    zones: [{ locationType: 'Kitchen', name: 'Kitchen', coldWaterCount: 1, hotWaterCount: 1 }] }))
  vi.mocked(useBlocks).mockReturnValue({ blocks: [block], totalBlocks: 1, error: null, isLoading: false,
    refresh: vi.fn(async () => true), search: '', setSearch: vi.fn() })
  // Exercise the real API clients: unexpected relationship URLs receive a 404.
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const endpoint = new URL(String(input), 'http://tests.invalid').pathname.replace(/^\/api(?=\/)/, '')
    if (endpoint === '/apartments') return response([apartment])
    if (endpoint === '/staircases' || endpoint === '/persons') return response([])
    if (endpoint === `/apartments/${apartmentId}/residents`) return getResidents()
    if (endpoint === `/apartments/${apartmentId}/water-meters/configuration`) return getWaterConfiguration()
    return response(null, 404)
  }))
})
afterEach(() => vi.unstubAllGlobals())

describe('apartment drawer resident loading', () => {
  it('requires an active meter before showing configured status', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const cold = await screen.findByRole('spinbutton', { name: 'Cold' })
    fireEvent.change(cold, { target: { value: '0' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Hot' }), { target: { value: '0' } })
    expect(screen.getByText('Add at least one consumption zone. Save to apply changes.')).toBeVisible()
    expect(screen.queryByText('Requirements met. Save to apply changes.')).not.toBeInTheDocument()
  })

  it('preserves individual water meter quantities through loading and saving', async () => {
    const user = userEvent.setup()
    getWaterConfiguration.mockResolvedValueOnce(response({ apartmentId, hasBoiler: false,
      zones: [{ locationType: 'Kitchen', name: 'Kitchen', coldWaterCount: 2, hotWaterCount: 0 }] }))
    const fallback = vi.mocked(fetch).getMockImplementation()!
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const endpoint = new URL(String(input), 'http://tests.invalid').pathname.replace(/^\/api(?=\/)/, '')
      if (endpoint === `/apartments/${apartmentId}` && init?.method === 'PATCH') return response(apartment)
      return fallback(input, init)
    })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    expect(await screen.findByRole('spinbutton', { name: 'Cold' })).toHaveValue(2)
    expect(screen.getByRole('spinbutton', { name: 'Hot' })).toHaveValue(0)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(true))
    const request = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'PATCH')![1]!
    expect(JSON.parse(String(request.body)).zones).toEqual([{ locationType: 'Kitchen', name: 'Kitchen', coldWaterCount: 2, hotWaterCount: 0 }])
  })

  it('keeps the apartment list mounted on failure, blocks edits and retries the canonical assignment endpoint', async () => {
    const user = userEvent.setup()
    getResidents.mockResolvedValueOnce(response(null, 404))
    renderPage()
    const table = await screen.findByRole('table', { hidden: true })
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(await screen.findByText('Assigned residents could not be loaded. Retry before changing this apartment or its assignments.')).toBeVisible()
    expect(table).toBeInTheDocument()
    expect(screen.queryByText('Apartments could not be loaded. Please try again.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.click(screen.getByRole('tab', { name: 'Assigned resident' }))
    expect(screen.queryByText('No assigned resident')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Assign' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('tab', { name: 'Assigned resident (1)' })).toBeVisible()
    expect(getResidents).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('tab', { name: 'Apartment Details' }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('ignores a late failure from the previously closed drawer', async () => {
    const user = userEvent.setup()
    let finish!: (value: Response) => void
    getResidents.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    await waitFor(() => expect(getResidents).toHaveBeenCalledOnce())
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    expect(await screen.findByRole('tab', { name: 'Assigned resident (1)' })).toBeVisible()
    await act(async () => { finish(response(null, 404)); await Promise.resolve() })
    expect(screen.queryByText('Assigned residents could not be loaded. Retry before changing this apartment or its assignments.')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Assigned resident (1)' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})
