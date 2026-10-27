import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ConfirmationDialog from './ConfirmationDialog'

it('calls onConfirm when the user confirms', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn()

  render(
    <ConfirmationDialog
      open
      title="Delete item"
      cancelLabel="Cancel"
      confirmLabel="Delete"
      onCancel={vi.fn()}
      onConfirm={onConfirm}
    >
      Are you sure?
    </ConfirmationDialog>,
  )

  expect(screen.getByRole('dialog')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Delete' }))

  expect(onConfirm).toHaveBeenCalledTimes(1)
})

it('cancels without confirming', async () => {
  const user = userEvent.setup()
  const onCancel = vi.fn()
  const onConfirm = vi.fn()
  render(<ConfirmationDialog open title="Delete item" cancelLabel="Cancel" confirmLabel="Delete" onCancel={onCancel} onConfirm={onConfirm}>Are you sure?</ConfirmationDialog>)

  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onCancel).toHaveBeenCalledOnce()
  expect(onConfirm).not.toHaveBeenCalled()
})

it('blocks confirmation when the parent disables it', () => {
  const onConfirm = vi.fn()
  render(<ConfirmationDialog open confirmDisabled title="Delete item" cancelLabel="Cancel" confirmLabel="Delete" onCancel={vi.fn()} onConfirm={onConfirm}>Are you sure?</ConfirmationDialog>)

  expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
})
