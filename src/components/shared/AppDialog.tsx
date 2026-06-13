import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog, { type DialogProps } from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import type { SxProps, Theme } from '@mui/material/styles'

type AppDialogProps = {
  cancelLabel: string
  children: React.ReactNode
  confirmDisabled?: boolean
  confirmLabel: string
  contentSx?: SxProps<Theme>
  maxWidth?: DialogProps['maxWidth']
  open: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}

const AppDialog: React.FC<AppDialogProps> = ({
  cancelLabel,
  children,
  confirmDisabled = false,
  confirmLabel,
  contentSx,
  maxWidth = 'sm',
  onCancel,
  onConfirm,
  open,
  title,
}) => (
  <Dialog open={open} onClose={onCancel} fullWidth maxWidth={maxWidth}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Box sx={contentSx}>
        {children}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>{cancelLabel}</Button>
      <Button variant="contained" onClick={onConfirm} disabled={confirmDisabled}>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
)

export default AppDialog
