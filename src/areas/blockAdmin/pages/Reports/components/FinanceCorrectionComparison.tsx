import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import type { FinanceCorrectionComparison as Comparison, MaintenanceReport } from '../../../../../types/finance'

export default function FinanceCorrectionComparison({ report }: { report: MaintenanceReport }) {
  const { t, i18n } = useTranslation()
  if (!report.correctsPublicationId) return null
  const money = (amount: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: report.currency }).format(amount)
  const columns: DataColumn<Comparison>[] = [
    { key: 'number', label: t('finance.billing.apartment'), cardRole: 'primary', render: row => row.number },
    { key: 'before', label: t('financeCorrections.before'), render: row => money(row.before) },
    { key: 'after', label: t('financeCorrections.after'), render: row => money(row.after) },
    { key: 'difference', label: t('finance.billing.difference'), render: row => money(row.difference) },
  ]
  return <Box sx={{ display: 'grid', gap: 1.5 }}>
    <Typography variant="h6">{t('financeCorrections.comparison')}</Typography>
    <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{t('financeCorrections.reason')}: {report.correctionReason}</Typography>
    <ResponsiveDataView paginationId={`correction-comparison-${report.id}`} ariaLabel={t('financeCorrections.comparison')}
      rows={report.correctionComparison ?? []} columns={columns} getRowId={row => row.apartmentId} />
  </Box>
}
