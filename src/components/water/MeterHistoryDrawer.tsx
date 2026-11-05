import { useEffect, useId, useState } from 'react'
import { usePageFilter } from '../../hooks/usePageFilter'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../shared/AppDatePicker'
import EmptyState from '../shared/EmptyState'
import LoadErrorState from '../shared/LoadErrorState'
import LoadingState from '../shared/LoadingState'
import ResponsiveDataView, { type DataColumn } from '../shared/ResponsiveDataView'
import PagedResponsiveDataView from '../shared/PagedResponsiveDataView'
import { formatNumber } from '../../utils/formatters'
import type { ApartmentMeterHistory, IndexReading } from '../../types/waterReadings'
import { fitHistoryRange, readingPeriod, recordedMonths, registrationDate } from '../../utils/meterHistory'
import MeterIndexChart from './MeterIndexChart'

type HistoryContentProps = {
  history: ApartmentMeterHistory
  initialMeterId?: string
  adminReadingsEndpoint?: string
}

const HistoryContent = ({ history, initialMeterId, adminReadingsEndpoint }: HistoryContentProps) => {
  const { t, i18n } = useTranslation()
  const firstMeter = history.meters.find((item) => item.id === initialMeterId)
    ?? history.meters.find((item) => item.isActive) ?? history.meters[0]
  const initial = { meterId: firstMeter?.id ?? '', ...fitHistoryRange(recordedMonths(firstMeter?.readings ?? [])) }
  const [savedSelection, setSelection] = usePageFilter(`meterHistory.${history.apartment.id}`, initial, initialMeterId ? initial : undefined)
  const meter = history.meters.find((item) => item.id === savedSelection.meterId)
    ?? history.meters.find(item => item.isActive) ?? history.meters[0]
  const months = recordedMonths(meter?.readings ?? [])
  const selection = { meterId: meter?.id ?? '', ...fitHistoryRange(months, savedSelection) }
  const rows = (meter?.readings ?? []).filter((reading) => readingPeriod(reading) >= selection.from && readingPeriod(reading) <= selection.to)
    .sort((a, b) => a.year - b.year || a.month - b.month)
  const periodLabel = (reading: IndexReading) => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' })
    .format(new Date(`${readingPeriod(reading)}-01T12:00:00`))
  const columns: DataColumn<IndexReading>[] = [
    { key: 'month', label: t('finance.columns.month'), cardRole: 'primary', render: periodLabel },
    { key: 'index', label: t('meterHistory.index'), render: (reading) => formatNumber(reading.value) },
    { key: 'registered', label: t('meterHistory.registeredAt'), render: (reading) => registrationDate(reading.submittedAt, i18n.language) },
  ]
  if (adminReadingsEndpoint) columns.push({ key: 'submitter', label: t('meterHistory.submittedBy'), render: (reading) => reading.submittedBy ?? '-' })
  const table = {
    paginationId: adminReadingsEndpoint ? 'MeterHistoryDrawer-1' : 'ResidentMeterHistory',
    paginationResetKey: JSON.stringify([selection.meterId, selection.from, selection.to]),
    desktopTableMinWidth: 560,
    rows,
    columns,
    getRowId: (reading: IndexReading) => reading.id,
    ariaLabel: t('meterHistory.history'),
  }
  if (!history.meters.length) return <EmptyState headline={t('meterHistory.noMeters')} helperText={t('meterHistory.noMetersHelper')} />
  return <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
    <TextField select fullWidth size="small" label={t('consumption.columns.meter')} value={selection.meterId} onChange={(event) => {
      const next = history.meters.find((item) => item.id === event.target.value)
      setSelection({ meterId: event.target.value, ...fitHistoryRange(recordedMonths(next?.readings ?? []), selection) })
    }}>
      {history.meters.map((item) => <MenuItem key={item.id} value={item.id} sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
        {t(item.utilityType === 'ColdWater' ? 'consumption.waterType.cold' : 'consumption.waterType.hot')} - {item.name}
        {!item.isActive && ` (${t('meterHistory.inactive')})`}
      </MenuItem>)}
    </TextField>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
      <AppDatePicker key={`${meter?.id}:from`} monthOnly confirmOnAccept label={t('meterHistory.from')} value={selection.from} disabled={!months.length}
        availableMonths={months} minDate={months[0]} maxDate={selection.to}
        onChange={(from) => setSelection((value) => ({ ...value, from }))} />
      <AppDatePicker key={`${meter?.id}:to`} monthOnly confirmOnAccept label={t('meterHistory.to')} value={selection.to} disabled={!months.length}
        availableMonths={months} minDate={selection.from} maxDate={months[months.length - 1]}
        onChange={(to) => setSelection((value) => ({ ...value, to }))} />
    </Box>
    {rows.length ? <>
      <MeterIndexChart readings={rows} />
      <Typography variant="subtitle1">{t('meterHistory.history')}</Typography>
      <Box sx={{ '& td': { overflowWrap: 'anywhere' } }}>
        {adminReadingsEndpoint
          ? <PagedResponsiveDataView {...table} endpoint={adminReadingsEndpoint} query={{ meterId: selection.meterId, fromPeriod: selection.from, toPeriod: selection.to }} />
          : <ResponsiveDataView {...table} />}
      </Box>
    </> : <EmptyState headline={t('meterHistory.noReadings')} helperText={t('meterHistory.noReadingsHelper')} />}
  </Box>
}

