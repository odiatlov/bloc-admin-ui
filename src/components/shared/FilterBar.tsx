import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

interface FilterBarProps {
  actions?: ReactNode
  children: ReactNode
}

const FilterBar = ({ actions, children }: FilterBarProps) => (
  <Paper
    sx={{
      p: 2,
      display: { xs: 'grid', sm: 'flex' },
      gap: 1.5,
      alignItems: { sm: 'center' },
      justifyContent: { sm: 'space-between' },
    }}
  >
    <Box
      sx={{
        display: { xs: 'grid', sm: 'flex' },
        gap: 1.5,
        alignItems: { sm: 'center' },
        flexWrap: { sm: 'wrap' },
        minWidth: 0,
        width: { xs: '100%', sm: 'auto' },
        '& > *': { width: { xs: '100%', sm: 'auto' } },
      }}
    >
      {children}
    </Box>

    {actions && (
      <Box
        sx={{
          display: { xs: 'grid', sm: 'flex' },
          gap: 1,
          alignItems: { sm: 'center' },
          justifyContent: { sm: 'flex-end' },
          flexWrap: { sm: 'wrap' },
          ml: { sm: 'auto' },
          width: { xs: '100%', sm: 'auto' },
          '& > *': { width: { xs: '100%', sm: 'auto' } },
        }}
      >
        {actions}
      </Box>
    )}
  </Paper>
)

export default FilterBar
