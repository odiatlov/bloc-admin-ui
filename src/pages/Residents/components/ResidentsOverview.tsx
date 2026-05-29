import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import PaymentIcon from '@mui/icons-material/Payment'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../components/shared/EmptyState'
import InvoiceBreakdownDrawer from '../../../components/shared/InvoiceBreakdownDrawer'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatCurrency, formatMonth, formatNumber, getBlockLabel, useResidents, type WaterReadingRow } from '../../../hooks/useApartmentData'
import type { FinancialStatus } from '../../../mocks/apartmentData'

const ResidentsOverview: React.FC = () => {
  const { t } = useTranslation()
  const {
    blocks,
    blockFilter,
    financialStatusFilter,
    groupedApartments,
    selectedApartment,
    selectedInvoices,
    selectedPayments,
    selectedReadings,
    setBlockFilter,
    setFinancialStatusFilter,
    setSelectedApartmentId,
  } = useResidents()
  const [detailTab, setDetailTab] = React.useState(0)
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null)
  const selectedInvoice = selectedInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null
  const apartmentGroups = Object.entries(groupedApartments)

  const invoiceColumns: DataColumn<(typeof selectedInvoices)[number]>[] = [
    { key: 'id', label: t('finance.columns.invoice'), render: (invoice) => invoice.id },
    { key: 'month', label: t('finance.columns.month'), render: (invoice) => formatMonth(invoice.month) },
    { key: 'amount', label: t('finance.columns.amount'), render: (invoice) => formatCurrency(invoice.totalAmount) },
    { key: 'status', label: t('finance.columns.status'), render: (invoice) => <StatusChip status={invoice.status} label={t(`status.invoice.${invoice.status}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (invoice) => (
        <Button size="small" onClick={() => setSelectedInvoiceId(invoice.id)}>
          {t('resident.bills.viewDetails')}
        </Button>
      ),
    },
  ]

  const paymentColumns: DataColumn<(typeof selectedPayments)[number]>[] = [
    { key: 'id', label: t('finance.columns.payment'), render: (payment) => payment.id },
    { key: 'method', label: t('finance.columns.method'), render: (payment) => t(`finance.method.${payment.method}`) },
    { key: 'amount', label: t('finance.columns.amount'), render: (payment) => formatCurrency(payment.amount) },
    { key: 'status', label: t('finance.columns.verification'), render: (payment) => <StatusChip status={payment.verificationStatus} label={t(`status.cash.${payment.verificationStatus}`)} /> },
  ]

  const renderMeter = (meter: WaterReadingRow['meters']['cold']) =>
    meter ? t('consumption.columns.meterValue', { previous: formatNumber(meter.previousValue), current: formatNumber(meter.currentValue), usage: formatNumber(meter.usageValue) }) : t('common.notAvailable')
  const readingColumns: DataColumn<(typeof selectedReadings)[number]>[] = [
    { key: 'month', label: t('finance.columns.month'), render: (reading) => formatMonth(reading.month) },
    { key: 'coldWater', label: t('consumption.waterType.cold'), render: (reading) => renderMeter(reading.meters.cold) },
    { key: 'hotWater', label: t('consumption.waterType.hot'), render: (reading) => renderMeter(reading.meters.hot) },
    { key: 'usage', label: t('consumption.columns.totalUsage'), render: (reading) => formatNumber(reading.usageValue) },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('residents.filters.block')}</InputLabel>
          <Select label={t('residents.filters.block')} value={blockFilter} onChange={(event: SelectChangeEvent) => setBlockFilter(event.target.value)}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {blocks.map((block) => (
              <MenuItem key={block.id} value={block.id}>
                {t('common.blockValue', { block: block.name })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>{t('residents.filters.financialStatus')}</InputLabel>
          <Select
            label={t('residents.filters.financialStatus')}
            value={financialStatusFilter}
            onChange={(event: SelectChangeEvent) => setFinancialStatusFilter(event.target.value as FinancialStatus | 'all')}
          >
            <MenuItem value="all">{t('common.all')}</MenuItem>
            <MenuItem value="current">{t('status.financial.current')}</MenuItem>
            <MenuItem value="due">{t('status.financial.due')}</MenuItem>
            <MenuItem value="overdue">{t('status.financial.overdue')}</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {apartmentGroups.length === 0 ? (
          <EmptyState
            actionLabel={t('emptyState.action', { information: t('emptyState.information.residents') })}
            actionTo="/admin/settings"
            headline={t('emptyState.headline', { information: t('emptyState.information.residents') })}
            helperText={t('emptyState.helper.settings', { information: t('emptyState.information.residents') })}
          />
        ) : apartmentGroups.map(([block, group]) => (
          <Paper key={block} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('common.blockValue', { block: getBlockLabel(block) })}
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {group.map((apartment) => (
                <Paper key={apartment.id} variant="outlined" sx={{ p: 1.5, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{apartment.familyLabel}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('residents.family.residentCount', { count: apartment.residentCount })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusChip status={apartment.financialStatus} label={t(`status.financial.${apartment.financialStatus}`)} />
                    <Typography variant="body2">{formatCurrency(apartment.debtBalance)}</Typography>
                    <Button size="small" onClick={() => setSelectedApartmentId(apartment.id)}>
                      {t('residents.actions.openDetails')}
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>

      <Drawer anchor="right" open={Boolean(selectedApartment)} onClose={() => setSelectedApartmentId(null)} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520 }, p: 2 } } }}>
        {selectedApartment && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedApartmentId(null)}>
                {t('residents.actions.backToList')}
              </Button>
              <Box>
                <Typography variant="h5">{selectedApartment.familyLabel}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('residents.family.residentCount', { count: selectedApartment.residentCount })}
                </Typography>
              </Box>
            </Box>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('residents.family.members')}
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.5 }}>
                {selectedApartment.residents.map((resident) => (
                  <Typography key={resident.id} variant="body2">
                    {resident.name}
                  </Typography>
                ))}
              </Box>
            </Paper>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button startIcon={<NotificationsActiveIcon />} variant="outlined">
                {t('residents.actions.sendReminder')}
              </Button>
              <Button startIcon={<PaymentIcon />} variant="contained">
                {t('residents.actions.registerPayment')}
              </Button>
            </Box>
            <Divider />
            <Tabs value={detailTab} onChange={(_, value: number) => setDetailTab(value)} variant="scrollable" scrollButtons="auto">
              <Tab label={t('residents.detail.invoices')} />
              <Tab label={t('residents.detail.payments')} />
              <Tab label={t('residents.detail.consumption')} />
            </Tabs>
            {detailTab === 0 && (
              <ResponsiveDataView
                ariaLabel={t('residents.detail.invoices')}
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
                rows={selectedInvoices}
              />
            )}
            {detailTab === 1 && (
              <ResponsiveDataView
                ariaLabel={t('residents.detail.payments')}
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
                rows={selectedPayments}
              />
            )}
            {detailTab === 2 && (
              <ResponsiveDataView
                ariaLabel={t('residents.detail.consumption')}
                columns={readingColumns}
                emptyState={(
                  <EmptyState
                    actionLabel={t('consumption.actions.addReading')}
                    actionTo="/admin/consumption"
                    headline={t('emptyState.headline', { information: t('emptyState.information.consumption') })}
                    helperText={t('emptyState.helper.dedicated', { information: t('emptyState.information.consumption') })}
                  />
                )}
                getRowId={(reading) => reading.id}
                rows={selectedReadings}
              />
            )}
          </Box>
        )}
      </Drawer>
      <InvoiceBreakdownDrawer invoice={selectedInvoice} onClose={() => setSelectedInvoiceId(null)} formatCurrency={formatCurrency} />
    </Box>
  )
}

export default ResidentsOverview
