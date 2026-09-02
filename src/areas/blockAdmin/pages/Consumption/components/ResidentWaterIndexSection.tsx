import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import AppDialog from '../../../../../components/shared/AppDialog'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../../components/shared/StatusChip'
import { formatNumber } from '../../../../../hooks/useApartmentData'
import { useResidentWaterIndex } from '../../../../../hooks/useResidentWaterIndex'
import type { ResidentWaterMeterRow } from '../../../../../types/waterReadings'

const currentPeriodDate = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}-01`
const parsePeriodDate = (value: string) => {
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

const normalizeUtilityKey = (utilityType: string) => {
  const normalized = utilityType.trim().toLowerCase()
  if (normalized === 'hot' || normalized === 'hotwater' || normalized === 'hot_water') return 'hot'
  if (normalized === 'cold' || normalized === 'coldwater' || normalized === 'cold_water') return 'cold'
  return 'custom'
}

const normalizeLocationKey = (locationType: string) => {
  const normalized = locationType.trim().toLowerCase()
  if (normalized === 'kitchen') return 'kitchen'
  if (normalized === 'bathroom') return 'bathroom'
  if (normalized === 'secondarybathroom' || normalized === 'secondary_bathroom') return 'secondaryBathroom'
  if (normalized === 'servicetoilet' || normalized === 'service_toilet') return 'serviceToilet'
  return 'custom'
}

type ApartmentWaterSummaryRow = {
  id: string
  apartmentId: string
  year: number
  month: number
  coldTotal: number | null
  hotTotal: number | null
  missingCount: number
  submittedCount: number
  totalCount: number
}

const ResidentWaterIndexSection: React.FC = () => {
  const { t } = useTranslation()
  const {
    apartments,
    error,
    hasConfiguredSubmissionDate,
    loading,
    meters,
    month,
    refresh,
    rows,
    setPeriod,
    submitReadings,
    submitting,
    year,
  } = useResidentWaterIndex()
  const [submitOpen, setSubmitOpen] = React.useState(false)
  const [selectedApartmentId, setSelectedApartmentId] = React.useState('')
  const [dialogPeriod, setDialogPeriod] = React.useState({ year, month })
  const [readingValues, setReadingValues] = React.useState<Record<string, string>>({})
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const effectiveApartmentId = selectedApartmentId || apartments[0]?.apartmentId || ''
  const selectedApartmentRows = React.useMemo(
    () => rows.filter((row) =>
      row.apartmentId === effectiveApartmentId
      && row.year === dialogPeriod.year
      && row.month === dialogPeriod.month,
    ),
    [dialogPeriod.month, dialogPeriod.year, effectiveApartmentId, rows],
  )
  const coldRows = React.useMemo(
    () => selectedApartmentRows.filter((row) => normalizeUtilityKey(row.utilityType) === 'cold'),
    [selectedApartmentRows],
  )
  const hotRows = React.useMemo(
    () => selectedApartmentRows.filter((row) => normalizeUtilityKey(row.utilityType) === 'hot'),
    [selectedApartmentRows],
  )

  const formatApartmentLabel = (apartmentId: string) => {
    const apartment = apartments.find((item) => item.apartmentId === apartmentId)
    if (!apartment) return t('common.notAvailable')

    return [
      t('common.blockValue', { block: apartment.blockName }),
      apartment.staircaseName ? t('consumption.location.staircaseValue', { staircase: apartment.staircaseName }) : null,
      t('consumption.location.apartmentValue', { apartment: apartment.apartmentNumber }),
    ].filter(Boolean).join(', ')
  }

  const formatLocation = (locationType: string) => {
    const key = normalizeLocationKey(locationType)
    return key === 'custom' ? locationType : t(`consumption.waterLocation.${key}`)
  }

  const formatPeriod = (periodYear: number, periodMonth: number) => new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(periodYear, periodMonth - 1, 1))

  const canSubmitIndex = hasConfiguredSubmissionDate && meters.length > 0
  const hasMissingSelectedReadings = selectedApartmentRows.some((row) => row.value === null)

  const summaryRows = React.useMemo<ApartmentWaterSummaryRow[]>(() => (
    apartments.flatMap((apartment) => {
      const apartmentPeriods = Array.from(new Set(
        rows
          .filter((row) => row.apartmentId === apartment.apartmentId)
          .map((row) => `${row.year}-${row.month}`),
      ))

      return apartmentPeriods.map((periodKey) => {
        const [periodYear, periodMonth] = periodKey.split('-').map(Number)
        const apartmentRows = rows.filter((row) =>
          row.apartmentId === apartment.apartmentId
          && row.year === periodYear
          && row.month === periodMonth,
        )
        const coldValues = apartmentRows
          .filter((row) => normalizeUtilityKey(row.utilityType) === 'cold' && row.value !== null)
          .map((row) => row.value ?? 0)
        const hotValues = apartmentRows
          .filter((row) => normalizeUtilityKey(row.utilityType) === 'hot' && row.value !== null)
          .map((row) => row.value ?? 0)
        const submittedCount = apartmentRows.filter((row) => row.value !== null).length

        return {
          id: `${apartment.apartmentId}-${periodYear}-${periodMonth}`,
          apartmentId: apartment.apartmentId,
          year: periodYear,
          month: periodMonth,
          coldTotal: coldValues.length === 0 ? null : coldValues.reduce((sum, value) => sum + value, 0),
          hotTotal: hotValues.length === 0 ? null : hotValues.reduce((sum, value) => sum + value, 0),
          missingCount: apartmentRows.length - submittedCount,
          submittedCount,
          totalCount: apartmentRows.length,
        }
      })
    }).filter((row) => row.totalCount > 0)
      .sort((first, second) => second.year - first.year || second.month - first.month)
  ), [apartments, rows])

  const dialogColdTotal = coldRows.reduce((sum, row) => sum + (Number(readingValues[row.meterId]) || 0), 0)
  const dialogHotTotal = hotRows.reduce((sum, row) => sum + (Number(readingValues[row.meterId]) || 0), 0)
  const canConfirmSubmit = selectedApartmentRows
    .filter((row) => row.value === null)
    .every((row) => {
      const value = Number(readingValues[row.meterId])
      return readingValues[row.meterId] !== '' && Number.isFinite(value) && value >= 0
    })

  const openSubmitDialog = (row?: ApartmentWaterSummaryRow) => {
    if (!canSubmitIndex) return
    setSubmitError(null)
    const apartmentId = row?.apartmentId ?? effectiveApartmentId
    const period = row ? { year: row.year, month: row.month } : { year, month }
    const apartmentRows = rows.filter((item) =>
      item.apartmentId === apartmentId
      && item.year === period.year
      && item.month === period.month,
    )
    setSelectedApartmentId(apartmentId)
    setDialogPeriod(period)
    setReadingValues(Object.fromEntries(apartmentRows.map((item) => [
      item.meterId,
      item.value === null ? '' : String(item.value),
    ])))
    setSubmitOpen(true)
  }

  const handleApartmentChange = (apartmentId: string) => {
    const apartmentRows = rows.filter((item) =>
      item.apartmentId === apartmentId
      && item.year === dialogPeriod.year
      && item.month === dialogPeriod.month,
    )
    setSelectedApartmentId(apartmentId)
    setSubmitError(null)
    setReadingValues(Object.fromEntries(apartmentRows.map((item) => [
      item.meterId,
      item.value === null ? '' : String(item.value),
    ])))
  }

  const handleSubmit = async () => {
    const readingsToSubmit = selectedApartmentRows
      .filter((row) => row.value === null)
      .map((row) => ({ meterId: row.meterId, value: Number(readingValues[row.meterId]) }))

    if (readingsToSubmit.length === 0 || readingsToSubmit.some((reading) => !Number.isFinite(reading.value) || reading.value < 0)) {
      setSubmitError(t('consumption.errors.invalidReading'))
      return
    }

    try {
      setSubmitError(null)
      await submitReadings(readingsToSubmit, dialogPeriod)
      setSubmitOpen(false)
    } catch (nextError) {
      setSubmitError(nextError instanceof Error ? nextError.message : t('consumption.errors.submitFailed'))
    }
  }

  const renderTotal = (value: number | null) => value === null ? t('common.notAvailable') : formatNumber(value)

  const renderDialogSection = (title: string, sectionRows: ResidentWaterMeterRow[], total: number) => sectionRows.length === 0 ? null : (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Typography variant="subtitle1">{title}</Typography>
      {sectionRows.map((row) => (
        <TextField
          key={row.meterId}
          disabled={row.value !== null}
          fullWidth
          label={formatLocation(row.locationType)}
          onChange={(event) => setReadingValues((values) => ({ ...values, [row.meterId]: event.target.value }))}
          size="small"
          type="number"
          value={readingValues[row.meterId] ?? ''}
        />
      ))}
      <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>{t('consumption.dialog.total')}</Typography>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatNumber(total)}</Typography>
      </Box>
    </Box>
  )

  const columns: DataColumn<ApartmentWaterSummaryRow>[] = [
    { key: 'month', label: t('finance.columns.month'), render: (row) => formatPeriod(row.year, row.month) },
    { key: 'apartment', label: t('consumption.columns.apartment'), cardRole: 'primary', render: (row) => formatApartmentLabel(row.apartmentId) },
    { key: 'coldWater', label: t('consumption.waterType.cold'), render: (row) => renderTotal(row.coldTotal) },
    { key: 'hotWater', label: t('consumption.waterType.hot'), render: (row) => renderTotal(row.hotTotal) },
    {
      key: 'status',
      label: t('consumption.columns.status'),
      cardRole: 'status',
      render: (row) => row.submittedCount === 0
        ? <StatusChip status="warning" label={t('consumption.status.missing')} />
        : row.missingCount > 0
          ? <StatusChip status="pending" label={t('consumption.status.partial')} />
          : <StatusChip status="normal" label={t('consumption.status.submitted')} />,
    },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: (row) => row.missingCount > 0 ? (
        <Button size="small" variant="outlined" onClick={() => openSubmitDialog(row)}>
          {t('consumption.actions.submitIndex')}
        </Button>
      ) : null,
    },
  ]

  if (loading) {
    return (
      <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
        <CircularProgress size={32} />
        <Typography color="text.secondary">{t('consumption.loading')}</Typography>
      </Paper>
    )
  }

  if (error) {
    return <LoadErrorState helperText={t('consumption.errors.loadFailed')} onRetry={() => { void refresh() }} />
  }

  if (apartments.length === 0) {
    return (
      <EmptyState
        actionLabel={t('common.refresh')}
        headline={t('consumption.empty.noApartmentsHeadline')}
        helperText={t('consumption.empty.noApartmentsHelper')}
        onAction={() => { void refresh() }}
      />
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <FilterBar
        actions={(
          <Button variant="contained" onClick={() => openSubmitDialog()} disabled={!canSubmitIndex}>
            {t('consumption.actions.submitIndex')}
          </Button>
        )}
      >
        <Box sx={{ minWidth: { xs: '100%', sm: 260 } }}>
          <AppDatePicker
            label={t('consumption.dialog.readingDate')}
            onChange={(value) => setPeriod(parsePeriodDate(value))}
            value={currentPeriodDate(year, month)}
          />
        </Box>
      </FilterBar>

      <ResponsiveDataView
        ariaLabel={t('consumption.sections.readings')}
        columns={columns}
        emptyState={(
          meters.length === 0
            ? (
              <EmptyState
                actionLabel={t('common.refresh')}
                headline={hasConfiguredSubmissionDate
                  ? t('consumption.empty.noMetersHeadline')
                  : t('consumption.empty.noSubmissionDateHeadline')}
                helperText={hasConfiguredSubmissionDate
                  ? t('consumption.empty.noMetersHelper')
                  : t('consumption.empty.noSubmissionDateHelper')}
                onAction={() => { void refresh() }}
              />
            )
            : (
              <EmptyState
                actionLabel={t('consumption.actions.submitIndex')}
                headline={t('emptyState.headline', { information: t('emptyState.information.waterIndex') })}
                helperText={t('emptyState.helper.residentIndexOnly')}
                onAction={() => openSubmitDialog()}
              />
            )
        )}
        getRowId={(row) => row.id}
        rows={summaryRows}
      />

      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={submitting || !hasMissingSelectedReadings || !canConfirmSubmit}
        confirmLabel={submitting ? t('consumption.actions.submitting') : t('common.save')}
        contentSx={{ display: 'grid', gap: 2, pt: 1 }}
        onCancel={() => setSubmitOpen(false)}
        onConfirm={() => { void handleSubmit() }}
        open={submitOpen}
        title={t('consumption.dialog.submitTitle')}
      >
        {submitError && (
          <Typography color="error" variant="body2">{submitError}</Typography>
        )}
        <FormControl fullWidth>
          <InputLabel>{t('consumption.columns.apartment')}</InputLabel>
          <Select
            label={t('consumption.columns.apartment')}
            value={effectiveApartmentId}
            onChange={(event: SelectChangeEvent) => handleApartmentChange(event.target.value)}
          >
            {apartments.map((apartment) => (
              <MenuItem key={apartment.apartmentId} value={apartment.apartmentId}>
                {formatApartmentLabel(apartment.apartmentId)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {renderDialogSection(t('consumption.dialog.coldWaterReadings'), coldRows, dialogColdTotal)}
        {coldRows.length > 0 && hotRows.length > 0 && <Divider />}
        {renderDialogSection(t('consumption.dialog.hotWaterReadings'), hotRows, dialogHotTotal)}
      </AppDialog>
    </Box>
  )
}

export default ResidentWaterIndexSection
