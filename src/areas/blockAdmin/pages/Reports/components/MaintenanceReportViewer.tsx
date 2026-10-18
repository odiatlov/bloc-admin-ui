import React from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Tab, Tabs, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import { financeApi } from '../../../../../services/financeApi'
import type { FinanceReportRow, MaintenanceReport } from '../../../../../types/finance'

const ReportSheets: React.FC<{ report: MaintenanceReport }> = ({ report }) => {
  const { t, i18n } = useTranslation()
  const [sheetIndex, setSheetIndex] = React.useState(0)
  const [selected, setSelected] = React.useState<FinanceReportRow | null>(null)
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const sheet = report.sheets[sheetIndex]
  const money = (value: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: report.currency }).format(value)
  const number = (value: number, digits = 2) => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: digits }).format(value)
  const download = async () => {
    setExporting(true); setError(null)
    try { await financeApi.export(report.id, i18n.language) }
    catch (nextError) { setError(nextError instanceof Error ? nextError.message : t('finance.billing.exportFailed')) }
    finally { setExporting(false) }
  }
  const columns: DataColumn<FinanceReportRow>[] = [
    { key: 'number', label: t('finance.billing.apartment'), cardRole: 'primary', render: (row) => row.number },
    { key: 'contact', label: t('finance.billing.contact'), cardRole: 'secondary', render: (row) => row.contactName || '—' },
    { key: 'occupants', label: t('finance.billing.declaredOccupants'), render: (row) => row.declaredOccupants },
    { key: 'mp', label: t('finance.billing.heatingMp'), render: (row) => `${number(row.heatingMp, 1)} m²` },
    { key: 'cold', label: t('finance.billing.coldConsumption'), render: (row) => `${number(row.coldConsumption)} m³` },
    { key: 'coldDifference', label: t('finance.billing.coldDifference'), render: (row) => `${number(row.coldDifference)} m³` },
    { key: 'billedCold', label: t('finance.billing.billedCold'), render: (row) => `${number(row.billedColdConsumption)} m³` },
    { key: 'hot', label: t('finance.billing.hotConsumption'), render: (row) => `${number(row.hotConsumption)} m³` },
    { key: 'hotDifference', label: t('finance.billing.hotDifference'), render: (row) => `${number(row.hotDifference)} m³` },
    { key: 'billedHot', label: t('finance.billing.billedHot'), render: (row) => `${number(row.billedHotConsumption)} m³` },
    ...[...report.columns].sort((a, b) => a.order - b.order).map((column): DataColumn<FinanceReportRow> => ({ key: column.id, label: column.name, render: (row) => money(row.charges.find((line) => line.chargeId === column.id)?.amount ?? 0) })),
    { key: 'charges', label: t('finance.billing.currentCharges'), render: (row) => money(row.currentCharges) },
    { key: 'arrears', label: t('finance.billing.arrears'), render: (row) => money(row.arrears) },
    { key: 'adjustments', label: t('finance.billing.adjustments'), render: (row) => money(row.adjustments) },
    { key: 'total', label: t('finance.billing.totalDue'), render: (row) => <Typography sx={{ fontWeight: 700 }}>{money(row.totalDue)}</Typography> },
    { key: 'actions', label: t('common.actions'), cardRole: 'actions', actions: (row) => [{ id: 'details', label: t('finance.billing.calculationDetails'), icon: <InfoOutlinedIcon />, onClick: () => setSelected(row) }] },
  ]
  return <Box sx={{ display: 'grid', gap: 2 }}>
    <PageHeader title={`${report.blockName} · ${new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(report.year, report.month - 1, 1))}`} description={t('finance.billing.reportDescription', { revision: report.revision })} actions={<><Button component={RouterLink} to="/admin/reports" startIcon={<ArrowBackIcon />} variant="outlined">{t('finance.billing.backReports')}</Button><Button startIcon={<FileDownloadIcon />} variant="contained" disabled={exporting} onClick={() => void download()}>{t('finance.billing.exportExcel')}</Button></>} />
    <Alert severity={report.status === 'Outdated' ? 'warning' : 'info'}>{t(report.status === 'Outdated' ? 'finance.billing.outdatedHelp' : 'finance.billing.draftHelp')}</Alert>
    {error && <Alert severity="error">{error}</Alert>}
    <Paper sx={{ overflow: 'hidden' }}><Tabs variant="scrollable" scrollButtons="auto" value={sheetIndex} onChange={(_, value: number) => setSheetIndex(value)}>{report.sheets.map((item, index) => <Tab key={item.staircaseId ?? index} label={item.name} />)}<Tab label={t('finance.billing.reconciliation')} /></Tabs></Paper>
    {sheet ? <>
      <Paper sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}><Typography variant="h6">{sheet.name}</Typography><Chip label={t('finance.billing.sheetTotal', { amount: money(sheet.totalDue) })} /></Paper>
      <Box sx={{ '.ResponsiveDataView-table': { overflowX: 'auto' }, '.ResponsiveDataView-table .MuiTable-root': { minWidth: Math.max(1500, columns.length * 120) } }}><ResponsiveDataView paginationId={`report-sheet-${report.id}-${sheetIndex}`} ariaLabel={sheet.name} rows={sheet.rows} columns={columns} getRowId={(row) => row.apartmentId} /></Box>
      <Paper sx={{ p: 2, display: 'grid', gap: 1 }}><Typography variant="h6">{t('finance.billing.sheetTotals')}</Typography>{report.columns.map((column) => <Box key={column.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography>{column.name}</Typography><Typography>{money(sheet.chargeTotals[column.id] ?? 0)}</Typography></Box>)}{[[t('finance.billing.currentCharges'), sheet.currentCharges], [t('finance.billing.arrears'), sheet.totalArrears], [t('finance.billing.adjustments'), sheet.totalAdjustments], [t('finance.billing.totalDue'), sheet.totalDue]].map(([label, value]) => <Box key={String(label)} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography sx={{ fontWeight: 700 }}>{label}</Typography><Typography sx={{ fontWeight: 700 }}>{money(Number(value))}</Typography></Box>)}</Paper>
    </> : <>
      <Paper sx={{ p: 2 }}><Typography variant="h6">{t('finance.billing.blockTotal')}: {money(report.totalDue)}</Typography></Paper>
      <ResponsiveDataView paginationId={`report-reconciliation-${report.id}`} ariaLabel={t('finance.billing.reconciliation')} rows={report.reconciliation} getRowId={(row) => row.chargeId} columns={[
        { key: 'name', label: t('finance.billing.name'), cardRole: 'primary', render: (row) => row.name },
        { key: 'source', label: t('finance.billing.sourceTotal'), render: (row) => money(row.sourceAmount) },
        { key: 'allocated', label: t('finance.billing.allocated'), render: (row) => money(row.allocatedAmount) },
        { key: 'difference', label: t('finance.billing.difference'), render: (row) => money(row.difference) },
      ]} />
      <ResponsiveDataView paginationId={`report-supplies-${report.id}`} ariaLabel={t('finance.billing.supplyGroups')} rows={report.supplyGroups} getRowId={(row) => row.supplyGroupId} columns={[
        { key: 'name', label: t('finance.billing.supplyGroup'), cardRole: 'primary', render: (row) => row.name },
        { key: 'utility', label: t('finance.billing.utility'), render: (row) => t(`finance.billing.values.${row.utilityType}`) },
        { key: 'actual', label: t('finance.billing.actualConsumption'), render: (row) => `${number(row.actualConsumption)} m³` },
        { key: 'difference', label: t('finance.billing.difference'), render: (row) => `${number(row.difference)} m³` },
        { key: 'billed', label: t('finance.billing.billedConsumption'), render: (row) => `${number(row.billedConsumption)} m³` },
      ]} />
    </>}
    <AppDialog open={!!selected} title={t('finance.billing.apartmentNumber', { number: selected?.number })} hideCancelButton cancelLabel={t('common.close')} confirmLabel={t('common.close')} onConfirm={() => setSelected(null)} onCancel={() => setSelected(null)}>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Typography>{selected?.contactName}</Typography>
        <Typography>{t('finance.billing.heatingMp')}: {selected?.heatingMp.toFixed(1)} m²{selected?.heatingMode ? ` · ${t(`finance.billing.values.${selected.heatingMode}`)}` : ''}{selected?.heatingPercentage != null ? ` · ${number(selected.heatingPercentage, 1)}%` : ''}</Typography>
        {selected?.charges.map((line) => <Paper key={line.chargeId} variant="outlined" sx={{ p: 1.5, display: 'grid', gap: 0.5 }}><Typography sx={{ fontWeight: 700 }}>{line.name}: {money(line.amount)}</Typography><Typography variant="body2">{t('finance.billing.calculationFormula', { method: t(`finance.billing.values.${line.basis}`), quantity: number(line.quantity), denominator: number(line.denominator), rate: number(line.rate), source: money(line.sourceAmount) })}</Typography>{line.basis === 'Manual' && <Typography variant="body2">{t('finance.billing.reason')}: {line.explanation}</Typography>}</Paper>)}
        {selected?.adjustmentDetails?.map((entry) => <Paper key={entry.id} variant="outlined" sx={{ p: 1.5 }}><Typography sx={{ fontWeight: 700 }}>{entry.name}: {money(entry.amount)}</Typography><Typography variant="body2">{t(`finance.billing.values.${entry.kind}`)} · {entry.reason}</Typography></Paper>)}
      </Box>
    </AppDialog>
  </Box>
}

const MaintenanceReportViewer: React.FC = () => {
  const { t } = useTranslation()
  const { runId = '' } = useParams()
  const identity = useFinanceIdentity()
  const { role } = React.useContext(RoleContext)
  const [retry, setRetry] = React.useState(0)
  const [state, setState] = React.useState<{ key: string; report?: MaintenanceReport; error?: string }>()
  const key = `${identity}:${runId}:${retry}`
  React.useEffect(() => {
    if (role !== 'Admin') return
    const abort = new AbortController()
    financeApi.report(runId, abort.signal).then((report) => { if (!abort.signal.aborted) setState({ key, report }) }).catch((error) => { if (!abort.signal.aborted) setState({ key, error: error.message }) })
    return () => abort.abort()
  }, [key, role, runId])
  if (role !== 'Admin') return <Alert severity="info">{t('finance.billing.adminOnly')}</Alert>
  if (state?.key !== key) return <CircularProgress aria-label={t('finance.billing.loading')} />
  if (state.error) return <LoadErrorState helperText={state.error} onRetry={() => setRetry((value) => value + 1)} />
  return state.report ? <ReportSheets key={key} report={state.report} /> : null
}
export default MaintenanceReportViewer
