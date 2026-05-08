import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const Consumption: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Consumption
      </Typography>
      <Typography>Utility readings and meter indexes (water, electricity, etc.).</Typography>
    </Box>
  )
}

export default Consumption
