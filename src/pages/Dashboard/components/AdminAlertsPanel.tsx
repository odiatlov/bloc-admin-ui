import React from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useTranslation } from 'react-i18next'
import { useConsumption, useFinance } from '../../../hooks/useApartmentData'

const AdminAlertsPanel: React.FC = () => {
  const { t } = useTranslation()
  const { invoices: enrichedInvoices } = useFinance()
  const { readings } = useConsumption()
  const overdueInvoices = enrichedInvoices.filter((invoice) => invoice.status === 'overdue').length
  const unusualConsumption = readings.filter((reading) => reading.usageValue > 20).length
  const alerts = [
    t('dashboard.admin.alerts.overdueInvoices', { count: overdueInvoices }),
    t('dashboard.admin.alerts.unusualConsumption', { count: unusualConsumption }),
    t('dashboard.admin.alerts.cashWorkflow'),
  ]

  return (
    <Paper sx={{ p: 2.25, height: '100%', border: '1px solid', borderColor: 'warning.main', borderLeftWidth: 4 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {t('dashboard.admin.alerts.title')}
      </Typography>

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {alerts.map((alert) => (
          <Box key={alert} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <WarningAmberIcon fontSize="small" color="warning" sx={{ mt: 0.25 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
              {alert}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default AdminAlertsPanel
