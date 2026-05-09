import React from 'react'
import OverviewCards from './OverviewCards'
import KeyMetrics from './KeyMetrics'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation()
  return (
    <section className="dashboard">
      <Typography variant="h4" gutterBottom>
        {t('dashboard.admin.title')}
      </Typography>

      <OverviewCards />
      <Box sx={{ mt: 2 }}>
        <KeyMetrics />
      </Box>
    </section>
  )
}

export default AdminDashboard
