import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import SectionVisibilitySelector, { type SectionVisibilityOption } from '../../../../../components/shared/SectionVisibilitySelector'
import StatusChip from '../../../../../components/shared/StatusChip'
import { formatApartment, formatMonth, formatNumber, useConsumption, useResidentPortal, type WaterReadingRow } from '../../../../../hooks/useApartmentData'

type ConsumptionSectionsProps = {
  mode: 'admin' | 'resident' | 'censor'
}

type ConsumptionSectionId = 'readings' | 'anomalies' | 'waterBalance'
const tableEmptyValue = '-'

const ConsumptionSections: React.FC<ConsumptionSectionsProps> = ({ mode }) => {
  const { t } = useTranslation()
  const { blockFilter, blocks, readings, setBlockFilter, summaries, waterBalances } = useConsumption()
  const { apartments, residentReadings } = useResidentPortal()
  const [submitOpen, setSubmitOpen] = React.useState(false)
  const [selectedApartmentId, setSelectedApartmentId] = React.useState(apartments[0]?.id ?? '')
  const [visibleSectionIds, setVisibleSectionIds] = React.useState<ConsumptionSectionId[]>(['readings', 'anomalies', 'waterBalance'])
  const visibleReadings = mode === 'resident' ? residentReadings : readings
  const canEditReadings = mode !== 'censor'
  const dedicatedEmptyStateAction = canEditReadings ? { onAction: () => setSubmitOpen(true) } : { actionTo: '/admin/finance' }
  const dedicatedEmptyStateActionLabel = canEditReadings
    ? mode === 'resident' ? t('consumption.actions.submitIndex') : t('consumption.actions.addReading')
    : t('censor.actions.openQueue')
  const renderMeter = (meter: WaterReadingRow['meters']['cold']) =>
    meter ? t('consumption.columns.meterValue', { previous: formatNumber(meter.previousValue), current: formatNumber(meter.currentValue), usage: formatNumber(meter.usageValue) }) : tableEmptyValue

  const sectionVisibilityOptions: SectionVisibilityOption<ConsumptionSectionId>[] = [
    { id: 'readings', label: t('consumption.sections.readings') },
    { id: 'anomalies', label: t('consumption.sections.anomalies') },
    { id: 'waterBalance', label: t('consumption.sections.waterBalance') },
  ]

  const isSectionVisible = (sectionId: ConsumptionSectionId) => visibleSectionIds.includes(sectionId)

  const handleSectionVisibilityToggle = (sectionId: ConsumptionSectionId) => {
    setVisibleSectionIds((currentSectionIds) => {
      if (currentSectionIds.includes(sectionId)) {
        return currentSectionIds.length > 1 ? currentSectionIds.filter((currentSectionId) => currentSectionId !== sectionId) : currentSectionIds
      }

      return [...currentSectionIds, sectionId]
    })
  }

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
    { key: 'block', label: t('residents.filters.block'), cardRole: 'primary', render: (balance) => balance.block.name || tableEmptyValue },
    { key: 'month', label: t('finance.columns.month'), render: (balance) => formatMonth(balance.month) },
    { key: 'main', label: t('consumption.columns.mainMeter'), render: (balance) => formatNumber(balance.mainUsage) },
    { key: 'apartments', label: t('consumption.columns.apartmentMeters'), render: (balance) => formatNumber(balance.apartmentUsage) },
    { key: 'difference', label: t('consumption.columns.waterLoss'), render: (balance) => formatNumber(balance.difference) },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <FilterBar
        actions={canEditReadings ? (
          <Button variant="contained" onClick={() => setSubmitOpen(true)}>
            {mode === 'resident' ? t('consumption.actions.submitIndex') : t('consumption.actions.addReading')}
          </Button>
        ) : undefined}
      >
        {mode !== 'resident' ? (
          <FormControl size="small" sx={{ minWidth: { sm: 180 } }}>
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
        {mode !== 'resident' && (
          <SectionVisibilitySelector
            ariaLabel={t('consumption.visibility.ariaLabel')}
            label={t('consumption.visibility.label')}
            minimumVisibleMessage={t('consumption.visibility.minimumVisible')}
            onToggle={handleSectionVisibilityToggle}
            options={sectionVisibilityOptions}
            visibleCountLabel={t('consumption.visibility.visibleCount', { count: visibleSectionIds.length })}
            visibleIds={visibleSectionIds}
          />
        )}
      </FilterBar>

      {(mode === 'resident' || isSectionVisible('readings')) && (
        <Box sx={{ display: 'grid', gap: 1 }}>
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
        </Box>
      )}

      {mode !== 'resident' && visibleReadings.length > 0 && (
        <Box sx={{ display: 'grid', gap: 1 }}>
          {isSectionVisible('anomalies') && (
            <>
              <Typography variant="h6">{t('consumption.sections.anomalies')}</Typography>
              <ResponsiveDataView ariaLabel={t('consumption.sections.anomalies')} columns={summaryColumns} getRowId={(summary) => `${summary.apartment.id}-${summary.month}`} rows={summaries} />
            </>
          )}
          {isSectionVisible('waterBalance') && (
            <>
              <Typography variant="h6">{t('consumption.sections.waterBalance')}</Typography>
              <ResponsiveDataView ariaLabel={t('consumption.sections.waterBalance')} columns={waterBalanceColumns} getRowId={(balance) => `${balance.block.id}-${balance.month}`} rows={waterBalances} />
            </>
          )}
        </Box>
      )}

      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.save')}
        contentSx={{ display: 'grid', gap: 2 }}
        onCancel={() => setSubmitOpen(false)}
        onConfirm={() => setSubmitOpen(false)}
        open={submitOpen}
        title={mode === 'resident' ? t('consumption.dialog.submitTitle') : t('consumption.dialog.adminTitle')}
      >
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
      </AppDialog>
    </Box>
  )
}

export default ConsumptionSections
