import React from 'react'
import { usePageFilter } from '../../../../../hooks/usePageFilter'
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PreviewIcon from '@mui/icons-material/Preview'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../../../components/shared/EmptyState'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { useFinanceBlocks, useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import { financeApi } from '../../../../../services/financeApi'
import type { FinanceReportSummary } from '../../../../../types/finance'
import FinanceExportDialog from './FinanceExportDialog'

const GeneratedReportsList: React.FC = () => {
  const { t, i18n } = useTranslation()
  const identity = useFinanceIdentity()
  const blocks = useFinanceBlocks()
  const [blockId, setBlockId] = usePageFilter('generatedReports.block', '')
  const [period, setPeriod] = usePageFilter('generatedReports.period', '')
  const [history, setHistory] = usePageFilter('generatedReports.history', false)
  const [page, setPage] = usePageFilter('generatedReports.page', 1)
  const [retry, setRetry] = React.useState(0)
  const [state, setState] = React.useState<{ key: string; rows: FinanceReportSummary[]; count: number; error: string | null }>()
  const [exportId, setExportId] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (blocks.loading || blocks.error || !blockId || blocks.blocks.some(block => block.id === blockId)) return
    const timer = window.setTimeout(() => { setBlockId(''); setPage(1) }, 0)
    return () => window.clearTimeout(timer)
  }, [blocks.loading, blocks.error, blocks.blocks, blockId, setBlockId, setPage])
  const key = `${identity}:${blockId}:${period}:${history}:${page}:${retry}`
  React.useEffect(() => {
    const abort = new AbortController()
    const [year, month] = period.split('-').map(Number)
    financeApi.reports({ blockId, ...(year && month ? { year, month } : {}), includeHistory: history, pageNumber: page }, abort.signal).then((result) => {
      if (!abort.signal.aborted) setState({ key, rows: result.items, count: result.totalCount, error: null })
    }).catch((error) => { if (!abort.signal.aborted) setState({ key, rows: [], count: 0, error: error.message }) })
    return () => abort.abort()
  }, [blockId, history, key, page, period])
  const columns: DataColumn<FinanceReportSummary>[] = [
    { key: 'block', label: t('finance.billing.block'), cardRole: 'primary', render: (row) => row.blockName },
    { key: 'period', label: t('finance.billing.billingMonth'), cardRole: 'secondary', render: (row) => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(row.year, row.month - 1, 1)) },
    { key: 'revision', label: t('finance.billing.revisionLabel'), render: (row) => row.revision },
    { key: 'status', label: t('finance.billing.status'), cardRole: 'status', render: (row) => <Chip size="small" color={row.status === 'Outdated' ? 'warning' : 'default'} label={t(`finance.billing.values.${row.status}`)} /> },
    { key: 'generated', label: t('finance.billing.generatedAt'), render: (row) => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.generatedAt)) },
    { key: 'total', label: t('finance.billing.totalDue'), render: (row) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'RON' }).format(row.totalDue) },
    { key: 'actions', label: t('common.actions'), cardRole: 'actions', actions: (row) => [
      { id: 'preview', label: t('finance.billing.preview'), icon: <PreviewIcon />, to: `/admin/reports/maintenance/${row.id}`, priority: 2 },
      { id: 'export', label: t('finance.billing.exportExcel'), icon: <FileDownloadIcon />, onClick: () => setExportId(row.id), priority: 1 },
    ] },
  ]
  const current = state?.key === key ? state : undefined
  return <Box sx={{ display: 'grid', gap: 2 }}>
    <Typography variant="h6">{t('finance.billing.generatedReports')}</Typography>
    <Typography color="text.secondary" variant="body2">{t('finance.billing.generatedReportsHelp')}</Typography>
    <FilterBar>
      <TextField select size="small" label={t('finance.billing.block')} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} value={blockId} disabled={blocks.loading} onChange={(event) => { setBlockId(event.target.value); setPage(1) }}><MenuItem value="">{t('common.all')}</MenuItem>{blocks.blocks.map((block) => <MenuItem key={block.id} value={block.id}>{block.name}</MenuItem>)}</TextField>
      <AppDatePicker monthOnly confirmOnAccept label={t('finance.billing.billingMonth')} value={period} onChange={(value) => { setPeriod(value); setPage(1) }} />
      <Button disabled={!period} onClick={() => { setPeriod(''); setPage(1) }}>{t('finance.billing.allMonths')}</Button>
      <FormControlLabel label={t('finance.billing.showHistory')} control={<Checkbox checked={history} onChange={(event) => { setHistory(event.target.checked); setPage(1) }} />} />
    </FilterBar>
    {blocks.error && <Alert severity="warning">{blocks.error}</Alert>}
    {exportId && <FinanceExportDialog key={`${identity}:${exportId}`} reportId={exportId} onClose={() => setExportId(null)} />}
    {!current ? <CircularProgress aria-label={t('finance.billing.loading')} /> : current.error ? <LoadErrorState helperText={current.error} onRetry={() => setRetry((value) => value + 1)} /> : <ResponsiveDataView paginationId="generated-maintenance-reports" paginationResetKey={`${identity}:${blockId}:${period}:${history}`} rows={current.rows} columns={columns} getRowId={(row) => row.id} ariaLabel={t('finance.billing.generatedReports')} serverPagination={{ page, totalCount: current.count, onPageChange: setPage }} emptyState={<EmptyState headline={t('finance.billing.noReports')} helperText={t('finance.billing.noReportsHelp')} actionLabel={t('finance.billing.prepareMonth')} actionTo="/admin/finance" />} />}
  </Box>
}
export default GeneratedReportsList
