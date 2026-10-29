import { CircularProgress, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import { useResidentFinanceSummary } from '../../../../../hooks/useResidentFinance'
import { StatCard } from './DashboardSystem'

const ResidentCurrentDue = () => {
  const { t, i18n } = useTranslation()
  const summary = useResidentFinanceSummary()
  const data = summary.data
  return <StatCard label={t('dashboard.resident.currentDue')}>
    {summary.loading ? <CircularProgress size={24} aria-label={t('finance.billing.loading')} />
      : summary.error ? <LoadErrorState onRetry={summary.refresh} helperText={t('residentFinance.summaryError')} />
        : data ? <>
          <Typography variant="h5">{new Intl.NumberFormat(i18n.language, { style: 'currency', currency: data.currency }).format(data.currentAmountDue)}</Typography>
          <Typography variant="body2" color="text.secondary">{t(data.totalBillCount ? 'residentFinance.unpaidCount' : 'residentFinance.noPublishedBills', { count: data.unpaidBillCount })}</Typography>
        </> : null}
  </StatCard>
}
export default ResidentCurrentDue
