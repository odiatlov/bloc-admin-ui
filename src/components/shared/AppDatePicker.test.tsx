import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import AppDatePicker from './AppDatePicker'

describe('confirmed month selection', () => {
  it.each(['light', 'dark'] as const)('enforces the configured start and current-month limit in %s mode', async (mode) => {
    const onChange = vi.fn()
    renderWithProviders(<AppDatePicker label="Month" monthOnly confirmOnAccept value="2026-10"
      minDate="2026-08-01" maxDate="2026-10-01" onChange={onChange} />, { mode })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    expect(screen.getByRole('radio', { name: 'July' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'August' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'October' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'November' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'December' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: 'September' }))
    expect(onChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    expect(screen.getByRole('radio', { name: 'October' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('radio', { name: 'August' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-08')
  })

  it('uses Romanian month names and confirmation labels', async () => {
    const onChange = vi.fn()
    renderWithProviders(<AppDatePicker label="Lună" monthOnly confirmOnAccept value="2026-10"
      minDate="2026-09-01" maxDate="2026-10-01" onChange={onChange} />, { language: 'ro' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /selectați data/i }))
    expect(screen.getByRole('radio', { name: /^noiembrie$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anulare' })).toBeVisible()
    await user.click(screen.getByRole('radio', { name: /^septembrie$/i }))
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-09')
  })

  it.each([
    ['en', 'light', 'All months', /choose date/i],
    ['ro', 'dark', 'Toate lunile', /selectați data/i],
  ] as const)('offers All months only inside the picker in %s/%s', async (language, mode, allMonths, openLabel) => {
    const onChange = vi.fn()
    renderWithProviders(<AppDatePicker label="Month" monthOnly confirmOnAccept allowAllMonths value="2026-10"
      minDate="2026-08-01" maxDate="2026-10-01" onChange={onChange} />, { language, mode })
    const user = userEvent.setup()
    expect(screen.queryByRole('button', { name: allMonths })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: openLabel }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: allMonths }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
