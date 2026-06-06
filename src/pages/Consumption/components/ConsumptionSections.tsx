import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../components/shared/EmptyState'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatApartment, formatMonth, formatNumber, useConsumption, useResidentPortal, type WaterReadingRow } from '../../../hooks/useApartmentData'

type ConsumptionSectionsProps = {
  mode: 'admin' | 'resident' | 'censor'
}

const ConsumptionSections: React.FC<ConsumptionSectionsProps> = ({ mode }) => {
  const { t } = useTranslation()
  const { blockFilter, blocks, readings, setBlockFilter, summaries, waterBalances } = useConsumption()
  const { apartments, residentReadings } = useResidentPortal()
  const [submitOpen, setSubmitOpen] = React.useState(false)
  const [selectedApartmentId, setSelectedApartmentId] = React.useState(apartments[0]?.id ?? '')
  const visibleReadings = mode === 'resident' ? residentReadings : readings
  const canEditReadings = mode !== 'censor'
  const dedicatedEmptyStateAction = canEditReadings ? { onAction: () => setSubmitOpen(true) } : { actionTo: '/admin/finance' }
  const dedicatedEmptyStateActionLabel = canEditReadings
    ? mode === 'resident' ? t('consumption.actions.submitIndex') : t('consumption.actions.addReading')
    : t('censor.actions.openQueue')
  const renderMeter = (meter: WaterReadingRow['meters']['cold']) =>
    meter ? t('consumption.columns.meterValue', { previous: formatNumber(meter.previousValue), current: formatNumber(meter.currentValue), usage: formatNumber(meter.usageValue) }) : t('common.notAvailable')

  const readingColumns: DataColumn<(typeof visibleReadings)[number]>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), cardRole: 'primary', render: (reading) => formatApartment(reading.apartment) },
    { key: 'month', label: t('finance.columns.month'), render: (reading) => formatMonth(reading.month) },
    { key: 'coldWater', label: t('consumption.waterType.cold'), render: (reading) => renderMeter(reading.meters.cold) },
    { key: 'hotWater', label: t('consumption.waterType.hot'), render: (reading) => renderMeter(reading.meters.hot) },
    { key: 'usage', label: t('consumption.columns.totalUsage'), render: (reading) => formatNumber(reading.usageValue) },
  ]

  const summaryColumns: DataColumn<(typeof summaries)[number]>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), cardRole: 'primary', render: (summary) => formatApartment(summary.apartment) },
    { key: 'month', label: t('finance.columns.month'), render: (summary) => formatMonth(summary.month) },
    { key: 'usage', label: t('consumption.columns.totalUsage'), render: (summary) => formatNumber(summary.usageValue) },
    { key: 'anomaly', label: t('consumption.columns.anomaly'), cardRole: 'status', render: (summary) => <StatusChip status={summary.anomaly} label={t(`status.anomaly.${summary.anomaly}`)} /> },
  ]

  const waterBalanceColumns: DataColumn<(typeof waterBalances)[number]>[] = [
    { key: 'block', label: t('residents.filters.block'), cardRole: 'primary', render: (balance) => t('common.blockValue', { block: balance.block.name }) },
    { key: 'month', label: t('finance.columns.month'), render: (balance) => formatMonth(balance.month) },
    { key: 'main', label: t('consumption.columns.mainMeter'), render: (balance) => formatNumber(balance.mainUsage) },
    { key: 'apartments', label: t('consumption.columns.apartmentMeters'), render: (balance) => formatNumber(balance.apartmentUsage) },
    { key: 'difference', label: t('consumption.columns.waterLoss'), render: (balance) => formatNumber(balance.difference) },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        {mode !== 'resident' ? (
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
        ) : (
          <Typography variant="h6">{t('consumption.resident.history')}</Typography>
        )}
        {canEditReadings && (
          <Button variant="contained" onClick={() => setSubmitOpen(true)}>
            {mode === 'resident' ? t('consumption.actions.submitIndex') : t('consumption.actions.addReading')}
          </Button>
        )}
      </Paper>

      <ResponsiveDataView
        ariaLabel={t('consumption.sections.readings')}
        columns={readingColumns}
        emptyState={(
          <EmptyState
            actionLabel={dedicatedEmptyStateActionLabel}
            headline={t('emptyState.headline', { information: t(mode === 'resident' ? 'emptyState.information.waterIndex' : 'emptyState.information.consumption') })}
            helperText={t('emptyState.helper.dedicated', { information: t(mode === 'resident' ? 'emptyState.information.waterIndex' : 'emptyState.information.consumption') })}
            {...dedicatedEmptyStateAction}
          />
        )}
        getRowId={(reading) => reading.id}
        rows={visibleReadings}
      />

      {mode !== 'resident' && visibleReadings.length > 0 && (
        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography variant="h6">{t('consumption.sections.anomalies')}</Typography>
          <ResponsiveDataView ariaLabel={t('consumption.sections.anomalies')} columns={summaryColumns} getRowId={(summary) => `${summary.apartment.id}-${summary.month}`} rows={summaries} />
          <Typography variant="h6">{t('consumption.sections.waterBalance')}</Typography>
          <ResponsiveDataView ariaLabel={t('consumption.sections.waterBalance')} columns={waterBalanceColumns} getRowId={(balance) => `${balance.block.id}-${balance.month}`} rows={waterBalances} />
        </Box>
      )}

      <Dialog open={submitOpen} onClose={() => setSubmitOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{mode === 'resident' ? t('consumption.dialog.submitTitle') : t('consumption.dialog.adminTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {mode === 'resident' && (
            <FormControl fullWidth>
              <InputLabel>{t('consumption.columns.apartment')}</InputLabel>
              <Select label={t('consumption.columns.apartment')} value={selectedApartmentId} onChange={(event: SelectChangeEvent) => setSelectedApartmentId(event.target.value)}>
                {apartments.map((apartment) => (
                  <MenuItem key={apartment.id} value={apartment.id}>
                    {formatApartment(apartment)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField label={t('consumption.dialog.coldWaterIndex')} type="number" fullWidth />
            <TextField label={t('consumption.dialog.hotWaterIndex')} type="number" fullWidth />
          </Box>
          <TextField label={t('finance.columns.month')} fullWidth defaultValue="05-2026" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => setSubmitOpen(false)}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ConsumptionSections
