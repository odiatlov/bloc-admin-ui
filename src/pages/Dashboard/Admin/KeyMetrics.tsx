import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useTranslation } from 'react-i18next'

type MetricProps = {
  label: string
  value: string
  trend: string
}

const Metric: React.FC<MetricProps> = ({ label, value, trend }) => (
  <Paper sx={{ p: 2 }}>
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
  const {t} = useTranslation()
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('dashboard.admin.keyMetrics.title')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        <Metric
          label={t('dashboard.admin.keyMetrics.monthlyRevenue')}
          value="$12,400"
          trend={t('dashboard.admin.keyMetrics.monthlyRevenueTrend')}
        />
        <Metric
          label={t('dashboard.admin.keyMetrics.outstanding')}
          value={t('dashboard.admin.keyMetrics.outstandingValue', { count: 27 })}
          trend={t('dashboard.admin.keyMetrics.outstandingTrend')}
        />
        <Metric
          label={t('dashboard.admin.keyMetrics.collectionRate')}
          value="94%"
          trend={t('dashboard.admin.keyMetrics.collectionStable')}
        />
      </Box>
    </Box>
  )
}

export default KeyMetrics
