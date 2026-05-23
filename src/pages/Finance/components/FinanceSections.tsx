import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import PaidIcon from '@mui/icons-material/Paid'
import { useTranslation } from 'react-i18next'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatCurrency, formatFriendlyDateTime, formatMonth, formatNumber, useFinance } from '../../../hooks/useApartmentData'
import type { PaymentMethod } from '../../../mocks/apartmentData'

const FinanceSections: React.FC = () => {
  const { t } = useTranslation()
  const {
    cashAwaitingVerification,
    cashEntries,
    invoices,
    maintenanceRuns,
    monthlyRevenue,
    paymentMethodFilter,
    payments,
    registerCashPayment,
    setCashStatus,
    setPaymentMethodFilter,
    unpaidInvoices,
  } = useFinance()
  const [tab, setTab] = React.useState(0)
  const [dialogInvoiceId, setDialogInvoiceId] = React.useState<string | null>(null)
  const selectedInvoice = invoices.find((invoice) => invoice.id === dialogInvoiceId)
  const formatGeneratedDate = (value: string) => formatFriendlyDateTime(value, { atLabel: t('common.at'), todayLabel: t('common.today') })

  const invoiceColumns: DataColumn<(typeof invoices)[number]>[] = [
    { key: 'id', label: t('finance.columns.invoice'), render: (invoice) => invoice.id },
    { key: 'apartment', label: t('finance.columns.apartment'), render: (invoice) => invoice.familyLabel },
    { key: 'residents', label: t('residents.family.members'), render: (invoice) => invoice.residents.length },
    { key: 'month', label: t('finance.columns.month'), render: (invoice) => formatMonth(invoice.month) },
    { key: 'amount', label: t('finance.columns.amount'), render: (invoice) => formatCurrency(invoice.totalAmount) },
    {
      key: 'status',
      label: t('finance.columns.status'),
      render: (invoice) => <StatusChip status={invoice.status} label={t(`status.invoice.${invoice.status}`)} />,
    },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (invoice) => (
        <Button size="small" disabled={invoice.status === 'paid'} onClick={() => setDialogInvoiceId(invoice.id)}>
          {t('finance.actions.registerCash')}
        </Button>
      ),
    },
  ]

  const paymentColumns: DataColumn<(typeof payments)[number]>[] = [
    { key: 'id', label: t('finance.columns.payment'), render: (payment) => payment.id },
    { key: 'apartment', label: t('finance.columns.apartment'), render: (payment) => payment.familyLabel },
    { key: 'method', label: t('finance.columns.method'), render: (payment) => t(`finance.method.${payment.method}`) },
    { key: 'amount', label: t('finance.columns.amount'), render: (payment) => formatCurrency(payment.amount) },
    {
      key: 'status',
      label: t('finance.columns.verification'),
      render: (payment) => <StatusChip status={payment.verificationStatus} label={t(`status.cash.${payment.verificationStatus}`)} />,
    },
  ]

  const cashColumns: DataColumn<(typeof cashEntries)[number]>[] = [
    { key: 'id', label: t('finance.columns.cash'), render: (entry) => entry.id },
    { key: 'apartment', label: t('finance.columns.apartment'), render: (entry) => entry.familyLabel },
    { key: 'amount', label: t('finance.columns.amount'), render: (entry) => formatCurrency(entry.amount) },
    {
      key: 'status',
      label: t('finance.columns.status'),
      render: (entry) => <StatusChip status={entry.status} label={t(`status.cash.${entry.status}`)} />,
    },
    { key: 'notes', label: t('finance.columns.notes'), render: (entry) => t(entry.notesKey) },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (entry) => (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" disabled={entry.status !== 'unverified'} onClick={() => setCashStatus(entry.id, 'verified')}>
            {t('finance.actions.verify')}
          </Button>
          <Button size="small" disabled={entry.status !== 'verified'} onClick={() => setCashStatus(entry.id, 'deposited')}>
            {t('finance.actions.deposit')}
          </Button>
        </Box>
      ),
    },
  ]

  const confirmRegisterCash = () => {
    if (selectedInvoice) registerCashPayment(selectedInvoice)
    setDialogInvoiceId(null)
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <PaidIcon color="primary" />
          <Typography variant="body2" color="text.secondary">
            {t('finance.metrics.monthlyRevenue')}
          </Typography>
          <Typography variant="h5">{formatCurrency(monthlyRevenue)}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <CheckCircleIcon color="warning" />
          <Typography variant="body2" color="text.secondary">
            {t('finance.metrics.unpaidInvoices')}
          </Typography>
          <Typography variant="h5">{unpaidInvoices}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <LocalAtmIcon color="error" />
          <Typography variant="body2" color="text.secondary">
            {t('finance.metrics.cashAwaiting')}
          </Typography>
          <Typography variant="h5">{cashAwaitingVerification}</Typography>
        </Paper>
      </Box>

      <Paper>
        <Tabs value={tab} onChange={(_, nextTab: number) => setTab(nextTab)} variant="scrollable" scrollButtons="auto">
          <Tab label={t('finance.tabs.invoices')} />
          <Tab label={t('finance.tabs.payments')} />
          <Tab label={t('finance.tabs.cashRegister')} />
          <Tab label={t('finance.tabs.maintenance')} />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined">{t('finance.actions.bulkActions')}</Button>
          </Box>
          <ResponsiveDataView ariaLabel={t('finance.tabs.invoices')} columns={invoiceColumns} getRowId={(invoice) => invoice.id} rows={invoices} />
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <FormControl size="small" sx={{ maxWidth: 260 }}>
            <InputLabel>{t('finance.filters.method')}</InputLabel>
            <Select
              label={t('finance.filters.method')}
              value={paymentMethodFilter}
              onChange={(event: SelectChangeEvent) => setPaymentMethodFilter(event.target.value as PaymentMethod | 'all')}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="cash">{t('finance.method.cash')}</MenuItem>
              <MenuItem value="bank">{t('finance.method.bank')}</MenuItem>
            </Select>
          </FormControl>
          <ResponsiveDataView ariaLabel={t('finance.tabs.payments')} columns={paymentColumns} getRowId={(payment) => payment.id} rows={payments} />
        </Box>
      )}

      {tab === 2 && (
        <ResponsiveDataView ariaLabel={t('finance.tabs.cashRegister')} columns={cashColumns} getRowId={(entry) => entry.id} rows={cashEntries} />
      )}

      {tab === 3 && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {maintenanceRuns.map((run) => (
            <Paper key={run.id} sx={{ p: 2, display: 'grid', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h6">{t('finance.maintenance.blockMonth', { block: run.blockId.replace('block-', '').toUpperCase(), month: formatMonth(run.month) })}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('finance.maintenance.generatedAt', { generatedAt: formatGeneratedDate(run.generatedAt) })}
                  </Typography>
                </Box>
                <Chip color={run.status === 'published' ? 'success' : 'warning'} label={t(`finance.maintenance.status.${run.status}`)} />
              </Box>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {run.apartmentTotals.map((total) => {
                  const invoice = invoices.find((candidate) => candidate.apartmentId === total.apartmentId && candidate.month === run.month)
                  return (
                    <Paper key={total.apartmentId} variant="outlined" sx={{ p: 1.5, display: 'grid', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 700 }}>{invoice?.familyLabel ?? total.apartmentId}</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{formatCurrency(total.total)}</Typography>
                      </Box>
                      {total.lines.slice(0, 3).map((line) => (
                        <Typography key={line.expenseId} variant="body2" color="text.secondary">
                          {t(line.textKey, {
                            label: t(line.labelKey),
                            amount: formatCurrency(line.amount),
                            basis: formatNumber(line.basis),
                            totalBasis: formatNumber(line.totalBasis),
                            percentage: typeof line.values.percentage === 'number' ? formatNumber(line.values.percentage) : line.values.percentage,
                          })}
                        </Typography>
                      ))}
                      {(total.debts.length > 0 || total.penalties.length > 0) && (
                        <Typography variant="body2" color="warning.main">
                          {t('finance.maintenance.adjustments', {
                            debts: formatCurrency(total.debts.reduce((sum, debt) => sum + debt.principal, 0)),
                            penalties: formatCurrency(total.penalties.reduce((sum, penalty) => sum + penalty.amount, 0)),
                          })}
                        </Typography>
                      )}
                    </Paper>
                  )
                })}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={Boolean(selectedInvoice)} onClose={() => setDialogInvoiceId(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('finance.dialog.cashTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('finance.dialog.cashBody', {
              invoice: selectedInvoice?.id,
              amount: selectedInvoice ? formatCurrency(selectedInvoice.totalAmount) : '',
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogInvoiceId(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={confirmRegisterCash}>
            {t('finance.actions.registerCash')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FinanceSections
