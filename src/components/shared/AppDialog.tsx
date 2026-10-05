import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog, { type DialogProps } from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import IconButtonTooltip from './IconButtonTooltip'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import type { SxProps, Theme } from '@mui/material/styles'

type AppDialogProps = {
  cancelLabel: string
  children: React.ReactNode
  confirmDisabled?: boolean
  confirmLabel: string
  contentSx?: SxProps<Theme>
  dialogContentSx?: SxProps<Theme>
  hideCancelButton?: boolean
  showCloseButton?: boolean
  closeLabel?: string
  closeDisabled?: boolean
  backLabel?: string
  backDisabled?: boolean
  onBack?: () => void
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
  dialogContentSx,
  hideCancelButton = false,
  showCloseButton = false,
  closeLabel,
  closeDisabled = false,
  backLabel,
  backDisabled = false,
  onBack,
  maxWidth = 'sm',
  onCancel,
  onConfirm,
  open,
  title,
}) => (
  <Dialog open={open} onClose={onCancel} fullWidth maxWidth={maxWidth}>
    <DialogTitle sx={showCloseButton ? { display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5 } : undefined}>
      {showCloseButton ? <Box component="span" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{title}</Box> : title}
      {showCloseButton && <IconButtonTooltip title={closeLabel ?? cancelLabel}>
        <span><IconButton size="small" aria-label={closeLabel ?? cancelLabel} disabled={closeDisabled} onClick={onCancel}><CloseIcon /></IconButton></span>
      </IconButtonTooltip>}
    </DialogTitle>
    <DialogContent sx={dialogContentSx}>
      <Box sx={contentSx}>
        {children}
      </Box>
    </DialogContent>
    <DialogActions>
      {onBack && <Button startIcon={<ArrowBackIcon />} disabled={backDisabled} onClick={onBack} sx={{ mr: 'auto' }}>{backLabel}</Button>}
      {!hideCancelButton && <Button onClick={onCancel}>{cancelLabel}</Button>}
      <Button variant="contained" onClick={onConfirm} disabled={confirmDisabled}>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
)

export default AppDialog
