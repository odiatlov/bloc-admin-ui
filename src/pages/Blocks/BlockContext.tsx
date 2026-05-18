import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DashboardIcon from '@mui/icons-material/Dashboard'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../components/shared/ResponsiveDataView'
import { formatCurrency, useBlockContext } from '../../hooks/useApartmentData'

const BlockContext: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { blockId, section = 'overview' } = useParams()
  const {
    apartmentCount,
    block,
    blockApartments,
    blockInvoices,
    blockPayments,
    residentCount,
    staircaseTotals,
    totalInvoices,
    totalPayments,
  } = useBlockContext(blockId)

  if (!block) return <Navigate to="/admin/dashboard" replace />
  if (section === 'staircases' && !block.hasStaircases) return <Navigate to={`/admin/blocks/${block.id}/apartments`} replace />

  const apartmentColumns: DataColumn<(typeof blockApartments)[number]>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), render: (apartment) => apartment.familyLabel },
    { key: 'residents', label: t('residents.family.members'), render: (apartment) => apartment.residentCount },
    { key: 'floor', label: t('blocks.columns.floor'), render: (apartment) => apartment.floor },
    { key: 'staircase', label: t('blocks.columns.staircase'), render: (apartment) => staircaseTotals.find((item) => item.staircase.id === apartment.staircaseId)?.staircase.name ?? t('common.notAvailable') },
    { key: 'usableSurface', label: t('blocks.columns.usableSurface'), render: (apartment) => apartment.usableSurface },
    { key: 'totalSurface', label: t('blocks.columns.totalSurface'), render: (apartment) => apartment.totalSurface },
    { key: 'heatedSurface', label: t('blocks.columns.heatedSurface'), render: (apartment) => apartment.heatedSurface },
    { key: 'heatingType', label: t('blocks.columns.heatingType'), render: (apartment) => apartment.heatingType },
  ]

  const invoiceColumns: DataColumn<(typeof blockInvoices)[number]>[] = [
    { key: 'invoice', label: t('finance.columns.invoice'), render: (invoice) => invoice.id },
    { key: 'apartment', label: t('finance.columns.apartment'), render: (invoice) => invoice.familyLabel || t('common.notAvailable') },
    { key: 'amount', label: t('finance.columns.amount'), render: (invoice) => formatCurrency(invoice.totalAmount) },
  ]

  const staircaseColumns: DataColumn<(typeof staircaseTotals)[number]>[] = [
    { key: 'staircase', label: t('blocks.columns.staircase'), render: (row) => row.staircase.name },
    { key: 'apartments', label: t('dashboard.admin.overview.apartments'), render: (row) => row.apartmentCount },
    { key: 'invoices', label: t('blocks.metrics.totalInvoices'), render: (row) => formatCurrency(row.invoiceTotal) },
    { key: 'payments', label: t('blocks.metrics.totalPayments'), render: (row) => formatCurrency(row.paymentTotal) },
    { key: 'cash', label: t('blocks.metrics.cash'), render: (row) => formatCurrency(row.cashTotal) },
    { key: 'bank', label: t('blocks.metrics.bank'), render: (row) => formatCurrency(row.bankTotal) },
    { key: 'unpaid', label: t('blocks.metrics.unpaid'), render: (row) => formatCurrency(Math.max(row.invoiceTotal - row.paymentTotal, 0)) },
  ]

  const paymentColumns: DataColumn<(typeof blockPayments)[number]>[] = [
    { key: 'payment', label: t('finance.columns.payment'), render: (payment) => payment.id },
    { key: 'method', label: t('finance.columns.method'), render: (payment) => t(`finance.method.${payment.method}`) },
    { key: 'amount', label: t('finance.columns.amount'), render: (payment) => formatCurrency(payment.amount) },
  ]

  return (
    <Box>
      <PageHeader
        title={t('blocks.title', { block: block.name })}
        description={t('blocks.description')}
        actions={(
          <>
            <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate('/admin/blocks')}>
              {t('blocks.actions.backToList')}
            </Button>
            <Button startIcon={<DashboardIcon />} variant="text" onClick={() => navigate('/admin/dashboard')}>
              {t('blocks.actions.backToDashboard')}
            </Button>
          </>
        )}
      />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">{t('dashboard.admin.overview.apartments')}</Typography>
            <Typography variant="h5">{apartmentCount}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">{t('dashboard.admin.overview.residents')}</Typography>
            <Typography variant="h5">{residentCount}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">{t('blocks.metrics.totalInvoices')}</Typography>
            <Typography variant="h5">{formatCurrency(totalInvoices)}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">{t('blocks.metrics.totalPayments')}</Typography>
            <Typography variant="h5">{formatCurrency(totalPayments)}</Typography>
          </Paper>
        </Box>

        {(section === 'overview' || section === 'apartments' || section === 'consumption') && (
          <ResponsiveDataView ariaLabel={t('sidebar.apartments')} columns={apartmentColumns} getRowId={(apartment) => apartment.id} rows={blockApartments} />
        )}

        {section === 'staircases' && (
          <ResponsiveDataView ariaLabel={t('sidebar.staircases')} columns={staircaseColumns} getRowId={(row) => row.staircase.id} rows={staircaseTotals} />
        )}

        {section === 'finance' && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {block.hasStaircases && (
              <ResponsiveDataView ariaLabel={t('blocks.monthlyStaircasePayments')} columns={staircaseColumns} getRowId={(row) => row.staircase.id} rows={staircaseTotals} />
            )}
            <ResponsiveDataView ariaLabel={t('finance.tabs.invoices')} columns={invoiceColumns} getRowId={(invoice) => invoice.id} rows={blockInvoices} />
            <ResponsiveDataView ariaLabel={t('finance.tabs.payments')} columns={paymentColumns} getRowId={(payment) => payment.id} rows={blockPayments} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default BlockContext
