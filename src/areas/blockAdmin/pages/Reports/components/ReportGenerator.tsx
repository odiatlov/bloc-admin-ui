import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PreviewIcon from '@mui/icons-material/Preview'
import { useTranslation } from 'react-i18next'
import FilterBar from '../../../../../components/shared/FilterBar'
import { formatCurrency, formatNumber, formatSquareMeters, useReports } from '../../../../../hooks/useApartmentData'
import { useWaterConsumptions } from '../../../../../hooks/useWaterConsumptions'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import EmptyState from '../../../../../components/shared/EmptyState'
import { apartmentsApi } from '../../../../../services/apartmentsApi'
import type { ApartmentResponse } from '../../../../../types/management'

const ReportGenerator: React.FC = () => {
  const { t, i18n } = useTranslation()
  const water = useWaterConsumptions({ registeredPeriodsOnly: true })
  const { period: month, setPeriod: setMonth, blockFilter: block, setBlockFilter: setBlock } = water
  const { preview } = useReports(month)
  const monthOptions = water.availablePeriods.map((period) => {
    const date = new Date(`${period}-01T12:00:00`)
    return {
      value: period,
      label: new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(date),
    }
  })
  const [databaseApartments, setDatabaseApartments] = React.useState<ApartmentResponse[]>([])
  const allowedBlockIds = React.useMemo(
    () => new Set(water.blocks.map((item) => item.id)),
    [water.blocks],
  )
  const scopedApartments = React.useMemo(
    () => databaseApartments.filter((apartment) => allowedBlockIds.has(apartment.blockId)),
    [allowedBlockIds, databaseApartments],
  )

  React.useEffect(() => {
    let isMounted = true

    const loadApartments = async () => {
      try {
        const nextApartments = await apartmentsApi.getAll()
        if (isMounted) setDatabaseApartments(nextApartments)
      } catch {
        if (isMounted) setDatabaseApartments([])
      }
    }

    void loadApartments()

    return () => {
      isMounted = false
    }
  }, [])

  const surfaceTotal = React.useMemo(() => {
    if (scopedApartments.length === 0) return 0

    return scopedApartments
      .filter((apartment) => block === 'all' || apartment.blockId === block)
      .reduce((sum, apartment) => sum + (apartment.usableSqm ?? 0), 0)
  }, [block, scopedApartments])

  const meters = water.rows.flatMap((row) => row.meters)
  const knownMeters = meters.filter((meter) => meter.usage !== null)
  const waterTotal = knownMeters.reduce((sum, meter) => sum + meter.usage!, 0)
  const incomplete = meters.length !== knownMeters.length || water.rows.some((row) => row.status !== 'complete')
  const readingStatus = water.rows.some((row) => row.status === 'invalid') ? 'invalid'
    : meters.length === 0 ? 'noMeters' : incomplete ? 'incomplete' : 'complete'
  const waterLabel = !water.loading && !water.error && water.rows.length > 0
    ? `${t('reports.preview.waterUsage')} (${t(`consumption.report.${readingStatus}`)})`
    : t('reports.preview.waterUsage')
  const waterValue = water.loading ? <CircularProgress size={24} aria-label={t('consumption.loading')} />
    : water.error ? <LoadErrorState helperText={t('consumption.errors.loadFailed')} onRetry={water.refresh} />
      : water.rows.length === 0 ? <EmptyState headline={t('consumption.report.empty')} helperText={t('consumption.report.emptyHelper')}
        actionLabel={t('common.retry')} onAction={water.refresh} />
        : knownMeters.length > 0 ? `${formatNumber(waterTotal)} ${t('reports.preview.units.water')}` : t('common.notAvailable')

  const metrics = [
    { key: 'invoices', label: t('reports.preview.invoices'), value: preview.invoiceCount },
    { key: 'revenue', label: t('reports.preview.revenue'), value: formatCurrency(preview.revenue) },
    { key: 'waterUsage', label: waterLabel, value: waterValue },
    { key: 'surfaceTotal', label: t('reports.preview.surfaceTotal'), value: formatSquareMeters(surfaceTotal) },
    { key: 'boilerTax', label: t('reports.preview.boilerTax'), value: formatCurrency(preview.boilerTax) },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <FilterBar
        actions={(
          <>
            <Button startIcon={<PreviewIcon />} variant="outlined">
              {t('reports.actions.preview')}
            </Button>
            <Button startIcon={<FileDownloadIcon />} variant="contained">
              {t('reports.actions.export')}
            </Button>
          </>
        )}
      >
        <TextField select size="small" disabled={water.loading || !!water.error} label={t('reports.filters.month')}
          value={monthOptions.some((option) => option.value === month) ? month : 'all'}
          onChange={(event) => setMonth(event.target.value)}
          slotProps={{ select: { MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } } } }}>
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {monthOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
        </TextField>
        <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
          <InputLabel>{t('residents.filters.block')}</InputLabel>
          <Select disabled={water.loading || !!water.error} label={t('residents.filters.block')} value={block} onChange={(event: SelectChangeEvent) => setBlock(event.target.value)}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {water.blocks.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {t('common.blockValue', { block: item.name })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('reports.preview.title')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gridAutoRows: '1fr', gap: 2 }}>
          {metrics.map((metric) => (
            <Paper key={metric.key} variant="outlined" sx={{ p: 2, minHeight: 84, display: 'grid', alignContent: 'start', gap: 0.75 }}>
              <Typography variant="body2" color="text.secondary">
                {metric.label}
              </Typography>
              <Typography component="div" variant="h5" sx={{ overflowWrap: 'anywhere', lineHeight: 1.2 }}>
                {metric.value}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}

export default ReportGenerator
