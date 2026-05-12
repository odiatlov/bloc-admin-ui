import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatApartment, useCensorReviews } from '../../../hooks/useApartmentData'

const CensorDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { anomalyReviews, invoiceReviews, pendingCount, reviewItems } = useCensorReviews()

  const columns: DataColumn<(typeof reviewItems)[number]>[] = [
    { key: 'id', label: t('censor.columns.reviewItem'), render: (review) => review.id },
    { key: 'type', label: t('censor.columns.type'), render: (review) => t(`censor.type.${review.targetType}`) },
    { key: 'state', label: t('censor.columns.reviewState'), render: (review) => <StatusChip status={review.state} label={t(`status.review.${review.state}`)} /> },
    { key: 'requestedAt', label: t('censor.columns.requestedAt'), render: (review) => new Date(review.requestedAt).toLocaleString() },
  ]

  return (
    <Box sx={{ p: { xs: 0, sm: 2 }, display: 'grid', gap: 2 }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          {t('dashboard.censor.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dashboard.censor.description')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Button component={RouterLink} to="/admin/finance" variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('censor.actions.openQueue')}
          </Button>
          <Button component={RouterLink} to="/admin/consumption" variant="outlined" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('censor.actions.viewAnomalies')}
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('censor.metrics.pending')}
          </Typography>
          <Typography variant="h5">{pendingCount}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('censor.metrics.invoiceReviews')}
          </Typography>
          <Typography variant="h5">{invoiceReviews.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('censor.metrics.anomalies')}
          </Typography>
          <Typography variant="h5">{anomalyReviews.length}</Typography>
          {anomalyReviews[0] && (
            <Typography variant="caption" color="text.secondary">
              {formatApartment(anomalyReviews[0].anomaly.apartment)}
            </Typography>
          )}
        </Paper>
      </Box>

      <ResponsiveDataView ariaLabel={t('censor.tabs.history')} columns={columns} getRowId={(review) => review.id} rows={reviewItems} />
    </Box>
  )
}

export default CensorDashboard
