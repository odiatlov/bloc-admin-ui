import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import StatusChip from '../../../../../components/shared/StatusChip'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { useWaterConsumptions } from '../../../../../hooks/useWaterConsumptions'
import type { WaterConsumptionRow } from '../../../../../types/waterReadings'
import { formatNumber as format } from '../../../../../utils/formatters'
import ResidentWaterIndexSection from './ResidentWaterIndexSection'
import WaterReadingDialog from './WaterReadingDialog'

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
  const { blocks, blockFilter, setBlockFilter, period, setPeriod, minimumPeriod, rows, loading, error, refresh } = useWaterConsumptions({ submissionPeriodsOnly: true })
  const [open, setOpen] = React.useState(false)
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
  const incompleteApartments = rows.filter((row) => row.meters.some((meter) => meter.isActive && meter.current === null))

  return <Box sx={{ display: 'grid', gap: 2 }}>
    <FilterBar actions={mode === 'admin' ? <Button startIcon={<AddIcon />} variant="contained" disabled={loading || !!error || incompleteApartments.length === 0} onClick={() => {
      setOpen(true)
    }}>{t('consumption.actions.addReading')}</Button> : undefined}>
      <TextField select size="small" disabled={loading || !!error} label={t('residents.filters.block')} value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)} sx={{ minWidth: 180 }}>
        <MenuItem value="all">{t('common.all')}</MenuItem>
        {blocks.map((block) => <MenuItem key={block.id} value={block.id}>{t('common.blockValue', { block: block.name })}</MenuItem>)}
      </TextField>
      <AppDatePicker monthOnly confirmOnAccept disabled={loading || !!error} label={t('finance.columns.month')} value={period}
        minDate={`${minimumPeriod ?? period}-01`} maxDate="2100-12-31" onChange={setPeriod} />
    </FilterBar>
    {loading ? <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><CircularProgress size={24} />{t('consumption.loading')}</Box>
      : error ? <LoadErrorState helperText={t('consumption.errors.loadFailed')} onRetry={refresh} />
        : rows.length === 0 ? <EmptyState headline={t('consumption.report.empty')} helperText={t('consumption.report.emptyHelper')}
          actionLabel={t('common.retry')} onAction={refresh} />
          : <ResponsiveDataView ariaLabel={t('consumption.sections.readings')} columns={columns} getRowId={(row) => row.id} rows={rows} />}
    {mode === 'admin' && open && <WaterReadingDialog
      title={t('consumption.dialog.adminTitle')} year={Number(period.split('-')[0])} month={Number(period.split('-')[1])}
      apartments={incompleteApartments.map((row) => ({ id: row.id, label: label(row),
        meters: row.meters.filter((meter) => meter.isActive || meter.current !== null),
      }))}
      onClose={(changed) => { setOpen(false); if (changed) refresh() }} />}
  </Box>
}

export default ConsumptionSections
