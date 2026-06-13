import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'

type ConfirmationDialogProps = {
  cancelLabel: string
  children: React.ReactNode
  confirmLabel: string
  open: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  cancelLabel,
  children,
  confirmLabel,
  onCancel,
  onConfirm,
  open,
  title,
}) => (
  <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>{cancelLabel}</Button>
      <Button variant="contained" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
)

export default ConfirmationDialog
