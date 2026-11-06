import { useContext, useEffect, useRef, useState } from 'react'
import { Alert, Box, MenuItem, Paper, Stack, Tab, Tabs, TextField } from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router-dom'
import { RoleContext } from '../../../../../contexts/RoleContext'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import ConfirmationDialog from '../../../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../../../components/shared/EmptyState'
import { MetadataGrid } from '../../../../../components/shared/EntityPresentation'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import LoadingState from '../../../../../components/shared/LoadingState'
import PageHeader from '../../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import SearchField from '../../../../../components/shared/SearchField'
import { useFinanceActionScope, useFinanceBlocks, useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import { ApiError } from '../../../../../services/apiClient'
import { financeBillsApi, type FinanceBillItem, type FinanceBillList } from '../../../../../services/financeBillsApi'
import type { ResidentBillSummary } from '../../../../../types/finance'
import BillPaymentStatus from './BillPaymentStatus'

const billingDate = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

function AdminBillList() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const requestsOnly = params.get('tab') === 'requests'
  const blocks = useFinanceBlocks()
  const [blockId, setBlock] = useState('')
  const [staircaseId, setStaircase] = useState('')
  const [period, setPeriod] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{ key: string; data?: FinanceBillList; error?: boolean }>()
  const [months, setMonths] = useState<{ key: string; values: string[]; error?: boolean }>()
  const [selection, setSelection] = useState<ResidentBillSummary | null>(null)
  const [receivedOn, setReceivedOn] = useState('')
  const [recordError, setRecordError] = useState('')
  const [notice, setNotice] = useState<{ severity: 'success' | 'error'; message: string }>()
  const [action, setAction] = useState<{ type: 'record' | 'remind'; id: string }>()
  const inFlight = useRef(false)
  const active = useFinanceActionScope()
  const scope = `${blockId}:${staircaseId}`
  const filterKey = JSON.stringify([scope, period, search, requestsOnly])
  const key = `${filterKey}:${page}`
  const current = state?.key === key ? state : undefined
  const available = months?.key === scope ? months : undefined
  const staircases = blockId ? blocks.blocks.find(block => block.id === blockId)?.staircases ?? []
    : blocks.blocks.flatMap(block => block.staircases.map(stair => ({ ...stair, name: `${block.name} / ${stair.name}` })))
  const today = billingDate()

  useEffect(() => {
    const abort = new AbortController()
    financeBillsApi.periods({ blockId, staircaseId }, abort.signal)
      .then(values => { if (!abort.signal.aborted) setMonths({ key: scope, values }) })
      .catch(() => { if (!abort.signal.aborted) setMonths({ key: scope, values: [], error: true }) })
    return () => abort.abort()
  }, [blockId, staircaseId, scope, revision])

  useEffect(() => {
    const abort = new AbortController()
    const [year, month] = period.split('-').map(Number)
    financeBillsApi.list({ blockId, staircaseId, year: year || undefined, month: month || undefined,
      search: search.trim(), requestsOnly, pageNumber: page }, abort.signal).then(data => {
      if (abort.signal.aborted) return
      const lastPage = Math.max(1, Math.ceil(data.totalCount / data.pageSize))
      if (page > lastPage) setPage(lastPage)
      else setState({ key, data })
    }).catch(() => { if (!abort.signal.aborted) setState({ key, error: true }) })
    return () => abort.abort()
  }, [blockId, staircaseId, period, search, requestsOnly, page, key, revision])

  useEffect(() => {
    const refresh = () => setRevision(value => value + 1)
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  const periodLabel = (bill: ResidentBillSummary) => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' })
    .format(new Date(bill.year, bill.month - 1, 1))
  const locationLabel = (bill: ResidentBillSummary) => [bill.blockName, bill.staircaseName,
    t('finance.billing.apartmentNumber', { number: bill.apartmentNumber })].filter(Boolean).join(' / ')
  const amountLabel = (bill: ResidentBillSummary, amount = bill.remainingAmount) => new Intl.NumberFormat(i18n.language,
    { style: 'currency', currency: bill.currency }).format(amount)
  const retry = () => { setState(undefined); setRevision(value => value + 1) }

  const markPaid = async () => {
    if (!selection || !receivedOn || receivedOn > today || inFlight.current) return
    inFlight.current = true
    setAction({ type: 'record', id: selection.id })
    setRecordError('')
    try {
      const paid = await financeBillsApi.recordCash(selection.id, receivedOn)
      if (!active.current) return
      setState(previous => previous?.data && previous.key === key ? {
        key, data: { ...previous.data,
          items: previous.data.items.flatMap(item => item.bill.id !== paid.id ? [item] : requestsOnly ? [] : [{ ...item, bill: paid }]),
          totalCount: previous.data.totalCount - (requestsOnly ? 1 : 0),
        },
      } : previous)
      setSelection(null)
      setRevision(value => value + 1)
    } catch (error) {
      if (active.current) {
        const alreadyPaid = error instanceof ApiError && error.code === 'BILL_ALREADY_PAID'
        setRecordError(t(alreadyPaid ? 'billPayments.alreadyPaid' : 'billPayments.recordError'))
        if (alreadyPaid) setRevision(value => value + 1)
      }
    } finally {
      inFlight.current = false
      if (active.current) setAction(undefined)
    }
  }

  const remind = async (id: string) => {
    if (inFlight.current) return
    inFlight.current = true
    setAction({ type: 'remind', id })
    setNotice(undefined)
    try {
      await financeBillsApi.remind(id)
      if (active.current) setNotice({ severity: 'success', message: t('billPayments.reminderSent') })
    } catch (error) {
      if (active.current) setNotice({ severity: 'error', message: t(error instanceof ApiError && error.code === 'BILL_RESIDENT_UNAVAILABLE'
        ? 'billPayments.residentUnavailable' : 'billPayments.reminderError') })
    } finally {
      inFlight.current = false
      if (active.current) setAction(undefined)
    }
  }

  const columns: DataColumn<FinanceBillItem>[] = [
    { key: 'apartment', label: t('finance.columns.apartment'), cardRole: 'primary', render: ({ bill }) => locationLabel(bill) },
    { key: 'resident', label: t('billPayments.resident'), cardRole: 'secondary', render: ({ residentName }) => residentName || '—' },
    { key: 'month', label: t('finance.columns.month'), render: ({ bill }) => periodLabel(bill) },
    { key: 'amount', label: t('finance.columns.amount'), render: ({ bill }) => amountLabel(bill, bill.originalAmount) },
    { key: 'balance', label: t('resident.bills.summary.balance'), render: ({ bill }) => amountLabel(bill) },
    { key: 'due', label: t('financePublication.dueDate'), render: ({ bill }) => new Intl.DateTimeFormat(i18n.language,
      { dateStyle: 'medium' }).format(new Date(`${bill.dueDate}T12:00:00`)) },
    ...(requestsOnly ? [{ key: 'requestedAt', label: t('billPayments.requestedAt'), render: ({ bill }: FinanceBillItem) => bill.cashRequestedAt
      ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(bill.cashRequestedAt)) : '—' }] : []),
    { key: 'status', label: t('finance.columns.status'), cardRole: 'status', render: ({ bill }) => <BillPaymentStatus bill={bill} admin /> },
    { key: 'actions', label: t('common.actions'), actions: ({ bill }) => bill.remainingAmount <= 0 ? [] : [
      { id: 'markPaid', label: t('billPayments.markPaid'), icon: <CheckCircleOutlinedIcon />, priority: 2, disabled: !!action,
        onClick: () => { setSelection(bill); setReceivedOn(today); setRecordError('') } },
      { id: 'remind', label: t('billPayments.sendReminder'), icon: <NotificationsNoneIcon />, visible: !requestsOnly,
        disabled: !!action, loading: action?.type === 'remind' && action.id === bill.id, onClick: () => { void remind(bill.id) } },
    ] },
  ]

  const changeSearch = (value: string) => { setSearch(value.slice(0, 200)); setPage(1) }
  const tab = requestsOnly ? 'requests' : 'bills'
  return <Box>
    <PageHeader title={t('billPayments.bills')} description={t('billPayments.adminDescription')} />
    <Stack spacing={2}>
      <FilterBar>
        <SearchField size="small" label={t('billPayments.search')} value={search}
          onChange={event => changeSearch(event.target.value)} onClear={() => changeSearch('')} />
        <TextField select size="small" label={t('finance.billing.block')} value={blockId} disabled={blocks.loading || !!blocks.error}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          onChange={event => { setBlock(event.target.value); setStaircase(''); setPeriod(''); setPage(1) }}>
          <MenuItem value="">{t('common.all')}</MenuItem>
          {blocks.blocks.map(block => <MenuItem key={block.id} value={block.id}>{block.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" label={t('billPayments.staircase')} value={staircaseId} disabled={!staircases.length}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          onChange={event => { setStaircase(event.target.value); setPeriod(''); setPage(1) }}>
          <MenuItem value="">{t('common.all')}</MenuItem>
          {staircases.map(stair => <MenuItem key={stair.id} value={stair.id}>{stair.name}</MenuItem>)}
        </TextField>
        <AppDatePicker monthOnly confirmOnAccept allowAllMonths label={t('finance.billing.billingMonth')} value={period}
          availableMonths={available?.values ?? []} disabled={!available?.values.length || !!available.error}
          minDate={available?.values.at(-1) ? `${available.values.at(-1)}-01` : undefined}
          maxDate={available?.values[0] ? `${available.values[0]}-01` : undefined}
          onChange={value => { setPeriod(value); setPage(1) }} />
      </FilterBar>
      {blocks.error && <LoadErrorState helperText={t('billPayments.filtersError')} onRetry={blocks.refresh} />}
      {available?.error && <LoadErrorState helperText={t('billPayments.filtersError')} onRetry={() => setRevision(value => value + 1)} />}
      <Paper sx={{ overflow: 'hidden' }}>
        <Tabs value={tab} variant="fullWidth" aria-label={t('billPayments.bills')}
          onChange={(_, value: 'bills' | 'requests') => { setPage(1); setParams(value === 'requests' ? { tab: value } : {}) }}>
          <Tab value="bills" id="all-bills-tab" aria-controls="bill-list-panel" label={t('billPayments.allBills')} sx={{ minWidth: 0 }} />
          <Tab value="requests" id="payment-requests-tab" aria-controls="bill-list-panel" label={t('billPayments.requests')} sx={{ minWidth: 0 }} />
        </Tabs>
      </Paper>
      <Stack spacing={2} role="tabpanel" id="bill-list-panel" aria-labelledby={requestsOnly ? 'payment-requests-tab' : 'all-bills-tab'}>
        {notice && <Alert severity={notice.severity} onClose={() => setNotice(undefined)}>{notice.message}</Alert>}
        {!current ? <LoadingState label={t('finance.billing.loading')} /> : current.error
          ? <LoadErrorState helperText={t('billPayments.listError')} onRetry={retry} /> : current.data &&
          <ResponsiveDataView ariaLabel={t(requestsOnly ? 'billPayments.requests' : 'billPayments.allBills')}
            paginationId="admin-bills" paginationResetKey={filterKey} columns={columns} rows={current.data.items} getRowId={row => row.bill.id}
            serverPagination={{ page, totalCount: current.data.totalCount, onPageChange: setPage }}
            emptyState={<EmptyState headline={t(requestsOnly ? 'billPayments.noRequests' : 'billPayments.noBills')} helperText="" />} />}
      </Stack>
    </Stack>
    {selection && <ConfirmationDialog open title={t('billPayments.markPaid')} pending={action?.type === 'record'}
      cancelLabel={t('common.cancel')} onCancel={() => setSelection(null)} onConfirm={() => { void markPaid() }}
      confirmLabel={t('billPayments.confirmCash')} confirmDisabled={!receivedOn || receivedOn > today}>
      <Stack spacing={2}>
        <MetadataGrid items={[
          { key: 'apartment', label: t('finance.columns.apartment'), value: locationLabel(selection), fullWidth: true },
          { key: 'month', label: t('finance.columns.month'), value: periodLabel(selection) },
          { key: 'amount', label: t('finance.billing.totalDue'), value: amountLabel(selection) },
        ]} />
        <AppDatePicker label={t('billPayments.cashReceivedOn')} value={receivedOn} maxDate={today}
          disabled={action?.type === 'record'} onChange={setReceivedOn} />
        {recordError && <Alert severity="error">{recordError}</Alert>}
      </Stack>
    </ConfirmationDialog>}
  </Box>
}

export default function AdminBills() {
  const { role } = useContext(RoleContext)
  const identity = useFinanceIdentity()
  return role === 'Admin' ? <AdminBillList key={identity} /> : <Navigate replace to="/admin/finance" />
}
