import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PaymentIcon from '@mui/icons-material/Payment'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import ActionBar from '../../../components/shared/ActionBar'
import ConfirmationDialog from '../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../components/shared/EmptyState'
import InvoiceBreakdownDrawer from '../../../components/shared/InvoiceBreakdownDrawer'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatCurrency, formatMonth, useResidentPortal } from '../../../hooks/useApartmentData'

const ResidentBills: React.FC = () => {
  const { t } = useTranslation()
  const { residentInvoices } = useResidentPortal()
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null)
  const [paymentInvoiceId, setPaymentInvoiceId] = React.useState<string | null | undefined>(undefined)
  const selectedInvoice = residentInvoices.find((invoice) => invoice.id === invoiceId)
  const paymentInvoice = residentInvoices.find((invoice) => invoice.id === paymentInvoiceId)
  const paymentDialogOpen = paymentInvoiceId !== undefined
  const paymentInvoiceBalance = paymentInvoice ? Math.max(paymentInvoice.totalAmount - paymentInvoice.paidAmount, 0) : 0
  const totalOutstandingBalance = residentInvoices.reduce(
    (total, invoice) => total + Math.max(invoice.totalAmount - invoice.paidAmount, 0),
    0,
  )

  const closePaymentDialog = () => setPaymentInvoiceId(undefined)

  const openInvoicePayment = () => {
    if (!selectedInvoice) return
    setInvoiceId(null)
    setPaymentInvoiceId(selectedInvoice.id)
  }

  const columns: DataColumn<(typeof residentInvoices)[number]>[] = [
    { key: 'id', label: t('finance.columns.invoice'), render: (invoice) => invoice.id },
    { key: 'apartment', label: t('finance.columns.apartment'), render: (invoice) => invoice.familyLabel },
    { key: 'month', label: t('finance.columns.month'), render: (invoice) => formatMonth(invoice.month) },
    { key: 'amount', label: t('finance.columns.amount'), render: (invoice) => formatCurrency(invoice.totalAmount) },
    { key: 'status', label: t('finance.columns.status'), render: (invoice) => <StatusChip status={invoice.status} label={t(`status.invoice.${invoice.status}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (invoice) => (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setInvoiceId(invoice.id)}>
            {t('resident.bills.viewDetails')}
          </Button>
          <Button size="small" startIcon={<FileDownloadIcon />}>{t('resident.bills.download')}</Button>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <ActionBar title={t('resident.bills.history')}>
        <Button variant="contained" startIcon={<PaymentIcon />} onClick={() => setPaymentInvoiceId(null)}>
          {t('resident.bills.payAll')}
        </Button>
      </ActionBar>

      <ResponsiveDataView
        ariaLabel={t('sidebar.myBills')}
        columns={columns}
        emptyState={(
          <EmptyState
            actionLabel={t('consumption.actions.submitIndex')}
            actionTo="/admin/consumption"
            headline={t('emptyState.headline', { information: t('emptyState.information.invoices') })}
            helperText={t('emptyState.helper.residentIndexOnly')}
          />
        )}
        getRowId={(invoice) => invoice.id}
        rows={residentInvoices}
      />
      <InvoiceBreakdownDrawer
        invoice={selectedInvoice ?? null}
        onClose={() => setInvoiceId(null)}
        formatCurrency={formatCurrency}
        onPay={openInvoicePayment}
      />
      <ConfirmationDialog
        cancelLabel={t('common.cancel')}
        confirmLabel={t('resident.bills.payment.confirm')}
        onCancel={closePaymentDialog}
        onConfirm={closePaymentDialog}
        open={paymentDialogOpen}
        title={t('resident.bills.payment.title')}
      >
        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography>{t(paymentInvoice ? 'resident.bills.payment.singleBody' : 'resident.bills.payment.allBody')}</Typography>
          {paymentInvoice ? (
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 700 }}>
                {t('resident.bills.payment.invoiceContext', {
                  invoice: paymentInvoice.id,
                  month: formatMonth(paymentInvoice.month),
                })}
              </Typography>
              <Typography variant="body1" color="primary.main" sx={{ fontWeight: 700 }}>
                {t('resident.bills.payment.amount')}: {formatCurrency(paymentInvoiceBalance)}
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontWeight: 700 }}>
              {t('resident.bills.payment.totalAmount')}: {formatCurrency(totalOutstandingBalance)}
            </Typography>
          )}
        </Box>
      </ConfirmationDialog>
    </Box>
  )
}

export default ResidentBills