type Props = Omit<HistoryContentProps, 'history'> & {
  apartmentId: string | null
  title: string
  loadHistory: (apartmentId: string, signal: AbortSignal) => Promise<ApartmentMeterHistory>
  onClose: () => void
}

type PanelProps = Omit<Props, 'apartmentId'> & { apartmentId: string; titleId: string }

const MeterHistoryPanel = ({ apartmentId, title, titleId, loadHistory, onClose, ...content }: PanelProps) => {
  const { t } = useTranslation()
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<{ apartmentId: string; revision: number; data?: ApartmentMeterHistory; error?: boolean }>()
  useEffect(() => {
    const request = new AbortController()
    loadHistory(apartmentId, request.signal).then((data) => {
      if (!request.signal.aborted) setResult({ apartmentId, revision, data })
    }).catch(() => {
      if (!request.signal.aborted) setResult({ apartmentId, revision, error: true })
    })
    return () => request.abort()
  }, [apartmentId, loadHistory, revision])
  const loading = !result || result.revision !== revision || result.apartmentId !== apartmentId
  const apartment = loading ? undefined : result?.data?.apartment
  return <>
    <Box sx={{ p: 2, display: 'grid', gap: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={onClose} sx={{ justifySelf: 'start' }}>{t('meterHistory.back')}</Button>
      <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <Typography id={titleId} variant="h6" component="h2">{title}</Typography>
        {apartment && <Typography variant="body2">{[
          t('consumption.location.apartmentValue', { apartment: apartment.number }),
          apartment.staircaseName && t('consumption.location.staircaseValue', { staircase: apartment.staircaseName }),
          t('common.blockValue', { block: apartment.blockName }),
        ].filter(Boolean).join(' - ')}</Typography>}
      </Box>
    </Box>
    {loading ? <LoadingState variant="page" label={t('consumption.loading')} showLabel />
      : <Box sx={{ p: 2, flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {result?.error ? <LoadErrorState helperText={t('meterHistory.loadHistoryFailed')} onRetry={() => setRevision((value) => value + 1)} />
          : result?.data && <HistoryContent history={result.data} {...content} />}
      </Box>}
  </>
}

const MeterHistoryDrawer = ({ apartmentId, onClose, ...content }: Props) => {
  const titleId = useId()
  return <Drawer anchor="right" open={apartmentId !== null} onClose={onClose}
    slotProps={{ paper: { role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId,
      sx: { width: { xs: '100%', sm: 700 }, maxWidth: '100%', overflow: 'hidden' } } }}>
    {apartmentId && <MeterHistoryPanel key={`${apartmentId}:${content.initialMeterId ?? ''}`}
      apartmentId={apartmentId} titleId={titleId} onClose={onClose} {...content} />}
  </Drawer>
}

export default MeterHistoryDrawer
