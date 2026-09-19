import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../../components/shared/StatusChip'
import { formatNumber } from '../../../../../hooks/useApartmentData'
import { useResidentWaterIndex } from '../../../../../hooks/useResidentWaterIndex'
import type { ResidentWaterMeterRow } from '../../../../../types/waterReadings'
import WaterReadingDialog from './WaterReadingDialog'

const getTodayDate = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

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
  coldPreviousTotal: number | null
  coldTotal: number | null
  coldConsumption: number | null
  hotPreviousTotal: number | null
  hotTotal: number | null
  hotConsumption: number | null
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
    year,
  } = useResidentWaterIndex()
  const [submitOpen, setSubmitOpen] = React.useState(false)
  const [selectedApartmentId, setSelectedApartmentId] = React.useState('')
  const [dialogPeriod, setDialogPeriod] = React.useState({ year, month })
  const [selectedReadingDate, setSelectedReadingDate] = React.useState(getTodayDate)

  const effectiveApartmentId = selectedApartmentId || apartments[0]?.apartmentId || ''
  const getPreviousMonthValue = React.useCallback((row: ResidentWaterMeterRow) => {
    const previousPeriod = new Date(row.year, row.month - 2, 1)
    const previousRow = rows.find((item) =>
      item.meterId === row.meterId
      && item.year === previousPeriod.getFullYear()
      && item.month === previousPeriod.getMonth() + 1,
    )

    return previousRow?.value ?? null
  }, [rows])

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

  const summaryRows = React.useMemo<ApartmentWaterSummaryRow[]>(() => (
    apartments.flatMap((apartment) => {
      const apartmentPeriods = Array.from(new Set(
        rows
          .filter((row) => row.apartmentId === apartment.apartmentId)
          .map((row) => `${row.year}-${row.month}`),
      ))

      const getApartmentTotal = (periodYear: number, periodMonth: number, utilityKey: 'cold' | 'hot') => {
        const values = rows
          .filter((row) =>
            row.apartmentId === apartment.apartmentId
            && row.year === periodYear
            && row.month === periodMonth
            && normalizeUtilityKey(row.utilityType) === utilityKey
            && row.value !== null,
          )
          .map((row) => row.value ?? 0)

        return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0)
      }

      return apartmentPeriods.map((periodKey) => {
        const [periodYear, periodMonth] = periodKey.split('-').map(Number)
        const previousPeriod = new Date(periodYear, periodMonth - 2, 1)
        const apartmentRows = rows.filter((row) =>
          row.apartmentId === apartment.apartmentId
          && row.year === periodYear
          && row.month === periodMonth,
        )
        const coldTotal = getApartmentTotal(periodYear, periodMonth, 'cold')
        const hotTotal = getApartmentTotal(periodYear, periodMonth, 'hot')
        const coldPreviousTotal = getApartmentTotal(previousPeriod.getFullYear(), previousPeriod.getMonth() + 1, 'cold')
        const hotPreviousTotal = getApartmentTotal(previousPeriod.getFullYear(), previousPeriod.getMonth() + 1, 'hot')
        const submittedCount = apartmentRows.filter((row) => row.value !== null).length

        return {
          id: `${apartment.apartmentId}-${periodYear}-${periodMonth}`,
          apartmentId: apartment.apartmentId,
          year: periodYear,
          month: periodMonth,
          coldPreviousTotal,
          coldTotal,
          coldConsumption: coldTotal === null ? null : coldPreviousTotal === null ? 0 : coldTotal - coldPreviousTotal,
          hotPreviousTotal,
          hotTotal,
          hotConsumption: hotTotal === null ? null : hotPreviousTotal === null ? 0 : hotTotal - hotPreviousTotal,
          missingCount: apartmentRows.length - submittedCount,
          submittedCount,
          totalCount: apartmentRows.length,
        }
      })
    }).filter((row) => row.totalCount > 0)
      .sort((first, second) => second.year - first.year || second.month - first.month)
  ), [apartments, rows])

  const openSubmitDialog = (row?: ApartmentWaterSummaryRow) => {
    if (!canSubmitIndex) return
    setSelectedApartmentId(row?.apartmentId ?? effectiveApartmentId)
    setDialogPeriod(row ? { year: row.year, month: row.month } : { year, month })
    setSubmitOpen(true)
  }

  const renderConsumption = (previousTotal: number | null, currentTotal: number | null, consumption: number | null) => {
    if (currentTotal === null || consumption === null) return t('common.notAvailable')
    if (previousTotal === null) return `${formatNumber(currentTotal)} (${formatNumber(consumption)})`
    return `${formatNumber(previousTotal)} \u2192 ${formatNumber(currentTotal)} (${formatNumber(consumption)})`
  }

  const columns: DataColumn<ApartmentWaterSummaryRow>[] = [
    { key: 'month', label: t('finance.columns.month'), render: (row) => formatPeriod(row.year, row.month) },
    { key: 'apartment', label: t('consumption.columns.apartment'), cardRole: 'primary', render: (row) => formatApartmentLabel(row.apartmentId) },
    {
      key: 'coldWater',
      label: `${t('consumption.columns.waterConsumption', { water: t('consumption.waterType.cold') })} (m\u00b3)`,
      render: (row) => renderConsumption(row.coldPreviousTotal, row.coldTotal, row.coldConsumption),
    },
    {
      key: 'hotWater',
      label: `${t('consumption.columns.waterConsumption', { water: t('consumption.waterType.hot') })} (m\u00b3)`,
      render: (row) => renderConsumption(row.hotPreviousTotal, row.hotTotal, row.hotConsumption),
    },
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
            onChange={(value) => {
              setSelectedReadingDate(value)
              setPeriod(parsePeriodDate(value))
            }}
            value={selectedReadingDate}
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

      {submitOpen && <WaterReadingDialog
        title={t('consumption.dialog.submitTitle')} initialApartmentId={effectiveApartmentId}
        year={dialogPeriod.year} month={dialogPeriod.month}
        apartments={apartments.map((apartment) => ({
          id: apartment.apartmentId, label: formatApartmentLabel(apartment.apartmentId),
          meters: rows.filter((row) => row.apartmentId === apartment.apartmentId
            && row.year === dialogPeriod.year && row.month === dialogPeriod.month)
            .map((row) => ({ id: row.meterId, name: formatLocation(row.locationType), utilityType: row.utilityType,
              previous: getPreviousMonthValue(row), current: row.value })),
        }))}
        onClose={(changed) => { setSubmitOpen(false); if (changed) void refresh() }} />}
    </Box>
  )
}

export default ResidentWaterIndexSection
