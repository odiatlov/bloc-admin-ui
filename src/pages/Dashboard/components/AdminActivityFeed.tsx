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
    <Paper sx={{ p: 2.25, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {t('dashboard.admin.activity.title')}
      </Typography>

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {items.map((i, idx) => (
          <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '12px minmax(0, 1fr)', gap: 1.25, alignItems: 'start' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: '0.5rem', boxShadow: (theme) => `0 0 0 4px ${theme.palette.action.hover}` }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                {t(`dashboard.admin.activity.${i.textKey}`)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t(`dashboard.admin.activity.${i.timeKey}`)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default AdminActivityFeed
