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
      gap: 2,
      alignItems: { sm: 'center' },
      justifyContent: { sm: 'space-between' },
      flexWrap: { sm: 'wrap', lg: 'nowrap' },
      maxWidth: '100%',
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        display: { xs: 'grid', sm: 'flex' },
        gap: 2,
        alignItems: { sm: 'center' },
        justifyContent: { sm: 'flex-start' },
        flex: { sm: '1 1 auto' },
        flexWrap: { sm: 'wrap' },
        minWidth: 0,
        width: { xs: '100%', sm: 'auto' },
        '& > *': {
          flex: { sm: '0 0 auto' },
          minWidth: { xs: '100%', sm: 0 },
          width: { xs: '100%', sm: 'auto' },
        },
        '& .MuiFormControl-root': {
          flex: { sm: '0 0 180px' },
          maxWidth: { xs: '100%', sm: 180 },
          minWidth: { xs: '100%', sm: 160 },
          width: { xs: '100%', sm: 180 },
        },
        '& .MuiTextField-root': {
          flex: { sm: '0 0 280px' },
          maxWidth: { xs: '100%', sm: 280 },
          width: { xs: '100%', sm: 280 },
        },
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
          flex: { sm: '0 0 auto' },
          flexWrap: { sm: 'nowrap' },
          ml: { sm: 'auto' },
          minWidth: 0,
          width: { xs: '100%', sm: 'auto' },
          '& > *': {
            whiteSpace: 'nowrap',
            width: { xs: '100%', sm: 'auto' },
          },
        }}
      >
        {actions}
      </Box>
    )}
  </Paper>
)

export default FilterBar
