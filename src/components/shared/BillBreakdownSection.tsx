import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'

type Props = { title: string; amount?: string; children?: ReactNode; compact?: boolean }

export default function BillBreakdownSection({ title, amount, children, compact = false }: Props) {
  return <Paper variant="outlined" sx={{ p: compact ? 1.5 : 2, display: 'grid', gap: compact ? 0.5 : 1, minWidth: 0 }}>
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
      <Typography component="h3" variant={compact ? 'subtitle2' : 'h6'} sx={{ overflowWrap: 'anywhere', minWidth: 0 }}>{title}</Typography>
      {amount !== undefined && <Typography variant="body2" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{amount}</Typography>}
    </Box>
    {children}
  </Paper>
}
