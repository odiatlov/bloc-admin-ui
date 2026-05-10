import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useTranslation } from 'react-i18next'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatCurrency, useResidentPortal } from '../../../hooks/useApartmentData'

const ResidentBills: React.FC = () => {
  const { t } = useTranslation()
  const { residentInvoices } = useResidentPortal()
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null)
  const selectedInvoice = residentInvoices.find((invoice) => invoice.id === invoiceId)

  const columns: DataColumn<(typeof residentInvoices)[number]>[] = [
    { key: 'id', label: t('finance.columns.invoice'), render: (invoice) => invoice.id },
    { key: 'month', label: t('finance.columns.month'), render: (invoice) => invoice.month },
    { key: 'amount', label: t('finance.columns.amount'), render: (invoice) => formatCurrency(invoice.totalAmount) },
    { key: 'status', label: t('finance.columns.status'), render: (invoice) => <StatusChip status={invoice.status} label={t(`status.invoice.${invoice.status}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (invoice) => (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" onClick={() => setInvoiceId(invoice.id)}>
            {t('resident.bills.viewDetails')}
          </Button>
          <Button size="small">{t('resident.bills.download')}</Button>
        </Box>
      ),
    },
  ]

  return (
    <>
      <ResponsiveDataView ariaLabel={t('sidebar.myBills')} columns={columns} getRowId={(invoice) => invoice.id} rows={residentInvoices} />
      <Dialog open={Boolean(selectedInvoice)} onClose={() => setInvoiceId(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('resident.bills.detailsTitle')}</DialogTitle>
        <DialogContent>
          {selectedInvoice && t('resident.bills.detailsBody', { invoice: selectedInvoice.id, amount: formatCurrency(selectedInvoice.totalAmount), month: selectedInvoice.month })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceId(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ResidentBills
