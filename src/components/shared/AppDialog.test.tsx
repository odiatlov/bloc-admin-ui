import type { ComponentProps } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import AppDialog from './AppDialog'

function setup(overrides: Partial<ComponentProps<typeof AppDialog>> = {}, mode: 'light' | 'dark' = 'light') {
  const props = {
    open: true,
    title: 'Review changes',
    cancelLabel: 'Cancel',
    confirmLabel: 'Save',
    children: <p>Review the apartment details.</p>,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  }
  renderWithProviders(<AppDialog {...props} />, { mode })
  return props
}

describe('AppDialog', () => {
  it.each(['light', 'dark'] as const)('confirms through the visible action in %s mode', async (mode) => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = setup({}, mode)

    expect(screen.getByRole('dialog', { name: 'Review changes' })).toHaveTextContent('Review the apartment details.')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('cancels through the cancel button and Escape', async () => {
    const user = userEvent.setup()
    const { onCancel, onConfirm } = setup()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('blocks every action and Escape while a request is pending', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const { onCancel, onConfirm } = setup({ pending: true, showCloseButton: true, closeLabel: 'Close dialog', onBack, backLabel: 'Back' })

    for (const name of ['Save', 'Cancel', 'Close dialog', 'Back']) {
      const button = screen.getByRole('button', { name })
      expect(button).toBeDisabled()
    }
    await user.keyboard('{Escape}')
    expect(onCancel).not.toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onBack).not.toHaveBeenCalled()
  })

  it('disables confirmation while keeping cancellation available', async () => {
    const user = userEvent.setup()
    const { onCancel, onConfirm } = setup({ confirmDisabled: true })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('supports the back and close controls when the cancel button is hidden', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const { onCancel } = setup({ hideCancelButton: true, showCloseButton: true, closeLabel: 'Close dialog', onBack, backLabel: 'Back' })
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(onBack).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('does not expose a closed dialog', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
