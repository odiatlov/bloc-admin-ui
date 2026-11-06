import React from 'react'
import { Alert, Box, Checkbox, FormControlLabel, MenuItem, TextField } from '@mui/material'
import PreviewIcon from '@mui/icons-material/Preview'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { RoleContext } from '../../../../../contexts/RoleContext'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import LoadingState from '../../../../../components/shared/LoadingState'
import PageHeader from '../../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import { financeReviewApi } from '../../../../../services/financeReviewApi'
import { financeReviewError } from '../../../../../services/financeReviewErrors'
import type { FinanceBlock } from '../../../../../types/finance'
import type { FinanceReviewDetail, FinanceReviewList, FinanceReviewListItem } from '../../../../../types/financeReview'
import { ReportSheets } from '../../Reports/components/MaintenanceReportViewer'
import FinanceReviewDecisions from './FinanceReviewDecisions'
import { FinanceReviewStatus } from './FinanceReviewHistory'

const ReviewDetail = ({ id }: { id: string }) => {
  const { t } = useTranslation()
  const [retry, setRetry] = React.useState(0)
  const [state, setState] = React.useState<{ retry: number; detail?: FinanceReviewDetail; error?: string }>()
  React.useEffect(() => {
    const abort = new AbortController()
    financeReviewApi.detail(id, abort.signal).then(detail => { if (!abort.signal.aborted) setState({ retry, detail }) })
      .catch(error => { if (!abort.signal.aborted) setState({ retry, error: financeReviewError(error, t) }) })
    return () => abort.abort()
  }, [id, retry, t])
  if (state?.retry !== retry) return <LoadingState variant="page" label={t('finance.billing.loading')} />
  if (state.error) return <LoadErrorState helperText={state.error} onRetry={() => setRetry(x => x + 1)} />
  return state.detail ? <ReportSheets key={retry} report={state.detail.report} reviewSubmissionId={id}
    onPublished={() => setRetry(x => x + 1)} renderActions={onExport => <FinanceReviewDecisions detail={state.detail!} refresh={() => setRetry(x => x + 1)} onExport={onExport} />} /> : null
}

