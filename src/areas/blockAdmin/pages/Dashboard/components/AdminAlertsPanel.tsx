import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useTranslation } from 'react-i18next'
import { useConsumption, useFinance } from '../../../../../hooks/useApartmentData'
import { ContentCard } from './DashboardSystem'

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
    <ContentCard title={t('dashboard.admin.alerts.title')} accent="warning">
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
    </ContentCard>
  )
}

export default AdminAlertsPanel
