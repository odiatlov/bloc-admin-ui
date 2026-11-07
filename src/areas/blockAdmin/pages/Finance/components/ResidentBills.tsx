import { useContext, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Box } from '@mui/material'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../../../../contexts/RoleContext'
import EmptyState from '../../../../../components/shared/EmptyState'
import InvoiceBreakdownDrawer from '../../../../../components/shared/InvoiceBreakdownDrawer'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import LoadingState from '../../../../../components/shared/LoadingState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { usePageFilter } from '../../../../../hooks/usePageFilter'
import { useResidentBill, useResidentBillPeriods, useResidentBills } from '../../../../../hooks/useResidentFinance'
import { useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import type { ResidentBillSummary } from '../../../../../types/finance'
import ResidentBillsDemo from './ResidentBillsDemo'
import ResidentBillMonthFilter from './ResidentBillMonthFilter'
import BillPaymentStatus from './BillPaymentStatus'
import { BillCostDialog, BillPaymentMethodDialog } from './ResidentPaymentDialogs'
import { residentFinanceApi } from '../../../../../services/residentFinanceApi'

type BillSelection = { id: string; origin: 'view' | 'cost'; choosingMethod: boolean }

const PublishedResidentBills = () => {
  const { t, i18n } = useTranslation()
  const identity = useFinanceIdentity()
  const [filters, setFilters] = usePageFilter('residentBills.filters', { period: '', page: 1 })
  const [params] = useSearchParams()
  const [selection, setSelection] = useState<BillSelection | null>(() => {
    const id = params.get('billId')
    return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      ? { id, origin: 'view', choosingMethod: false } : null
  })
  const selectedId = selection?.id ?? null
  const periods = useResidentBillPeriods()
  const period = periods.data?.includes(filters.period) ? filters.period : ''
  const page = period === filters.period ? filters.page : 1
  const waitingForPeriod = Boolean(filters.period) && periods.loading
  const list = useResidentBills(page, period, !waitingForPeriod)
  const detail = useResidentBill(selectedId)
  const changePeriod = (value: string) => { setFilters({ period: value, page: 1 }); setSelection(null) }
  const retryBills = () => {
    if (periods.error) periods.refresh()
    list.refresh()
  }
  const money = (amount: number, currency = 'RON') => new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(amount)
  const select = (bill: ResidentBillSummary, origin: BillSelection['origin']) =>
    setSelection({ id: bill.id, origin, choosingMethod: false })
  const chooseMethod = (choosingMethod: boolean) => setSelection(current => current && { ...current, choosingMethod })
  const payable = (bill: ResidentBillSummary) => bill.remainingAmount > 0 && !bill.cashRequestedAt
  const drawerBill = selection?.origin === 'view' ? detail.data : undefined
  const requestSent = () => {
    list.refresh()
    if (selection?.origin === 'view') {
      chooseMethod(false)
      detail.refresh()
    } else setSelection(null)
  }
  const columns: DataColumn<ResidentBillSummary>[] = [
    { key: 'reference', label: t('finance.columns.invoice'), cardRole: 'primary', render: bill => bill.reference },
    { key: 'apartment', label: t('finance.columns.apartment'), cardRole: 'secondary', render: bill => [bill.blockName, bill.staircaseName, t('finance.billing.apartmentNumber', { number: bill.apartmentNumber })].filter(Boolean).join(' / ') },
    { key: 'month', label: t('finance.columns.month'), render: bill => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(bill.year, bill.month - 1, 1)) },
    { key: 'dueDate', label: t('financePublication.dueDate'), render: bill => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(`${bill.dueDate}T12:00:00`)) },
    { key: 'amount', label: t('residentFinance.thisBill'), render: bill => money(bill.correctedAmount ?? bill.originalAmount, bill.currency) },
    { key: 'credit', label: t('financeCorrections.creditAvailable'), render: bill => money(bill.availableCredit ?? 0, bill.currency) },
    { key: 'pendingDebit', label: t('financeCorrections.pendingDebit'), render: bill => money(bill.pendingCorrectionDebit ?? 0, bill.currency) },
    { key: 'remaining', label: t('resident.bills.summary.balance'), render: bill => money(bill.remainingAmount, bill.currency) },
    { key: 'status', label: t('finance.columns.status'), cardRole: 'status', render: bill => <BillPaymentStatus bill={bill} /> },
    { key: 'actions', label: t('common.actions'), actions: bill => [
      { id: 'pay', label: t('billPayments.pay'), icon: <PaymentsOutlinedIcon />, priority: 2,
        visible: payable(bill), onClick: () => select(bill, 'cost') },
      { id: 'details', label: t('billPayments.viewBill'), icon: <VisibilityIcon />,
        onClick: () => select(bill, 'view') },
    ] },
  ]
  return <Box sx={{ display: 'grid', gap: 2 }}>
    <ResidentBillMonthFilter periods={periods.data ?? []} value={period} onChange={changePeriod} />
    {periods.error && list.data && <LoadErrorState inline helperText={t('residentFinance.periodsError')} onRetry={periods.refresh} />}
    {waitingForPeriod || list.loading ? <LoadingState label={t('finance.billing.loading')} />
      : list.error ? <LoadErrorState helperText={t('residentFinance.billsError')} onRetry={retryBills} />
        : list.data && <ResponsiveDataView paginationId="resident-published-bills" paginationResetKey={`${identity}:${period}`}
          ariaLabel={t('sidebar.myBills')} rows={list.data.items} columns={columns} getRowId={bill => bill.id}
          serverPagination={{ page, totalCount: list.data.totalCount, onPageChange: page => setFilters({ period, page }) }}
          emptyState={period
            ? <EmptyState headline={t('billPayments.noBills')} helperText="" actionLabel={t('finance.billing.allMonths')} onAction={() => changePeriod('')} />
            : <EmptyState headline={t('residentFinance.noPublishedBills')} helperText={t('residentFinance.noPublishedHelp')} />} />}
    <InvoiceBreakdownDrawer invoice={null} bill={drawerBill ?? null} open={selection?.origin === 'view'} loading={detail.loading}
      error={detail.error ? t('residentFinance.billError') : undefined} onRetry={detail.refresh}
      onClose={() => setSelection(null)} formatCurrency={money}
      onPay={drawerBill && payable(drawerBill.bill) ? () => chooseMethod(true) : undefined} />
    {selection?.origin === 'cost' && !selection.choosingMethod && <BillCostDialog detail={detail.data} loading={detail.loading}
      error={detail.error} onRetry={detail.refresh} onClose={() => setSelection(null)} onContinue={() => chooseMethod(true)} />}
    {selection?.choosingMethod && <BillPaymentMethodDialog detail={detail.data} loading={detail.loading}
      error={detail.error} onRetry={detail.refresh} onClose={() => chooseMethod(false)}
      onRequest={residentFinanceApi.requestCash} onSent={requestSent} />}
  </Box>
}

const ResidentBills = () => {
  const { account } = useContext(RoleContext)
  const identity = useFinanceIdentity()
  const location = useLocation()
  const demo = account.dataMode === 'mock-populated' || account.dataMode === 'mock-configured-block'
  return demo ? <ResidentBillsDemo /> : <PublishedResidentBills key={`${identity}:${location.search}`} />
}
export default ResidentBills
