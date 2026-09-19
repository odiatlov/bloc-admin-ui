import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import StatusChip from '../../../../../components/shared/StatusChip'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { useWaterConsumptions } from '../../../../../hooks/useWaterConsumptions'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'
import type { WaterConsumptionRow } from '../../../../../types/waterReadings'
import { formatNumber as format } from '../../../../../utils/formatters'
import ResidentWaterIndexSection from './ResidentWaterIndexSection'

type ConsumptionSectionsProps = { mode: 'admin' | 'resident' | 'censor' }

const consumptionChipStatus: Record<WaterConsumptionRow['status'], string> = {
  complete: 'completed',
  incomplete: 'warning',
  noMeters: 'critical',
  invalid: 'critical',
}

const ConsumptionSections: React.FC<ConsumptionSectionsProps> = ({ mode }) => mode === 'resident'
  ? <ResidentWaterIndexSection /> : <AdminConsumptionSections mode={mode} />

const AdminConsumptionSections: React.FC<ConsumptionSectionsProps> = ({ mode }) => {
  const { t, i18n } = useTranslation()
  const { blocks, blockFilter, setBlockFilter, period, setPeriod, rows, loading, error, refresh } = useWaterConsumptions()
  const [open, setOpen] = React.useState(false)
  const [apartmentId, setApartmentId] = React.useState('')
  const [meterId, setMeterId] = React.useState('')
  const [value, setValue] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const selectedRow = rows.find((row) => row.id === apartmentId)
  const availableMeters = selectedRow?.meters.filter((meter) => meter.isActive && meter.current === null) ?? []
  const selectedMeter = availableMeters.find((meter) => meter.id === meterId)
  const apartmentLabel = (row: WaterConsumptionRow) => [
    t('consumption.location.apartmentValue', { apartment: row.apartment.number }),
    row.apartment.staircaseName && t('consumption.location.staircaseValue', { staircase: row.apartment.staircaseName }),
  ].filter(Boolean).join(' - ')
  const label = (row: WaterConsumptionRow) => [
    apartmentLabel(row),
    t('common.blockValue', { block: row.apartment.blockName }),
  ].filter(Boolean).join(' - ')
  const renderMeters = (row: WaterConsumptionRow, utility: string) => {
    const meters = row.meters.filter((meter) => meter.utilityType === utility)
    return meters.length === 0 ? '-' : <Box sx={{ display: 'grid', gap: 0.5 }}>{meters.map((meter) => (
      <Typography key={meter.id} variant="body2">
        {meter.name}: {t('consumption.columns.meterValue', {
          previous: meter.previous === null ? '-' : format(meter.previous),
          current: meter.current === null ? '-' : format(meter.current),
          usage: meter.usage === null ? '-' : `${format(meter.usage)} m\u00b3`,
        })}
      </Typography>
    ))}</Box>
  }
  const columns: DataColumn<WaterConsumptionRow>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), cardRole: 'primary', render: apartmentLabel },
    { key: 'block', label: t('residents.filters.block'), render: (row) => row.apartment.blockName },
    { key: 'month', label: t('finance.columns.month'), render: () => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(`${period}-01T12:00:00`)) },
    { key: 'cold', label: t('consumption.waterType.cold'), render: (row) => renderMeters(row, 'ColdWater') },
    { key: 'hot', label: t('consumption.waterType.hot'), render: (row) => renderMeters(row, 'HotWater') },
    { key: 'total', label: `${t('consumption.columns.totalUsage')} (m\u00b3)`, render: (row) => row.usage === null ? '-' : format(row.usage) },
    { key: 'status', label: t('consumption.columns.status'), cardRole: 'status', render: (row) => <StatusChip status={consumptionChipStatus[row.status]} label={t(`consumption.report.${row.status}`)} /> },
  ]
  const validValue = value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
    && (selectedMeter?.previous == null || Number(value) >= selectedMeter.previous)
  const submit = async () => {
    if (mode !== 'admin' || !selectedMeter || !validValue || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const [year, month] = period.split('-').map(Number)
      await waterReadingsApi.createReading({ apartmentWaterMeterId: selectedMeter.id, year, month, value: Number(value) })
      setOpen(false)
      refresh()
    } catch (nextError) {
      setSubmitError(nextError instanceof Error ? nextError.message : t('consumption.errors.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return <Box sx={{ display: 'grid', gap: 2 }}>
    <FilterBar actions={mode === 'admin' ? <Button startIcon={<AddIcon />} variant="contained" disabled={loading || !!error || rows.length === 0} onClick={() => {
      setApartmentId(''); setMeterId(''); setValue(''); setSubmitError(null); setOpen(true)
    }}>{t('consumption.actions.addReading')}</Button> : undefined}>
      <TextField select size="small" disabled={loading || !!error} label={t('residents.filters.block')} value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)} sx={{ minWidth: 180 }}>
        <MenuItem value="all">{t('common.all')}</MenuItem>
        {blocks.map((block) => <MenuItem key={block.id} value={block.id}>{t('common.blockValue', { block: block.name })}</MenuItem>)}
      </TextField>
      <AppDatePicker monthOnly confirmOnAccept disabled={!!error} label={t('finance.columns.month')} value={period}
        minDate="2000-01-01" maxDate="2100-12-31" onChange={setPeriod} />
    </FilterBar>
    {loading ? <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><CircularProgress size={24} />{t('consumption.loading')}</Box>
      : error ? <LoadErrorState helperText={t('consumption.errors.loadFailed')} onRetry={refresh} />
        : rows.length === 0 ? <EmptyState headline={t('consumption.report.empty')} helperText={t('consumption.report.emptyHelper')}
          actionLabel={t('common.retry')} onAction={refresh} />
          : <ResponsiveDataView ariaLabel={t('consumption.sections.readings')} columns={columns} getRowId={(row) => row.id} rows={rows} />}
    {mode === 'admin' && <AppDialog open={open} title={t('consumption.dialog.adminTitle')}
      cancelLabel={t('common.cancel')} confirmLabel={t(submitting ? 'consumption.actions.submitting' : 'common.save')}
      confirmDisabled={submitting || !selectedMeter || !validValue} onCancel={() => { if (!submitting) setOpen(false) }}
      onConfirm={() => { void submit() }} contentSx={{ display: 'grid', gap: 2, pt: 1 }}>
      {submitError && <Alert severity="error">{submitError}</Alert>}
      <TextField label={t('finance.columns.month')} value={period} disabled />
      <TextField select label={t('consumption.columns.apartment')} value={apartmentId} disabled={submitting}
        onChange={(event) => { setApartmentId(event.target.value); setMeterId(''); setValue('') }}>
        {rows.map((row) => <MenuItem key={row.id} value={row.id}>{label(row)}</MenuItem>)}
      </TextField>
      <TextField select label={t('consumption.columns.meter')} value={meterId} disabled={submitting || !apartmentId}
        helperText={apartmentId && availableMeters.length === 0 ? t('consumption.report.noPendingMeters') : undefined}
        onChange={(event) => { setMeterId(event.target.value); setValue('') }}>
        {availableMeters.map((meter) => <MenuItem key={meter.id} value={meter.id}>{t(meter.utilityType === 'HotWater' ? 'consumption.waterType.hot' : 'consumption.waterType.cold')} - {meter.name}</MenuItem>)}
      </TextField>
      <TextField label={t('consumption.columns.current')} type="number" value={value} disabled={submitting || !meterId}
        onChange={(event) => setValue(event.target.value)} error={value !== '' && !validValue}
        helperText={value !== '' && !validValue ? t('consumption.errors.invalidReading') : selectedMeter?.previous != null ? t('consumption.errors.previousReadingHelper', { value: format(selectedMeter.previous) }) : undefined}
        slotProps={{ htmlInput: { min: selectedMeter?.previous ?? 0, step: 'any' } }} />
    </AppDialog>}
  </Box>
}

export default ConsumptionSections
