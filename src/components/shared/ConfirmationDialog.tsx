import React from 'react'
import AppDialog from './AppDialog'

type ConfirmationDialogProps = {
  cancelLabel: string
  children: React.ReactNode
  confirmDisabled?: boolean
  confirmColor?: 'primary' | 'error'
  confirmLabel: string
  open: boolean
  pending?: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  cancelLabel,
  children,
  confirmDisabled = false,
  confirmColor = 'primary',
  confirmLabel,
  onCancel,
  onConfirm,
  open,
  pending,
  title,
}) => (
  <AppDialog
    cancelLabel={cancelLabel}
    confirmDisabled={confirmDisabled}
    confirmColor={confirmColor}
    confirmLabel={confirmLabel}
    maxWidth="xs"
    onCancel={onCancel}
    onConfirm={onConfirm}
    open={open}
    pending={pending}
    title={title}
  >
    {children}
  </AppDialog>
)

export default ConfirmationDialog
