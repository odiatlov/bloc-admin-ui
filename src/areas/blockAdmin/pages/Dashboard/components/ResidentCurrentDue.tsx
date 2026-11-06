import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import LoadingState from '../../../../../components/shared/LoadingState'
import type { useResidentFinanceSummary } from '../../../../../hooks/useResidentFinance'
import { ContentCard } from './DashboardSystem'

const ResidentCurrentDue = ({ summary }: { summary: ReturnType<typeof useResidentFinanceSummary> }) => {
  const { t, i18n } = useTranslation()
  const data = summary.data
  return <ContentCard title={t('dashboard.resident.currentDue')}>
    {summary.loading ? <LoadingState variant="compact" label={t('finance.billing.loading')} />
      : summary.error ? <LoadErrorState onRetry={summary.refresh} helperText={t('residentFinance.summaryError')} />
        : data ? <>
          <Typography variant="h5">{new Intl.NumberFormat(i18n.language, { style: 'currency', currency: data.currency }).format(data.currentAmountDue)}</Typography>
          <Typography variant="body2" color="text.secondary">{t(data.totalBillCount ? 'residentFinance.unpaidCount' : 'residentFinance.noPublishedBills', { count: data.unpaidBillCount })}</Typography>
        </> : null}
  </ContentCard>
}
export default ResidentCurrentDue
