import React from 'react'
import OverviewCards from './OverviewCards'
import KeyMetrics from './KeyMetrics'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import ActivityFeed from './ActivityFeed'
import AlertsPanel from './AlertsPanel'

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box sx={{ p: 2 }}>
      {/* HEADER */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h4">
          {t('dashboard.admin.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of your association activity today
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Button variant="contained">+ Invoice</Button>
          <Button variant="contained">+ Water Reading</Button>
          <Button variant="contained">Export Excel</Button>
        </Box>
      </Paper>

      {/* MAIN GRID */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
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