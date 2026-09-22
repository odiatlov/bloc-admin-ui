import React from 'react'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import { useConsumptionColumns } from '../../../../../components/water/useConsumptionColumns'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView from '../../../../../components/shared/ResponsiveDataView'
import { useWaterConsumptions } from '../../../../../hooks/useWaterConsumptions'
import type { WaterConsumptionRow } from '../../../../../types/waterReadings'
import ResidentWaterIndexSection from './ResidentWaterIndexSection'
import WaterReadingDialog from './WaterReadingDialog'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'

type ConsumptionSectionsProps = { mode: 'admin' | 'resident' | 'censor' }

const ConsumptionSections: React.FC<ConsumptionSectionsProps> = ({ mode }) => mode === 'resident'
  ? <ResidentWaterIndexSection /> : <AdminConsumptionSections mode={mode} />

const AdminConsumptionSections: React.FC<ConsumptionSectionsProps> = ({ mode }) => {
  const { t } = useTranslation()
  const { blocks, blockFilter, setBlockFilter, period, setPeriod, minimumPeriod, rows, loading, error, refresh } = useWaterConsumptions({ submissionPeriodsOnly: true })
  const [open, setOpen] = React.useState(false)
  const [reminderStates, setReminderStates] = React.useState<Record<string, 'sending' | 'sent' | 'error'>>({})
  const reminderRequests = React.useRef(new Set<string>())
  const sendReminder = async (row: WaterConsumptionRow) => {
    const key = `${period}:${row.id}`
    if (mode !== 'admin' || !row.canRemind || row.reminderSent || reminderRequests.current.has(key)) return
    reminderRequests.current.add(key)
    setReminderStates((states) => ({ ...states, [key]: 'sending' }))
    try {
      const [year, month] = period.split('-').map(Number)
      await waterReadingsApi.sendReminder(row.id, year, month)
      setReminderStates((states) => ({ ...states, [key]: 'sent' }))
      refresh()
    } catch {
      setReminderStates((states) => ({ ...states, [key]: 'error' }))
    } finally {
      reminderRequests.current.delete(key)
    }
  }
  const { columns, apartmentLabel } = useConsumptionColumns<WaterConsumptionRow>(period)
  const label = (row: WaterConsumptionRow) => [
    apartmentLabel(row),
    t('common.blockValue', { block: row.apartment.blockName }),
  ].filter(Boolean).join(' - ')
  if (mode === 'admin') columns.push({
    key: 'reminder', label: t('consumption.reminder.column'), cardRole: 'actions',
    render: (row) => {
      if (row.status !== 'incomplete' || !row.canRemind) return null
      const state = reminderStates[`${period}:${row.id}`]
      const sent = row.reminderSent || state === 'sent'
      const title = t(sent ? 'consumption.reminder.sent' : state === 'sending' ? 'consumption.reminder.sending' : 'consumption.reminder.send')
      return <Tooltip title={title}><span><Button size="small" startIcon={<NotificationsActiveOutlinedIcon />} aria-label={title} color="primary"
        disabled={sent || state === 'sending'} onClick={() => { void sendReminder(row) }}>
        {t('consumption.reminder.caption')}
      </Button></span></Tooltip>
    },
  })
  const incompleteApartments = rows.filter((row) => row.meters.some((meter) => meter.isActive && meter.current === null))

  return <Box sx={{ display: 'grid', gap: 2 }}>
    {rows.some((row) => reminderStates[`${period}:${row.id}`] === 'error') && <Alert severity="error">{t('consumption.reminder.failed')}</Alert>}
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
