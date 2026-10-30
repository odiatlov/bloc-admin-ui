import { useContext, useState } from 'react'
import { Box, Chip, CircularProgress } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../../../../contexts/RoleContext'
import EmptyState from '../../../../../components/shared/EmptyState'
import InvoiceBreakdownDrawer from '../../../../../components/shared/InvoiceBreakdownDrawer'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { usePageFilter } from '../../../../../hooks/usePageFilter'
import { useResidentBill, useResidentBills } from '../../../../../hooks/useResidentFinance'
import { useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import type { ResidentBillSummary } from '../../../../../types/finance'
import ResidentBillsDemo from './ResidentBillsDemo'

const PublishedResidentBills = () => {
  const { t, i18n } = useTranslation()
  const identity = useFinanceIdentity()
  const [page, setPage] = usePageFilter('residentBills.page', 1)
  const [selection, setSelection] = useState<{ identity: string; id: string } | null>(null)
  const selectedId = selection?.identity === identity ? selection.id : null
  const list = useResidentBills(page)
  const detail = useResidentBill(selectedId)
  const money = (amount: number, currency = 'RON') => new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(amount)
  const select = (bill: ResidentBillSummary) => setSelection({ identity, id: bill.id })
  const columns: DataColumn<ResidentBillSummary>[] = [
    { key: 'reference', label: t('finance.columns.invoice'), cardRole: 'primary', render: bill => bill.reference },
    { key: 'apartment', label: t('finance.columns.apartment'), cardRole: 'secondary', render: bill => [bill.blockName, bill.staircaseName, t('finance.billing.apartmentNumber', { number: bill.apartmentNumber })].filter(Boolean).join(' / ') },
    { key: 'month', label: t('finance.columns.month'), render: bill => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(bill.year, bill.month - 1, 1)) },
    { key: 'dueDate', label: t('financePublication.dueDate'), render: bill => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(`${bill.dueDate}T12:00:00`)) },
    { key: 'amount', label: t('residentFinance.thisBill'), render: bill => money(bill.originalAmount, bill.currency) },
    { key: 'remaining', label: t('resident.bills.summary.balance'), render: bill => money(bill.remainingAmount, bill.currency) },
    { key: 'status', label: t('finance.columns.status'), cardRole: 'status', render: bill => <Chip size="small" color={bill.status === 'overdue' ? 'warning' : bill.remainingAmount === 0 ? 'success' : 'default'} label={t(`residentFinance.status.${bill.status}`)} /> },
    { key: 'actions', label: t('common.actions'), actions: bill => [{ id: 'details', label: t('resident.bills.viewDetails'), icon: <VisibilityIcon />, onClick: () => select(bill) }] },
  ]
  return <Box sx={{ display: 'grid', gap: 2 }}>
    {list.loading ? <CircularProgress aria-label={t('finance.billing.loading')} />
      : list.error ? <LoadErrorState helperText={t('residentFinance.billsError')} onRetry={list.refresh} />
        : list.data && <ResponsiveDataView paginationId="resident-published-bills" paginationResetKey={identity}
          ariaLabel={t('sidebar.myBills')} rows={list.data.items} columns={columns} getRowId={bill => bill.id}
          serverPagination={{ page, totalCount: list.data.totalCount, onPageChange: setPage }}
          emptyState={<EmptyState headline={t('residentFinance.noPublishedBills')} helperText={t('residentFinance.noPublishedHelp')} />} />}
    <InvoiceBreakdownDrawer key={identity} invoice={null} bill={detail.data ?? null} open={!!selectedId} loading={detail.loading}
      error={detail.error ? t('residentFinance.billError') : undefined} onRetry={detail.refresh}
      onClose={() => setSelection(null)} formatCurrency={money} />
  </Box>
}

const ResidentBills = () => {
  const { account } = useContext(RoleContext)
  const demo = account.dataMode === 'mock-populated' || account.dataMode === 'mock-configured-block'
  return demo ? <ResidentBillsDemo /> : <PublishedResidentBills />
}
export default ResidentBills
