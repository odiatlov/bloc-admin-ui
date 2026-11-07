import React from 'react'
import { useTranslation } from 'react-i18next'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import LoadingState from '../../../../../components/shared/LoadingState'
import type { FinanceDashboard } from '../../../../../types/finance'
import { ContentCard, DashboardActivityList } from './DashboardSystem'

const demoActivity = [
  { textKey: 'invoiceGenerated', timeKey: 'twoHoursAgo' },
  { textKey: 'paymentReceived', timeKey: 'fourHoursAgo' },
  { textKey: 'waterReadingSubmitted', timeKey: 'oneDayAgo' }
]

type Props = {
  activity: FinanceDashboard['activity']
  loading: boolean
  error: boolean
  onRetry: () => void
  isDemo: boolean
}

const AdminActivityFeed: React.FC<Props> = ({ activity, loading, error, onRetry, isDemo }) => {
  const { t, i18n } = useTranslation()
  const month = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' })
  const items = isDemo ? demoActivity.map(item => ({
    id: item.textKey, title: t(`dashboard.admin.activity.${item.textKey}`),
    secondary: t(`dashboard.admin.activity.${item.timeKey}`),
  })) : activity.map(item => ({
    id: `${item.type}:${item.id}`,
    title: t(item.type === 'reportPublished' ? 'financePublication.dashboardEvent'
      : item.type === 'correctionPublished' ? 'financeCorrections.dashboardEvent' : 'dashboard.admin.activity.cashRecorded', {
      block: item.blockName, apartment: item.apartmentNumber,
      period: month.format(new Date(item.year, item.month - 1, 1)),
    }),
    occurredAt: item.occurredAt,
  }))
  return (
    <ContentCard title={t('dashboard.admin.activity.title')}>
      {loading ? <LoadingState variant="compact" label={t('finance.billing.loading')} />
        : error ? <LoadErrorState inline helperText={t('dashboard.admin.financeLoadError')} onRetry={onRetry} />
          : <DashboardActivityList items={items} emptyText={t('dashboard.admin.activity.empty')} />}
    </ContentCard>
  )
}

export default AdminActivityFeed
