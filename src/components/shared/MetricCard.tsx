import React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

type MetricCardProps = {
  badge?: React.ReactNode
  children?: React.ReactNode
  icon?: React.ReactNode
  label: string
  secondary?: React.ReactNode
  value?: React.ReactNode
}

const MetricCard: React.FC<MetricCardProps> = ({ badge, children, icon, label, secondary, value }) => (
  <Paper
    sx={{
      p: { xs: 1.5, sm: 2 },
      minHeight: children || badge ? { xs: 112, sm: 136 } : { xs: 92, sm: 104 },
      height: '100%',
      boxSizing: 'border-box',
      display: 'grid',
      alignContent: children || badge ? 'space-between' : 'start',
      gap: children || badge ? { xs: 1, sm: 1.25 } : 1,
    }}
  >
    <Box sx={{ display: 'grid', gap: 0.75, minWidth: 0 }}>
      {icon && (
        <Box sx={{ minHeight: 24, display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
    <Box sx={{ minWidth: 0, alignSelf: children || badge ? undefined : 'end' }}>
      {value !== undefined && value !== null && (
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '1.875rem' }, fontWeight: 700, lineHeight: 1.12 }}>
          {value}
        </Typography>
      )}
      {secondary && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: children ? 1.25 : 0, mt: value ? 0.75 : 0 }}>
          {secondary}
        </Typography>
      )}
      {children}
    </Box>
    {badge && (
      <Box
        sx={{
          minHeight: { xs: 20, sm: 24 },
          display: 'flex',
          alignItems: 'end',
          minWidth: 0,
          '& .MuiChip-root': {
            maxWidth: '100%',
          },
          '& .MuiChip-label': {
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        }}
      >
        {badge}
      </Box>
    )}
  </Paper>
)

export default MetricCard
