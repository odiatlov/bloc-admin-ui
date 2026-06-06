import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../components/shared/EmptyState'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatApartment, formatFriendlyDateTime, useCensorReviews } from '../../../hooks/useApartmentData'
import { ActionBar, ContentCard, DashboardHeader, DashboardPage, StatCard, StatGrid } from './DashboardSystem'

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
    <DashboardPage>
      <DashboardHeader title={t('dashboard.censor.title')} description={t('dashboard.censor.description')} />

      <ActionBar title={t('dashboard.censor.quickActions')}>
        <Button startIcon={<FactCheckIcon />} component={RouterLink} to="/admin/finance" variant="contained">
          {t('censor.actions.openQueue')}
        </Button>
        <Button startIcon={<VisibilityIcon />} component={RouterLink} to="/admin/consumption" variant="outlined">
          {t('censor.actions.viewAnomalies')}
        </Button>
      </ActionBar>

      <StatGrid columns={{ xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }}>
        <StatCard label={t('censor.metrics.pending')} value={pendingCount} />
        <StatCard label={t('censor.metrics.invoiceReviews')} value={invoiceReviews.length} />
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
          <StatCard
            label={t('censor.metrics.anomalies')}
            value={anomalyReviews.length}
            secondary={anomalyReviews[0] ? formatApartment(anomalyReviews[0].anomaly.apartment) : undefined}
          />
        </Box>
      </StatGrid>

      <ContentCard title={t('censor.tabs.history')}>
        <ResponsiveDataView
          ariaLabel={t('censor.tabs.history')}
          columns={columns}
          emptyState={(
            <EmptyState
              actionLabel={t('censor.actions.openQueue')}
              actionTo="/admin/finance"
              headline={t('emptyState.headline', { information: t('emptyState.information.reviews') })}
              helperText={t('emptyState.helper.reviews')}
            />
          )}
          getRowId={(review) => review.id}
          rows={reviewItems}
        />
      </ContentCard>
    </DashboardPage>
  )
}

export default CensorDashboard
