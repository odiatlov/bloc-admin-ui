import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

const KeyMetrics: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('dashboard.admin.keyMetrics', 'Key Metrics')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 12 }}>
        <div>{t('dashboard.admin.monthlyRevenue', { defaultValue: 'Monthly revenue:' })} <strong>$12,400</strong></div>
        <div>{t('dashboard.admin.outstandingInvoices', { defaultValue: 'Outstanding invoices:' })} <strong>27</strong></div>
      </Box>
    </Box>
  )
}

export default KeyMetrics
