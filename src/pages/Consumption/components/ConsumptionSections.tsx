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
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatApartment, useConsumption, useResidentPortal } from '../../../hooks/useApartmentData'

type ConsumptionSectionsProps = {
  mode: 'admin' | 'resident'
}

const ConsumptionSections: React.FC<ConsumptionSectionsProps> = ({ mode }) => {
  const { t } = useTranslation()
  const { blockFilter, blocks, readings, setBlockFilter, summaries, waterBalances } = useConsumption()
  const { residentReadings } = useResidentPortal()
  const [submitOpen, setSubmitOpen] = React.useState(false)
  const visibleReadings = mode === 'resident' ? residentReadings.map((reading) => ({ ...reading, usageValue: reading.currentValue - reading.previousValue })) : readings

  const readingColumns: DataColumn<(typeof visibleReadings)[number]>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), render: (reading) => formatApartment(reading.apartment) },
    { key: 'month', label: t('finance.columns.month'), render: (reading) => reading.month },
    { key: 'previous', label: t('consumption.columns.previous'), render: (reading) => reading.previousValue },
    { key: 'current', label: t('consumption.columns.current'), render: (reading) => reading.currentValue },
    { key: 'usage', label: t('consumption.columns.usage'), render: (reading) => reading.usageValue },
  ]

  const summaryColumns: DataColumn<(typeof summaries)[number]>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), render: (summary) => formatApartment(summary.apartment) },
    { key: 'month', label: t('finance.columns.month'), render: (summary) => summary.month },
    { key: 'usage', label: t('consumption.columns.usage'), render: (summary) => summary.usageValue },
    { key: 'anomaly', label: t('consumption.columns.anomaly'), render: (summary) => <StatusChip status={summary.anomaly} label={t(`status.anomaly.${summary.anomaly}`)} /> },
  ]

  const waterBalanceColumns: DataColumn<(typeof waterBalances)[number]>[] = [
    { key: 'block', label: t('residents.filters.block'), render: (balance) => t('common.blockValue', { block: balance.block.name }) },
    { key: 'month', label: t('finance.columns.month'), render: (balance) => balance.month },
    { key: 'main', label: t('consumption.columns.mainMeter'), render: (balance) => balance.mainUsage },
    { key: 'apartments', label: t('consumption.columns.apartmentMeters'), render: (balance) => balance.apartmentUsage },
    { key: 'difference', label: t('consumption.columns.waterLoss'), render: (balance) => balance.difference },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        {mode === 'admin' ? (
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
        <Button variant="contained" onClick={() => setSubmitOpen(true)}>
          {mode === 'resident' ? t('consumption.actions.submitIndex') : t('consumption.actions.addReading')}
        </Button>
      </Paper>

      <ResponsiveDataView ariaLabel={t('consumption.sections.readings')} columns={readingColumns} getRowId={(reading) => reading.id} rows={visibleReadings} />

      {mode === 'admin' && (
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
          <TextField label={t('consumption.columns.current')} type="number" fullWidth />
          <TextField label={t('finance.columns.month')} fullWidth defaultValue="2026-05" />
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
