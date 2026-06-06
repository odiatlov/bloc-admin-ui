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
      p: { xs: 1.25, sm: 2 },
      minHeight: children || badge ? { xs: 112, sm: 136 } : { xs: 72, sm: 104 },
      height: '100%',
      boxSizing: 'border-box',
      maxWidth: '100%',
      overflow: 'hidden',
      display: 'grid',
      alignContent: children || badge ? 'space-between' : 'start',
      gap: children || badge ? { xs: 1, sm: 1.25 } : { xs: 0.75, sm: 1 },
    }}
  >
    <Box
      sx={{
        minWidth: 0,
        maxWidth: '100%',
        display: 'grid',
        alignContent: children || badge ? 'space-between' : 'start',
        gap: children || badge ? { xs: 1, sm: 1.25 } : 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600, lineHeight: 1.25, overflowWrap: 'anywhere' }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ minWidth: 0, display: 'grid', gap: secondary || children ? 0.75 : 0 }}>
        <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '2rem', sm: '2.375rem' },
                },
              }}
            >
              {icon}
            </Box>
          )}
          {value !== undefined && value !== null && (
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem', lg: '1.875rem' },
                fontWeight: 700,
                lineHeight: 1.12,
                minWidth: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </Typography>
          )}
        </Box>
        {secondary && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: children ? 1.25 : 0 }}>
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
    </Box>
  </Paper>
)

export default MetricCard
