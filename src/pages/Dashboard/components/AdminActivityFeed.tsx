import React from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

const items = [
  { textKey: 'invoiceGenerated', timeKey: 'twoHoursAgo' },
  { textKey: 'paymentReceived', timeKey: 'fourHoursAgo' },
  { textKey: 'waterReadingSubmitted', timeKey: 'oneDayAgo' }
]

const AdminActivityFeed: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">{t('dashboard.admin.activity.title')}</Typography>

      <Box sx={{ mt: 1 }}>
        {items.map((i, idx) => (
          <Box key={idx} sx={{ mb: 1 }}>
            <Typography variant="body2">{t(`dashboard.admin.activity.${i.textKey}`)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t(`dashboard.admin.activity.${i.timeKey}`)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default AdminActivityFeed
