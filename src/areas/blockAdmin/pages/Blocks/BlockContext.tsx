import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ApartmentIcon from '@mui/icons-material/Apartment'
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ActionBar from '../../../../components/shared/ActionBar'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import MetricCard from '../../../../components/shared/MetricCard'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import { translateHeatingType } from '../../../../domain/displayLabels'
import { useBlocks } from '../../../../hooks/useBlocks'
import { formatCurrency, formatSquareMeters, useBlockContext } from '../../../../hooks/useApartmentData'
import ApiApartmentManagement from '../Apartments/components/ApiApartmentManagement'
import ApartmentManagement from '../Apartments/components/ApartmentManagement'

const tableEmptyValue = '-'

const BlockContext: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { blockId, section = 'overview' } = useParams()
  const normalizedSection = section.toLowerCase()
  const databaseBlocks = useBlocks()
  const mockBlockContext = useBlockContext(blockId)
  const databaseBlock = databaseBlocks.blocks.find((item) => item.id === blockId)
  const databaseBlockContext = databaseBlock ? {
    apartmentCount: databaseBlock.apartmentCount,
    block: {
      id: databaseBlock.id,
      name: databaseBlock.name,
      address: '',
      hasStaircases: databaseBlock.staircaseCount > 0,
      heatingType: 'central' as const,
    },
    blockApartments: [],
    blockInvoices: [],
    blockPayments: [],
    residentCount: databaseBlock.residentCount,
    staircaseTotals: [],
    totalInvoices: databaseBlock.totalInvoicesAmount,
    totalPayments: databaseBlock.totalPaymentsAmount,
  } : null
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
  } = databaseBlockContext ?? mockBlockContext

  if (databaseBlocks.isLoading && !mockBlockContext.block) {
    return (
      <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
        <CircularProgress size={32} />
        <Typography color="text.secondary">{t('blocks.loading')}</Typography>
      </Paper>
    )
  }

  if (databaseBlocks.error && !mockBlockContext.block) {
    return (
      <LoadErrorState
        helperText={t('blocks.errors.loadFailed')}
        onRetry={databaseBlocks.refresh}
      />
    )
  }

  if (!block) return <Navigate to="/admin/dashboard" replace />
  if (normalizedSection === 'staircases' && !block.hasStaircases) return <Navigate to={`/admin/blocks/${block.id}/Overview`} replace />

  const apartmentColumns: DataColumn<(typeof blockApartments)[number]>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), cardRole: 'primary', render: (apartment) => apartment.familyLabel },
    { key: 'residents', label: t('residents.family.members'), render: (apartment) => apartment.residentCount },
    { key: 'floor', label: t('blocks.columns.floor'), render: (apartment) => apartment.floor },
    { key: 'staircase', label: t('blocks.columns.staircase'), render: (apartment) => staircaseTotals.find((item) => item.staircase.id === apartment.staircaseId)?.staircase.name ?? tableEmptyValue },
    { key: 'usableSurface', label: t('blocks.columns.usableSurface'), render: (apartment) => formatSquareMeters(apartment.usableSurface) },
    { key: 'totalSurface', label: t('blocks.columns.totalSurface'), render: (apartment) => formatSquareMeters(apartment.totalSurface) },
    { key: 'heatedSurface', label: t('blocks.columns.heatedSurface'), render: (apartment) => formatSquareMeters(apartment.heatedSurface) },
    { key: 'heatingType', label: t('blocks.columns.heatingType'), render: (apartment) => translateHeatingType(t, apartment.heatingType) },
  ]

  const invoiceColumns: DataColumn<(typeof blockInvoices)[number]>[] = [
    { key: 'invoice', label: t('finance.columns.invoice'), cardRole: 'primary', render: (invoice) => invoice.id },
    { key: 'apartment', label: t('finance.columns.apartment'), cardRole: 'secondary', render: (invoice) => invoice.familyLabel || tableEmptyValue },
    { key: 'amount', label: t('finance.columns.amount'), render: (invoice) => formatCurrency(invoice.totalAmount) },
  ]

  const staircaseColumns: DataColumn<(typeof staircaseTotals)[number]>[] = [
    { key: 'staircase', label: t('blocks.columns.staircase'), cardRole: 'primary', render: (row) => row.staircase.name },
    { key: 'apartments', label: t('dashboard.admin.overview.apartments'), render: (row) => row.apartmentCount },
    { key: 'invoices', label: t('blocks.metrics.totalInvoices'), render: (row) => formatCurrency(row.invoiceTotal) },
    { key: 'payments', label: t('blocks.metrics.totalPayments'), render: (row) => formatCurrency(row.paymentTotal) },
    { key: 'cash', label: t('blocks.metrics.cash'), render: (row) => formatCurrency(row.cashTotal) },
    { key: 'bank', label: t('blocks.metrics.bank'), render: (row) => formatCurrency(row.bankTotal) },
    { key: 'unpaid', label: t('blocks.metrics.unpaid'), render: (row) => formatCurrency(Math.max(row.invoiceTotal - row.paymentTotal, 0)) },
  ]

  const paymentColumns: DataColumn<(typeof blockPayments)[number]>[] = [
    { key: 'payment', label: t('finance.columns.payment'), cardRole: 'primary', render: (payment) => payment.id },
    { key: 'method', label: t('finance.columns.method'), render: (payment) => t(`finance.method.${payment.method}`) },
    { key: 'amount', label: t('finance.columns.amount'), render: (payment) => formatCurrency(payment.amount) },
  ]

  return (
    <Box>
      <PageHeader
        title={t('blocks.title', { block: block.name })}
        description={t('blocks.description')}
      />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <ActionBar title={t('dashboard.admin.quickActions')}>
          {normalizedSection !== 'overview' && normalizedSection !== 'apartments' && (
            <Button startIcon={<ApartmentIcon />} variant="contained" component={RouterLink} to={`/admin/blocks/${block.id}/Overview`}>
              {t('sidebar.apartments')}
            </Button>
          )}
          <Button startIcon={<ArrowBackIcon />} variant="contained" onClick={() => navigate('/admin/blocks')}>
            {t('blocks.actions.backToList')}
          </Button>
        </ActionBar>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
          <MetricCard label={t('dashboard.admin.overview.apartments')} value={apartmentCount} />
          <MetricCard label={t('dashboard.admin.overview.residents')} value={residentCount} />
          <MetricCard label={t('blocks.metrics.totalInvoices')} value={formatCurrency(totalInvoices)} />
          <MetricCard label={t('blocks.metrics.totalPayments')} value={formatCurrency(totalPayments)} />
        </Box>

        {(normalizedSection === 'overview' || normalizedSection === 'apartments') && (
          databaseBlockContext ? (
            <ApiApartmentManagement hideScopeFilters initialBlockId={block.id} />
          ) : (
            <ApartmentManagement hideScopeFilters initialBlockId={block.id} />
          )
        )}

        {normalizedSection === 'consumption' && (
          <ResponsiveDataView
            ariaLabel={t('sidebar.apartments')}
            columns={apartmentColumns}
            emptyState={(
              <EmptyState
                actionLabel={t('emptyState.action', { information: t('emptyState.information.apartments') })}
                actionTo={`/admin/apartments?blockId=${block.id}`}
                headline={t('emptyState.headline', { information: t('emptyState.information.apartments') })}
                helperText={t('emptyState.helper.dedicated', { information: t('emptyState.information.apartments') })}
              />
            )}
            getRowId={(apartment) => apartment.id}
            rows={blockApartments}
          />
        )}

        {normalizedSection === 'staircases' && (
          <ResponsiveDataView
            ariaLabel={t('sidebar.staircases')}
            columns={staircaseColumns}
            emptyState={(
              <EmptyState
                actionLabel={t('emptyState.action', { information: t('emptyState.information.blocks') })}
                actionTo="/admin/settings"
                headline={t('emptyState.headline', { information: t('emptyState.information.blocks') })}
                helperText={t('emptyState.helper.settings', { information: t('emptyState.information.blocks') })}
              />
            )}
            getRowId={(row) => row.staircase.id}
            rows={staircaseTotals}
          />
        )}

        {normalizedSection === 'finance' && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {block.hasStaircases && (
              <ResponsiveDataView
                ariaLabel={t('blocks.monthlyStaircasePayments')}
                columns={staircaseColumns}
                emptyState={(
                  <EmptyState
                    actionLabel={t('emptyState.action', { information: t('emptyState.information.blocks') })}
                    actionTo="/admin/settings"
                    headline={t('emptyState.headline', { information: t('emptyState.information.blocks') })}
                    helperText={t('emptyState.helper.settings', { information: t('emptyState.information.blocks') })}
                  />
                )}
                getRowId={(row) => row.staircase.id}
                rows={staircaseTotals}
              />
            )}
            <ResponsiveDataView
              ariaLabel={t('finance.tabs.invoices')}
              columns={invoiceColumns}
              emptyState={(
                <EmptyState
                  actionLabel={t('emptyState.action', { information: t('emptyState.information.invoices') })}
                  actionTo="/admin/settings"
                  headline={t('emptyState.headline', { information: t('emptyState.information.invoices') })}
                  helperText={t('emptyState.helper.settings', { information: t('emptyState.information.invoices') })}
                />
              )}
              getRowId={(invoice) => invoice.id}
              rows={blockInvoices}
            />
            <ResponsiveDataView
              ariaLabel={t('finance.tabs.payments')}
              columns={paymentColumns}
              emptyState={(
                <EmptyState
                  actionLabel={t('emptyState.action', { information: t('emptyState.information.payments') })}
                  actionTo="/admin/finance"
                  headline={t('emptyState.headline', { information: t('emptyState.information.payments') })}
                  helperText={t('emptyState.helper.finance', { information: t('emptyState.information.payments') })}
                />
              )}
              getRowId={(payment) => payment.id}
              rows={blockPayments}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default BlockContext
