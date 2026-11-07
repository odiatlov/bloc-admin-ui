import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import type { FinanceCorrectionComparison as Comparison, MaintenanceReport } from '../../../../../types/finance'
import FinanceSection from '../../Finance/components/FinanceSection'
import MaintenanceReportStatus from './MaintenanceReportStatus'

type ComparisonRow = Comparison & { staircase: string; contact: string; order: number }

export default function FinanceCorrectionComparison({ report }: { report: MaintenanceReport }) {
  const { t, i18n } = useTranslation()
  if (!report.correctsPublicationId) return null
  const money = (amount: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: report.currency }).format(amount)
  const apartments = new Map(report.sheets.flatMap(sheet => sheet.rows.map(row => ({ apartmentId: row.apartmentId,
    staircase: sheet.staircaseId ? t('finance.billing.staircaseName', { staircase: sheet.name }) : sheet.name,
    contact: row.contactName || '—',
  }))).map((apartment, order) => [apartment.apartmentId, { ...apartment, order }]))
  const rows: ComparisonRow[] = (report.correctionComparison ?? []).map(row => ({ ...row,
    staircase: apartments.get(row.apartmentId)?.staircase ?? '—', contact: apartments.get(row.apartmentId)?.contact ?? '—',
    order: apartments.get(row.apartmentId)?.order ?? Number.MAX_SAFE_INTEGER })).sort((a, b) => a.order - b.order)
  const difference = (amount: number) => `${amount > 0 ? '+' : ''}${money(amount)}`
  const value = (amount: number, changed = false) => <Typography component="span" variant="body2" sx={{
    whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: changed ? 700 : undefined,
    color: changed ? amount > 0 ? 'warning.main' : amount < 0 ? 'success.main' : 'text.secondary' : undefined,
  }}>{changed ? difference(amount) : money(amount)}</Typography>
  const columns: DataColumn<ComparisonRow>[] = [
    { key: 'staircase', label: t('finance.billing.staircase'), cardRole: 'metadata', render: row => row.staircase },
    { key: 'number', label: t('finance.billing.apartment'), cardRole: 'primary', render: row => row.number },
    { key: 'contact', label: t('finance.billing.contact'), cardRole: 'secondary', render: row => row.contact },
    { key: 'before', label: t('financeCorrections.before'), align: 'right', render: row => value(row.before) },
    { key: 'after', label: t('financeCorrections.after'), align: 'right', render: row => value(row.after) },
    { key: 'difference', label: t('finance.billing.difference'), align: 'right', render: row => value(row.difference, true) },
  ]
  const totals = [
    { label: t('financeCorrections.totalBefore'), amount: rows.reduce((sum, row) => sum + row.before, 0) },
    { label: t('financeCorrections.totalAfter'), amount: rows.reduce((sum, row) => sum + row.after, 0) },
    { label: t('financeCorrections.totalDifference'), amount: rows.reduce((sum, row) => sum + row.difference, 0), changed: true },
  ]
  return <FinanceSection title={t('financeCorrections.comparison')}
    description={<>{t('financeCorrections.reason')}: {report.correctionReason}</>}
    actions={<MaintenanceReportStatus status={report.status} />}>
    <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
      {totals.map(total => <Box key={total.label} sx={{ minWidth: 0 }}>
        <Typography component="dt" variant="body2" color="text.secondary">{total.label}</Typography>
        <Typography component="dd" sx={{ m: 0, mt: 0.5 }}>{value(total.amount, total.changed)}</Typography>
      </Box>)}
    </Box>
    <ResponsiveDataView paginationId={`correction-comparison-${report.id}`} ariaLabel={t('financeCorrections.comparison')}
      rows={rows} columns={columns} getRowId={row => row.apartmentId} />
  </FinanceSection>
}
