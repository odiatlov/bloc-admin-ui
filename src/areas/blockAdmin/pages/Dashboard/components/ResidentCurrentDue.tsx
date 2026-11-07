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
          {(data.availableCredit ?? 0) > 0 && <Typography variant="body2" color="success.main">{t('financeCorrections.creditHelp', {
            amount: new Intl.NumberFormat(i18n.language, { style: 'currency', currency: data.currency }).format(data.availableCredit ?? 0),
          })}</Typography>}
          {(data.pendingCorrectionDebit ?? 0) > 0 && <Typography variant="body2" color="text.secondary">{t('financeCorrections.pendingDebitHelp', {
            amount: new Intl.NumberFormat(i18n.language, { style: 'currency', currency: data.currency }).format(data.pendingCorrectionDebit ?? 0),
          })}</Typography>}
          {(data.overpaidAmount ?? 0) > 0 && <Typography variant="body2" color="text.secondary">{t('financeCorrections.overpaidHelp', {
            amount: new Intl.NumberFormat(i18n.language, { style: 'currency', currency: data.currency }).format(data.overpaidAmount ?? 0),
          })}</Typography>}
        </> : null}
  </ContentCard>
}
export default ResidentCurrentDue