const ReviewList = () => {
  const { t, i18n } = useTranslation()
  const [blockState, setBlockState] = React.useState<{ items: FinanceBlock[]; error?: string }>()
  const [blockId, setBlockId] = React.useState('')
  const [periodState, setPeriodState] = React.useState<{ blockId: string; items: string[]; error?: string }>()
  const [period, setPeriod] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [history, setHistory] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [retry, setRetry] = React.useState(0)
  const [state, setState] = React.useState<{ key: string; data?: FinanceReviewList; error?: string }>()
  const key = `${blockId}:${period}:${status}:${history}:${page}:${retry}`
  React.useEffect(() => {
    if (!blockId || !blockState || blockState.error || blockState.items.some(x => x.id === blockId)) return
    const timer = window.setTimeout(() => { setBlockId(''); setPeriod(''); setPage(1) }, 0)
    return () => window.clearTimeout(timer)
  }, [blockId, blockState])
  React.useEffect(() => {
    const abort = new AbortController()
    financeReviewApi.periods(blockId, abort.signal).then(items => { if (!abort.signal.aborted) setPeriodState({ blockId, items }) })
      .catch(error => { if (!abort.signal.aborted) setPeriodState({ blockId, items: [], error: financeReviewError(error, t) }) })
    return () => abort.abort()
  }, [blockId, retry, t])
  React.useEffect(() => {
    const abort = new AbortController()
    financeReviewApi.blocks(abort.signal).then(items => { if (!abort.signal.aborted) setBlockState({ items }) })
      .catch(error => { if (!abort.signal.aborted) setBlockState({ items: [], error: financeReviewError(error, t) }) })
    return () => abort.abort()
  }, [retry, t])
  React.useEffect(() => {
    const abort = new AbortController()
    const [year, month] = period.split('-').map(Number)
    financeReviewApi.list({ blockId, ...(year && month ? { year, month } : {}), status, includeHistory: history, pageNumber: page }, abort.signal)
      .then(data => { if (!abort.signal.aborted) setState({ key, data }) })
      .catch(error => { if (!abort.signal.aborted) setState({ key, error: financeReviewError(error, t) }) })
    return () => abort.abort()
  }, [blockId, history, key, page, period, status, t])
  const columns: DataColumn<FinanceReviewListItem>[] = [
    { key: 'block', label: t('finance.billing.block'), cardRole: 'primary', render: x => x.blockName },
    { key: 'period', label: t('finance.billing.billingMonth'), cardRole: 'secondary', render: x => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(x.year, x.month - 1, 1)) },
    { key: 'revision', label: t('finance.billing.revisionLabel'), render: x => x.revision },
    { key: 'cycle', label: t('financeReview.cycle'), render: x => x.cycle },
    { key: 'status', label: t('finance.billing.status'), cardRole: 'status', render: x => <FinanceReviewStatus review={{ status: x.status }} /> },
    { key: 'submitted', label: t('financeReview.submittedAt'), render: x => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(x.submittedAt)) },
    { key: 'total', label: t('finance.billing.totalDue'), render: x => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'RON' }).format(x.totalDue) },
    { key: 'actions', label: t('common.actions'), cardRole: 'actions', actions: x => [{ id: 'preview', label: t('finance.billing.preview'), icon: <PreviewIcon />, to: `/admin/reviews/${x.id}` }] },
  ]
  return <Box sx={{ display: 'grid', gap: 2 }}>
    <PageHeader title={t('sidebar.reviews')} description={t('financeReview.description')} />
    <FilterBar>
      <TextField select size="small" label={t('finance.billing.block')} value={blockId} disabled={!blockState || !!blockState.error}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} onChange={e => { setBlockId(e.target.value); setPeriod(''); setPage(1) }}>
        <MenuItem value="">{t('common.all')}</MenuItem>{blockState?.items.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
      </TextField>
      <AppDatePicker monthOnly confirmOnAccept allowAllMonths label={t('finance.billing.billingMonth')} value={period}
        disabled={!periodState || periodState.blockId !== blockId || !!periodState.error || periodState.items.length === 0}
        availableMonths={periodState?.blockId === blockId ? periodState.items : []}
        minDate={periodState?.items[0] ? `${periodState.items[0]}-01` : undefined}
        maxDate={periodState?.items.at(-1) ? `${periodState.items.at(-1)}-01` : undefined}
        onChange={value => { setPeriod(value); setPage(1) }} />
      <TextField select size="small" label={t('financeReview.reviewStatus')} value={status} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        onChange={e => { setStatus(e.target.value); setPage(1) }}>
        <MenuItem value="">{t(history ? 'common.all' : 'financeReview.pending')}</MenuItem>
        {['Submitted', 'Resubmitted', 'Approved', 'Rejected'].map(s => <MenuItem key={s} value={s}>{t(`financeReview.status.${s}`)}</MenuItem>)}
      </TextField>
      <FormControlLabel control={<Checkbox checked={history} onChange={e => { setHistory(e.target.checked); setPage(1) }} />} label={t('finance.billing.showHistory')} />
    </FilterBar>
    {periodState?.error && !blockState?.error && state?.key === key && state.data &&
      <LoadErrorState inline helperText={periodState.error} onRetry={() => setRetry(x => x + 1)} />}
    {blockState?.error ? <LoadErrorState helperText={blockState.error} onRetry={() => setRetry(x => x + 1)} />
      : !blockState || state?.key !== key ? <LoadingState label={t('finance.billing.loading')} />
        : state.error ? <LoadErrorState helperText={state.error} onRetry={() => setRetry(x => x + 1)} />
          : state.data && <ResponsiveDataView rows={state.data.items} columns={columns} getRowId={x => x.id} ariaLabel={t('sidebar.reviews')}
            paginationId="censor-financial-reviews" paginationResetKey={`${blockId}:${period}:${status}:${history}`}
            serverPagination={{ page, totalCount: state.data.totalCount, onPageChange: setPage }}
            emptyState={<EmptyState headline={t('financeReview.empty')} helperText={t('financeReview.emptyHelp')} />} />}
  </Box>
}

export default function ApiCensorReviews() {
  const { role } = React.useContext(RoleContext)
  const identity = useFinanceIdentity()
  const location = useLocation()
  const { submissionId } = useParams()
  const { t } = useTranslation()
  if (role !== 'Censor') return <Alert severity="info">{t('financeReview.censorOnly')}</Alert>
  return submissionId ? <ReviewDetail key={`${identity}:${submissionId}:${location.key}`} id={submissionId} /> : <ReviewList key={`${identity}:${location.key}`} />
}
