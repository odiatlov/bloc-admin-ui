import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import EmptyState from '../../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { formatNumber } from '../../../../../utils/formatters'
import { superAdminWaterApi, type ApartmentMeterHistory, type IndexReading } from '../../../services/superAdminWaterApi'
import { fitHistoryRange, readingPeriod, recordedMonths, registrationDate } from '../../../utils/meterHistory'
import MeterIndexChart from './MeterIndexChart'

const HistoryContent = ({ history, onClose }: { history: ApartmentMeterHistory, onClose: () => void }) => {
  const { t, i18n } = useTranslation()
  const [selection, setSelection] = useState(() => {
    const meter = history.meters.find((item) => item.isActive) ?? history.meters[0]
    return { meterId: meter?.id ?? '', ...fitHistoryRange(recordedMonths(meter?.readings ?? [])) }
  })
  const meter = history.meters.find((item) => item.id === selection.meterId)
  const months = recordedMonths(meter?.readings ?? [])
  const rows = (meter?.readings ?? []).filter((reading) => readingPeriod(reading) >= selection.from && readingPeriod(reading) <= selection.to)
    .sort((a, b) => a.year - b.year || a.month - b.month)
  const periodLabel = (reading: IndexReading) => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' })
    .format(new Date(`${readingPeriod(reading)}-01T12:00:00`))
  const columns: DataColumn<IndexReading>[] = [
    { key: 'month', label: t('finance.columns.month'), cardRole: 'primary', render: periodLabel },
    { key: 'index', label: t('superAdmin.water.index'), render: (reading) => formatNumber(reading.value) },
    { key: 'registered', label: t('superAdmin.water.registeredAt'), render: (reading) => registrationDate(reading.submittedAt, i18n.language) },
    { key: 'submitter', label: t('superAdmin.water.submittedBy'), render: (reading) => reading.submittedBy ?? '-' },
  ]
  if (!history.meters.length) return <EmptyState headline={t('superAdmin.water.noMeters')} helperText={t('superAdmin.water.noMetersHelper')} actionLabel={t('common.close')} onAction={onClose} />
  return <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
    <TextField select fullWidth size="small" label={t('superAdmin.water.meter')} value={selection.meterId} onChange={(event) => {
      const next = history.meters.find((item) => item.id === event.target.value)
      setSelection({ meterId: event.target.value, ...fitHistoryRange(recordedMonths(next?.readings ?? []), selection) })
    }}>
      {history.meters.map((item) => <MenuItem key={item.id} value={item.id} sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
        {t(item.utilityType === 'ColdWater' ? 'consumption.waterType.cold' : 'consumption.waterType.hot')} - {item.name}
        {!item.isActive && ` (${t('superAdmin.water.inactive')})`}
      </MenuItem>)}
    </TextField>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
      <AppDatePicker key={`${meter?.id}:from`} monthOnly confirmOnAccept label={t('superAdmin.water.from')} value={selection.from} disabled={!months.length}
        availableMonths={months} minDate={months[0]} maxDate={selection.to}
        onChange={(from) => setSelection((value) => ({ ...value, from }))} />
      <AppDatePicker key={`${meter?.id}:to`} monthOnly confirmOnAccept label={t('superAdmin.water.to')} value={selection.to} disabled={!months.length}
        availableMonths={months} minDate={selection.from} maxDate={months[months.length - 1]}
        onChange={(to) => setSelection((value) => ({ ...value, to }))} />
    </Box>
    {rows.length ? <>
      <MeterIndexChart readings={rows} />
      <Typography variant="subtitle1">{t('superAdmin.water.history')}</Typography>
      <Box sx={{ '& td': { overflowWrap: 'anywhere' } }}>
        <ResponsiveDataView desktopTableMinWidth={560} rows={rows} columns={columns} getRowId={(reading) => reading.id} ariaLabel={t('superAdmin.water.history')} />
      </Box>
    </> : <EmptyState headline={t('superAdmin.water.noReadings')} helperText={t('superAdmin.water.noReadingsHelper')} actionLabel={t('common.close')} onAction={onClose} />}
  </Box>
}

const MeterHistoryDrawer = ({ apartmentId, onClose }: { apartmentId: string, onClose: () => void }) => {
  const { t } = useTranslation()
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<{ revision: number, data?: ApartmentMeterHistory, error?: boolean }>()
  useEffect(() => {
    let cancelled = false
    superAdminWaterApi.history(apartmentId).then((data) => {
      if (!cancelled) setResult({ revision, data })
    }).catch(() => {
      if (!cancelled) setResult({ revision, error: true })
    })
    return () => { cancelled = true }
  }, [apartmentId, revision])
  const loading = result?.revision !== revision
  const apartment = result?.data?.apartment
  return <Drawer anchor="right" open onClose={onClose} slotProps={{ paper: { role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'meter-history-title', sx: { width: { xs: '100%', sm: 700 }, maxWidth: '100%', overflow: 'hidden' } } }}>
    <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
        <Typography id="meter-history-title" variant="h6">{t('superAdmin.water.viewMeters')}</Typography>
        {apartment && <Typography variant="body2">{[
          t('consumption.location.apartmentValue', { apartment: apartment.number }),
          apartment.staircaseName && t('consumption.location.staircaseValue', { staircase: apartment.staircaseName }),
          t('common.blockValue', { block: apartment.blockName }),
        ].filter(Boolean).join(' - ')}</Typography>}
      </Box>
      <Tooltip title={t('common.close')}><IconButton aria-label={t('common.close')} onClick={onClose}><CloseIcon /></IconButton></Tooltip>
    </Box>
    <Box sx={{ p: 2, flex: 1, overflowY: 'auto', minWidth: 0 }}>
      {loading ? <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><CircularProgress size={24} />{t('consumption.loading')}</Box>
        : result?.error ? <LoadErrorState helperText={t('superAdmin.water.loadHistoryFailed')} onRetry={() => setRevision((value) => value + 1)} />
          : result?.data && <HistoryContent history={result.data} onClose={onClose} />}
    </Box>
  </Drawer>
}

export default MeterHistoryDrawer
