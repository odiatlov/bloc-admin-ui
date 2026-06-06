import React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

type DashboardHeaderProps = {
  title: string
  description?: string
  context?: string
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ context, description, title }) => (
  <Box sx={{ display: 'grid', gap: 0.5 }}>
    <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' }, lineHeight: 1.16 }}>
      {title}
    </Typography>
    {(description || context) && (
      <Typography variant="body1" color="text.secondary">
        {description || context}
      </Typography>
    )}
    {description && context && (
      <Typography variant="caption" color="text.secondary">
        {context}
      </Typography>
    )}
  </Box>
)

type ActionBarProps = {
  title: string
  children: React.ReactNode
}

export const ActionBar: React.FC<ActionBarProps> = ({ children, title }) => (
  <Paper
    sx={{
      p: 1.5,
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: { xs: 'stretch', sm: 'center' },
      justifyContent: 'space-between',
      gap: 1.5,
      flexDirection: { xs: 'column', sm: 'row' },
    }}
  >
    <Typography variant="h6" sx={{ lineHeight: 1.35 }}>
      {title}
    </Typography>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      {children}
    </Box>
  </Paper>
)

type StatCardProps = {
  label: string
  value?: React.ReactNode
  secondary?: React.ReactNode
  badge?: React.ReactNode
  children?: React.ReactNode
}

export const StatCard: React.FC<StatCardProps> = ({ badge, children, label, secondary, value }) => (
  <Paper
    sx={{
      p: { xs: 1.5, sm: 2 },
      minHeight: { xs: 112, sm: 136 },
      height: '100%',
      boxSizing: 'border-box',
      display: 'grid',
      alignContent: 'space-between',
      gap: { xs: 1, sm: 1.25 },
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
      {label}
    </Typography>
    <Box sx={{ minWidth: 0 }}>
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
  </Paper>
)

type StatGridProps = {
  children: React.ReactNode
  columns?: { xs?: string; sm?: string; md?: string; lg?: string }
}

export const StatGrid: React.FC<StatGridProps> = ({ children, columns }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: columns ?? { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
      gridAutoRows: '1fr',
      gap: 2,
    }}
  >
    {children}
  </Box>
)

type ContentCardProps = {
  title: string
  children: React.ReactNode
  accent?: 'warning'
}

export const ContentCard: React.FC<ContentCardProps> = ({ accent, children, title }) => (
  <Paper
    sx={{
      p: 2.25,
      height: '100%',
      boxSizing: 'border-box',
      border: accent ? '1px solid' : undefined,
      borderColor: accent === 'warning' ? 'warning.main' : undefined,
      borderLeftWidth: accent ? 4 : undefined,
    }}
  >
    <Typography variant="h6" sx={{ mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Paper>
)

export const DashboardPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gap: 2 }}>
    {children}
  </Box>
)
