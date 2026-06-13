import React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

type ActionBarProps = {
  title: string
  children: React.ReactNode
}

const ActionBar: React.FC<ActionBarProps> = ({ children, title }) => (
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

export default ActionBar
