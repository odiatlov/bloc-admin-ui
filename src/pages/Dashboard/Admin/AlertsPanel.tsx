import React from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useTranslation } from 'react-i18next'

const alerts = [
  'unpaidInvoices',
  'missingReadings',
  'overdueApartment'
]

const AlertsPanel: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">{t('dashboard.admin.alerts.title')}</Typography>

      <Box sx={{ mt: 1 }}>
        {alerts.map((a, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <WarningAmberIcon fontSize="small" color="warning" />
            <Typography variant="body2">{t(`dashboard.admin.alerts.${a}`)}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default AlertsPanel
