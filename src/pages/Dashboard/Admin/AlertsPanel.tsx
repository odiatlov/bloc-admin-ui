import React from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

const alerts = [
  '3 unpaid invoices due today',
  '2 missing water readings',
  '1 overdue apartment'
]

const AlertsPanel: React.FC = () => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Alerts</Typography>

      <Box sx={{ mt: 1 }}>
        {alerts.map((a, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <WarningAmberIcon fontSize="small" color="warning" />
            <Typography variant="body2">{a}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default AlertsPanel