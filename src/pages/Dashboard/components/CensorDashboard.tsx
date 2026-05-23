import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatApartment, formatFriendlyDateTime, useCensorReviews } from '../../../hooks/useApartmentData'

type CensorMetricCardProps = {
  label: string
  value: number
  detail?: React.ReactNode
}

const CensorMetricCard: React.FC<CensorMetricCardProps> = ({ detail, label, value }) => (
  <Paper sx={{ p: 2, height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 1.25 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h5" sx={{ alignSelf: 'end' }}>
      {value}
    </Typography>
    <Box sx={{ minHeight: 18 }}>
      {detail}
    </Box>
  </Paper>
)

const CensorDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { anomalyReviews, invoiceReviews, pendingCount, reviewItems } = useCensorReviews()
  const formatReviewDate = (value: string) => formatFriendlyDateTime(value, { atLabel: t('common.at'), todayLabel: t('common.today') })

  const columns: DataColumn<(typeof reviewItems)[number]>[] = [
    { key: 'id', label: t('censor.columns.reviewItem'), render: (review) => review.id },
    { key: 'type', label: t('censor.columns.type'), render: (review) => t(`censor.type.${review.targetType}`) },
    { key: 'state', label: t('censor.columns.reviewState'), render: (review) => <StatusChip status={review.state} label={t(`status.review.${review.state}`)} /> },
    { key: 'requestedAt', label: t('censor.columns.requestedAt'), render: (review) => formatReviewDate(review.requestedAt) },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          {t('dashboard.censor.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.censor.description')}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('dashboard.censor.quickActions')}
        </Typography>
        <Paper sx={{ p: 1.5, width: '100%', boxSizing: 'border-box', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button component={RouterLink} to="/admin/finance" variant="contained">
            {t('censor.actions.openQueue')}
          </Button>
          <Button component={RouterLink} to="/admin/consumption" variant="outlined">
            {t('censor.actions.viewAnomalies')}
          </Button>
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gridAutoRows: '1fr', gap: 2 }}>
        <CensorMetricCard label={t('censor.metrics.pending')} value={pendingCount} />
        <CensorMetricCard label={t('censor.metrics.invoiceReviews')} value={invoiceReviews.length} />
        <CensorMetricCard
          label={t('censor.metrics.anomalies')}
          value={anomalyReviews.length}
          detail={anomalyReviews[0] && (
            <Typography variant="caption" color="text.secondary">
              {formatApartment(anomalyReviews[0].anomaly.apartment)}
            </Typography>
          )}
        />
      </Box>

      <ResponsiveDataView ariaLabel={t('censor.tabs.history')} columns={columns} getRowId={(review) => review.id} rows={reviewItems} />
    </Box>
  )
}

export default CensorDashboard
