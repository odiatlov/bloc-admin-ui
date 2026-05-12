import React from 'react'
import Chip from '@mui/material/Chip'
import type { ChipProps } from '@mui/material/Chip'

type StatusChipProps = {
  label: string
  status: string
}

const getColor = (status: string): ChipProps['color'] => {
  if (['paid', 'active', 'current', 'deposited', 'normal', 'approved'].includes(status)) return 'success'
  if (['unpaid', 'due', 'verified', 'warning', 'pending', 'needs_changes'].includes(status)) return 'warning'
  if (['overdue', 'inactive', 'unverified', 'critical', 'rejected'].includes(status)) return 'error'
  return 'default'
}

const StatusChip: React.FC<StatusChipProps> = ({ label, status }) => (
  <Chip label={label} color={getColor(status)} size="small" variant="outlined" />
)

export default StatusChip
