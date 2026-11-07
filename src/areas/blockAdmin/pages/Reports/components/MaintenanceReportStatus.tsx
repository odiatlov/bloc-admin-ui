import { useTranslation } from 'react-i18next'
import StatusChip from '../../../../../components/shared/StatusChip'
import type { FinanceReportSummary } from '../../../../../types/finance'

export default function MaintenanceReportStatus({ status }: Pick<FinanceReportSummary, 'status'>) {
  const { t } = useTranslation()
  const published = status === 'Published' || status === 'CorrectionPublished'
  return <StatusChip status={published ? 'approved' : status === 'Outdated' ? 'warning' : 'draft'}
    label={t(status === 'CorrectionPublished' ? 'financePublication.correctionPublished'
      : status === 'Published' ? 'financePublication.published' : `finance.billing.values.${status}`)} />
}
