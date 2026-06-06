import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import PaymentIcon from '@mui/icons-material/Payment'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../components/shared/EmptyState'
import { EntityListItem } from '../../../components/shared/EntityPresentation'
import InvoiceBreakdownDrawer from '../../../components/shared/InvoiceBreakdownDrawer'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { translateResidentAccountStatus } from '../../../domain/displayLabels'
import { formatCurrency, formatMonth, formatNumber, getBlockLabel, useResidents, type WaterReadingRow } from '../../../hooks/useApartmentData'
import type { FinancialStatus, ResidentAccountStatus } from '../../../mocks/apartmentData'

const accountStatusOptions: ResidentAccountStatus[] = ['no_account', 'invited', 'active']

const ResidentsOverview: React.FC = () => {
  const { t } = useTranslation()
  const {
    addResident,
    assignResidentToApartment,
    blocks,
    blockFilter,
    financialStatusFilter,
    groupedApartments,
    residents,
    scopedApartments,
    selectedApartment,
    selectedInvoices,
    selectedPayments,
    selectedReadings,
    setBlockFilter,
    setFinancialStatusFilter,
    setSelectedApartmentId,
    unassignResidentFromApartment,
  } = useResidents()
  const [detailTab, setDetailTab] = React.useState(0)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [assignResidentId, setAssignResidentId] = React.useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null)
  const [residentForm, setResidentForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    apartmentId: '',
    accountStatus: 'no_account' as ResidentAccountStatus,
  })
  const selectedInvoice = selectedInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null
  const apartmentGroups = Object.entries(groupedApartments)
  const assignableResidents = selectedApartment
    ? residents.filter((resident) => !selectedApartment.residents.some((apartmentResident) => apartmentResident.id === resident.id))
    : []

  const getApartmentOptionLabel = (apartment: (typeof scopedApartments)[number]) => {
    const details = [
      apartment.residentCount === 0 ? t('residents.apartment.noResidentsAssigned') : t('residents.family.residentCount', { count: apartment.residentCount }),
    ].filter(Boolean).join(' | ')
    return `${apartment.familyLabel || t('residents.apartment.number', { number: apartment.number })} - ${details}`
  }

  const handleAddResident = () => {
    if (!residentForm.name.trim()) return

    addResident({
      name: residentForm.name.trim(),
      email: residentForm.email.trim() || undefined,
      phone: residentForm.phone.trim() || undefined,
      apartmentId: residentForm.apartmentId || undefined,
      accountStatus: residentForm.accountStatus,
    })
    setResidentForm({ name: '', email: '', phone: '', apartmentId: '', accountStatus: 'no_account' })
    setIsAddDialogOpen(false)
  }

  const handleAssignResident = () => {
    if (!selectedApartment || !assignResidentId) return
    assignResidentToApartment(assignResidentId, selectedApartment.id)
    setAssignResidentId('')
  }

  const invoiceColumns: DataColumn<(typeof selectedInvoices)[number]>[] = [
    { key: 'id', label: t('finance.columns.invoice'), cardRole: 'primary', render: (invoice) => invoice.id },
    { key: 'month', label: t('finance.columns.month'), render: (invoice) => formatMonth(invoice.month) },
    { key: 'amount', label: t('finance.columns.amount'), render: (invoice) => formatCurrency(invoice.totalAmount) },
    { key: 'status', label: t('finance.columns.status'), cardRole: 'status', render: (invoice) => <StatusChip status={invoice.status} label={t(`status.invoice.${invoice.status}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: (invoice) => (
        <Button size="small" onClick={() => setSelectedInvoiceId(invoice.id)}>
          {t('resident.bills.viewDetails')}
        </Button>
      ),
    },
  ]

  const paymentColumns: DataColumn<(typeof selectedPayments)[number]>[] = [
    { key: 'id', label: t('finance.columns.payment'), cardRole: 'primary', render: (payment) => payment.id },
    { key: 'method', label: t('finance.columns.method'), render: (payment) => t(`finance.method.${payment.method}`) },
    { key: 'amount', label: t('finance.columns.amount'), render: (payment) => formatCurrency(payment.amount) },
    { key: 'status', label: t('finance.columns.verification'), cardRole: 'status', render: (payment) => <StatusChip status={payment.verificationStatus} label={t(`status.cash.${payment.verificationStatus}`)} /> },
  ]

  const renderMeter = (meter: WaterReadingRow['meters']['cold']) =>
    meter ? t('consumption.columns.meterValue', { previous: formatNumber(meter.previousValue), current: formatNumber(meter.currentValue), usage: formatNumber(meter.usageValue) }) : t('common.notAvailable')
  const readingColumns: DataColumn<(typeof selectedReadings)[number]>[] = [
    { key: 'month', label: t('finance.columns.month'), cardRole: 'primary', render: (reading) => formatMonth(reading.month) },
    { key: 'coldWater', label: t('consumption.waterType.cold'), render: (reading) => renderMeter(reading.meters.cold) },
    { key: 'hotWater', label: t('consumption.waterType.hot'), render: (reading) => renderMeter(reading.meters.hot) },
    { key: 'usage', label: t('consumption.columns.totalUsage'), render: (reading) => formatNumber(reading.usageValue) },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: { sm: 'auto' } }}>
          <Button startIcon={<PersonAddIcon />} variant="contained" onClick={() => setIsAddDialogOpen(true)}>
            {t('residents.actions.addResident')}
          </Button>
        </Box>
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
                <EntityListItem
                  key={apartment.id}
                  title={apartment.familyLabel || t('residents.apartment.number', { number: apartment.number })}
                  secondary={apartment.residentCount === 0 ? t('residents.apartment.empty') : t('residents.family.residentCount', { count: apartment.residentCount })}
                  status={<StatusChip status={apartment.financialStatus} label={t(`status.financial.${apartment.financialStatus}`)} />}
                  metadata={[{ key: 'debtBalance', label: t('finance.columns.amount'), value: formatCurrency(apartment.debtBalance) }]}
                  actions={(
                    <Button size="small" onClick={() => setSelectedApartmentId(apartment.id)}>
                      {t('residents.actions.openDetails')}
                    </Button>
                  )}
                />
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
                <Typography variant="h5">{selectedApartment.familyLabel || t('residents.apartment.number', { number: selectedApartment.number })}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedApartment.residentCount === 0 ? t('residents.apartment.empty') : t('residents.family.residentCount', { count: selectedApartment.residentCount })}
                </Typography>
              </Box>
            </Box>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('residents.family.members')}
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {selectedApartment.residents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('residents.apartment.noResidentsAssigned')}
                  </Typography>
                ) : selectedApartment.residents.map((resident) => (
                  <EntityListItem
                    key={resident.id}
                    title={resident.name}
                    secondary={resident.email || t('residents.resident.noEmail')}
                    status={<StatusChip status={resident.accountStatus} label={translateResidentAccountStatus(t, resident.accountStatus)} />}
                    actions={(
                      <Button size="small" onClick={() => unassignResidentFromApartment(resident.id, selectedApartment.id)}>
                        {t('residents.actions.unassign')}
                      </Button>
                    )}
                  />
                ))}
                <Divider />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 220, flex: '1 1 220px' }}>
                    <InputLabel>{t('residents.actions.assignResident')}</InputLabel>
                    <Select label={t('residents.actions.assignResident')} value={assignResidentId} onChange={(event: SelectChangeEvent) => setAssignResidentId(event.target.value)}>
                      {assignableResidents.map((resident) => (
                        <MenuItem key={resident.id} value={resident.id}>
                          {resident.name} - {translateResidentAccountStatus(t, resident.accountStatus)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="outlined" onClick={handleAssignResident} disabled={!assignResidentId}>
                    {t('residents.actions.assign')}
                  </Button>
                </Box>
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
            <Tabs value={detailTab} onChange={(_, value: number) => setDetailTab(value)} variant="fullWidth">
              <Tab label={t('residents.detail.invoices')} sx={{ minWidth: 0 }} />
              <Tab label={t('residents.detail.payments')} sx={{ minWidth: 0 }} />
              <Tab label={t('residents.detail.consumption')} sx={{ minWidth: 0 }} />
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
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('residents.dialog.addTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label={t('residents.fields.name')}
            required
            value={residentForm.name}
            onChange={(event) => setResidentForm((form) => ({ ...form, name: event.target.value }))}
          />
          <TextField
            label={t('residents.fields.emailOptional')}
            type="email"
            value={residentForm.email}
            onChange={(event) => setResidentForm((form) => ({ ...form, email: event.target.value }))}
          />
          <TextField
            label={t('residents.fields.phoneOptional')}
            value={residentForm.phone}
            onChange={(event) => setResidentForm((form) => ({ ...form, phone: event.target.value }))}
          />
          <FormControl>
            <InputLabel>{t('residents.fields.apartmentOptional')}</InputLabel>
            <Select
              label={t('residents.fields.apartmentOptional')}
              value={residentForm.apartmentId}
              onChange={(event: SelectChangeEvent) => setResidentForm((form) => ({ ...form, apartmentId: event.target.value }))}
            >
              <MenuItem value="">{t('residents.apartment.unassigned')}</MenuItem>
              {scopedApartments.map((apartment) => (
                <MenuItem key={apartment.id} value={apartment.id}>
                  {getApartmentOptionLabel(apartment)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>{t('residents.fields.accountStatus')}</InputLabel>
            <Select
              label={t('residents.fields.accountStatus')}
              value={residentForm.accountStatus}
              onChange={(event: SelectChangeEvent) => setResidentForm((form) => ({ ...form, accountStatus: event.target.value as ResidentAccountStatus }))}
            >
              {accountStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {translateResidentAccountStatus(t, status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleAddResident} disabled={!residentForm.name.trim()}>
            {t('residents.actions.addResident')}
          </Button>
        </DialogActions>
      </Dialog>
      <InvoiceBreakdownDrawer invoice={selectedInvoice} onClose={() => setSelectedInvoiceId(null)} formatCurrency={formatCurrency} />
    </Box>
  )
}

export default ResidentsOverview
