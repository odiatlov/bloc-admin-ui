import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

const Metric = ({ label, value, trend }: any) => (
  <Paper sx={{ p: 2, flex: 1 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>

    <Typography variant="h6" sx={{ mt: 1 }}>
      {value}
    </Typography>

    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
      <TrendingUpIcon fontSize="small" color="success" />
      <Typography variant="caption" sx={{ ml: 0.5 }}>
        {trend}
      </Typography>
    </Box>
  </Paper>
)

const KeyMetrics: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Key Insights
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Metric label="Monthly Revenue" value="$12,400" trend="+8% vs last month" />
        <Metric label="Outstanding" value="27 invoices" trend="+3 new this week" />
        <Metric label="Collection Rate" value="94%" trend="Stable" />
      </Box>
    </Box>
  )
}

export default KeyMetrics