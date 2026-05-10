import React from 'react'
import OverviewCards from './AdminOverviewCards'
import KeyMetrics from './AdminKeyMetrics'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import ActivityFeed from './AdminActivityFeed'
import AlertsPanel from './AdminAlertsPanel'

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box sx={{ p: { xs: 0, sm: 2 } }}>
      {/* HEADER */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          {t('dashboard.admin.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dashboard.admin.description')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('dashboard.admin.options.addInvoice')}
          </Button>
          <Button variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('dashboard.admin.options.addWaterReading')}
          </Button>
          <Button variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('dashboard.admin.options.exportExcel')}
          </Button>
        </Box>
      </Paper>

      {/* MAIN GRID */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' },
          gap: 2,
        }}
      >
        <Box>
          <OverviewCards />
          <Box sx={{ mt: 2 }}>
            <KeyMetrics />
          </Box>
        </Box>

        {/* RIGHT SIDEBAR */}
        <Box>
          <ActivityFeed />
          <AlertsPanel />
        </Box>
      </Box>
    </Box>
  )
}

export default AdminDashboard
