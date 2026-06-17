import React from 'react'
import AppDialog from './AppDialog'

type ConfirmationDialogProps = {
  cancelLabel: string
  children: React.ReactNode
  confirmDisabled?: boolean
  confirmLabel: string
  open: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  cancelLabel,
  children,
  confirmDisabled = false,
  confirmLabel,
  onCancel,
  onConfirm,
  open,
  title,
}) => (
  <AppDialog
    cancelLabel={cancelLabel}
    confirmDisabled={confirmDisabled}
    confirmLabel={confirmLabel}
    maxWidth="xs"
    onCancel={onCancel}
    onConfirm={onConfirm}
    open={open}
    title={title}
  >
    {children}
  </AppDialog>
)

export default ConfirmationDialog
