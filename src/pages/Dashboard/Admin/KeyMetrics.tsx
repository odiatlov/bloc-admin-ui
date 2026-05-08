import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const KeyMetrics: React.FC = () => {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Key Metrics
      </Typography>
      <Box sx={{ display: 'flex', gap: 12 }}>
        <div>Monthly revenue: <strong>$12,400</strong></div>
        <div>Outstanding invoices: <strong>27</strong></div>
      </Box>
    </Box>
  )
}

export default KeyMetrics
