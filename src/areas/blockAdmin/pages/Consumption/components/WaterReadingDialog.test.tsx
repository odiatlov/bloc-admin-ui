import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'
import type { WaterMeterReadingResponse } from '../../../../../types/waterReadings'
import WaterReadingDialog, { type ReadingDialogApartment } from './WaterReadingDialog'

const apartmentId = 'ec15c491-b3df-4a29-bb38-b85dfe9eaf33'
const coldMeterId = '22d70dc0-341c-4f91-877f-c1135704cad5'
const hotMeterId = '2b07a42a-0b7e-4c96-bda8-07be0a2d24b7'

const readingResponse: WaterMeterReadingResponse = {
  id: 'ac126bf6-3a60-4f90-a585-6b733ed655a7', apartmentWaterMeterId: coldMeterId, apartmentId,
  blockId: 'b5ca91e7-5a44-4b9d-a7fc-e92d52c3828f', year: 2026, month: 10, value: 110,
  householdCount: 2, readingDate: '2026-10-27', submittedAt: '2026-10-27T10:00:00Z',
  submittedByType: 'Admin', submittedByUserId: null, submittedByAdminAccountId: null, note: null,
  meterUtilityType: 'cold_water', meterLocationType: 'kitchen', meterName: 'Kitchen cold meter',
  apartmentNumber: '1', blockName: 'Test block', staircaseName: null,
}

function setup(overrides: Partial<ReadingDialogApartment> = {}) {
  const apartment: ReadingDialogApartment = {
    id: apartmentId, label: 'Apartment 1', householdCount: 2, declaredHouseholdCount: 2,
    canSubmitReadings: true, readingSetupIssue: null,
    meters: [{ id: coldMeterId, name: 'Kitchen cold meter', utilityType: 'cold_water', previous: 100, current: null }],
    ...overrides,
  }
  const createReading = vi.spyOn(waterReadingsApi, 'createReading').mockResolvedValue(readingResponse)
  const updateOccupants = vi.spyOn(waterReadingsApi, 'updateOccupants').mockResolvedValue(true)
  const onClose = vi.fn()
  renderWithProviders(<WaterReadingDialog apartments={[apartment]} year={2026} month={10} title="Add water reading" onClose={onClose} />)
  return { createReading, updateOccupants, onClose }
}

describe('WaterReadingDialog', () => {
  it('requires a reading and rejects a reading below the previous index', async () => {
    const user = userEvent.setup()
    const { createReading } = setup()
    const save = screen.getByRole('button', { name: 'Save' })
    const input = screen.getByRole('spinbutton', { name: 'Kitchen cold meter' })
    expect(save).toBeDisabled()
    await user.type(input, '99')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(save).toBeDisabled()
    expect(createReading).not.toHaveBeenCalled()
  })

  it.each(['-1', '1.5', '2147483648'])('rejects invalid occupant count %s', async (count) => {
    const user = userEvent.setup()
    const { createReading } = setup()
    await user.type(screen.getByRole('spinbutton', { name: 'Kitchen cold meter' }), '110')
    const occupants = screen.getByRole('spinbutton', { name: /Number of occupants/ })
    await user.clear(occupants)
    await user.type(occupants, count)
    expect(occupants).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(createReading).not.toHaveBeenCalled()
  })

  it('keeps an ineligible apartment locked and explains the setup issue', () => {
    const { createReading, updateOccupants } = setup({ canSubmitReadings: false, readingSetupIssue: 'apartmentNotConfigured' })
    expect(screen.getByRole('alert')).toHaveTextContent('Ask the administrator')
    expect(screen.getByRole('spinbutton', { name: 'Kitchen cold meter' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: /Number of occupants/ })).toBeDisabled()
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()
    expect(createReading).not.toHaveBeenCalled()
    expect(updateOccupants).not.toHaveBeenCalled()
  })

  it('submits the numeric reading, selected period and occupant count', async () => {
    const user = userEvent.setup()
    const { createReading, updateOccupants, onClose } = setup()
    await user.type(screen.getByRole('spinbutton', { name: 'Kitchen cold meter' }), '110.25')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(createReading).toHaveBeenCalledExactlyOnceWith({ apartmentWaterMeterId: coldMeterId, year: 2026, month: 10, value: 110.25, householdCount: 2 })
    expect(updateOccupants).not.toHaveBeenCalled()
    await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true))
  })

  it('preserves the entered reading after a failed request and allows retry', async () => {
    const user = userEvent.setup()
    const { createReading, onClose } = setup()
    createReading.mockRejectedValueOnce(new Error('Reading service unavailable'))
    const input = screen.getByRole('spinbutton', { name: 'Kitchen cold meter' })
    await user.type(input, '110')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Reading service unavailable')).toBeInTheDocument()
    expect(input).toHaveValue(110)
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true))
    expect(createReading).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Reading service unavailable')).not.toBeInTheDocument()
  })

  it('prevents duplicate submission and cancellation while the request is pending', async () => {
    const user = userEvent.setup()
    const { createReading, onClose } = setup()
    let resolveRequest!: (response: WaterMeterReadingResponse) => void
    createReading.mockImplementationOnce(() => new Promise((resolve) => { resolveRequest = resolve }))
    await user.type(screen.getByRole('spinbutton', { name: 'Kitchen cold meter' }), '110')
    await user.dblClick(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'Kitchen cold meter' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
    expect(createReading).toHaveBeenCalledOnce()
    await act(async () => { resolveRequest(readingResponse) })
    expect(onClose).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('does not resubmit an already saved meter after a partial failure', async () => {
    const user = userEvent.setup()
    const { createReading, onClose } = setup({ meters: [
      { id: coldMeterId, name: 'Kitchen cold meter', utilityType: 'cold_water', previous: 100, current: null },
      { id: hotMeterId, name: 'Kitchen hot meter', utilityType: 'hot_water', previous: 50, current: null },
    ] })
    createReading.mockResolvedValueOnce(readingResponse).mockRejectedValueOnce(new Error('Hot meter failed'))
    await user.type(screen.getByRole('spinbutton', { name: 'Kitchen cold meter' }), '110')
    await user.type(screen.getByRole('spinbutton', { name: 'Kitchen hot meter' }), '60')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Hot meter failed')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Kitchen cold meter' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'Kitchen hot meter' })).toHaveValue(60)
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true))
    expect(createReading).toHaveBeenCalledTimes(3)
    expect(createReading.mock.calls.map(([request]) => request.apartmentWaterMeterId)).toEqual([coldMeterId, hotMeterId, hotMeterId])
  })

  it('updates only occupants when all meter readings are already saved', async () => {
    const user = userEvent.setup()
    const { createReading, updateOccupants, onClose } = setup({ meters: [
      { id: coldMeterId, name: 'Kitchen cold meter', utilityType: 'cold_water', previous: 100, current: 110 },
    ] })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    const count = screen.getByRole('spinbutton', { name: /Number of occupants/ })
    await user.clear(count)
    await user.type(count, '3')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(updateOccupants).toHaveBeenCalledExactlyOnceWith(apartmentId, 2026, 10, 3)
    expect(createReading).not.toHaveBeenCalled()
    await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true))
  })

  it('does not allow saving an apartment without meters', () => {
    setup({ meters: [], declaredHouseholdCount: null })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('cancels an untouched form without writing data', async () => {
    const user = userEvent.setup()
    const { createReading, updateOccupants, onClose } = setup()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledExactlyOnceWith(false)
    expect(createReading).not.toHaveBeenCalled()
    expect(updateOccupants).not.toHaveBeenCalled()
  })
})
