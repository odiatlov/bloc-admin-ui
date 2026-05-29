import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../components/shared/EmptyState'
import InvoiceBreakdownDrawer from '../../../components/shared/InvoiceBreakdownDrawer'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatCurrency, formatMonth, useResidentPortal } from '../../../hooks/useApartmentData'

const ResidentBills: React.FC = () => {
  const { t } = useTranslation()
  const { residentInvoices } = useResidentPortal()
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null)
  const selectedInvoice = residentInvoices.find((invoice) => invoice.id === invoiceId)

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
      <ResponsiveDataView
        ariaLabel={t('sidebar.myBills')}
        columns={columns}
        emptyState={(
          <EmptyState
            actionLabel={t('emptyState.action', { information: t('emptyState.information.invoices') })}
            actionTo="/admin/settings"
            headline={t('emptyState.headline', { information: t('emptyState.information.invoices') })}
            helperText={t('emptyState.helper.settings', { information: t('emptyState.information.invoices') })}
          />
        )}
        getRowId={(invoice) => invoice.id}
        rows={residentInvoices}
      />
      <InvoiceBreakdownDrawer invoice={selectedInvoice ?? null} onClose={() => setInvoiceId(null)} formatCurrency={formatCurrency} />
    </>
  )
}

export default ResidentBills
