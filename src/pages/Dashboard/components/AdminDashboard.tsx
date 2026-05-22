import React from 'react'
import OverviewCards from './AdminOverviewCards'
import KeyMetrics from './AdminKeyMetrics'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import OpacityIcon from '@mui/icons-material/Opacity'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { useNavigate } from 'react-router-dom'
import ActivityFeed from './AdminActivityFeed'
import AlertsPanel from './AdminAlertsPanel'

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const actions = [
    { label: t('dashboard.admin.options.addInvoice'), path: '/admin/finance', icon: <ReceiptLongIcon /> },
    { label: t('dashboard.admin.options.addWaterReading'), path: '/admin/consumption', icon: <OpacityIcon /> },
    { label: t('dashboard.admin.options.exportExcel'), path: '/admin/reports', icon: <FileDownloadIcon /> },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          {t('dashboard.admin.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.admin.description')}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        {actions.map((action) => (
          <Paper key={action.path} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {action.icon}
              <Typography sx={{ fontWeight: 700 }}>{action.label}</Typography>
            </Box>
            <Button size="small" variant="contained" onClick={() => navigate(action.path)}>
              {t('dashboard.admin.options.open')}
            </Button>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          <OverviewCards />
          <KeyMetrics />
        </Box>

        <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
          <ActivityFeed />
          <AlertsPanel />
        </Box>
      </Box>
    </Box>
  )
}

export default AdminDashboard
