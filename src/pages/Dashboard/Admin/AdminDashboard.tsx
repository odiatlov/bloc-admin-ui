import React from 'react'
import OverviewCards from './OverviewCards'
import KeyMetrics from './KeyMetrics'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const AdminDashboard: React.FC = () => {
  return (
    <section className="dashboard">
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <OverviewCards />
      <Box sx={{ mt: 2 }}>
        <KeyMetrics />
      </Box>
    </section>
  )
}

export default AdminDashboard
