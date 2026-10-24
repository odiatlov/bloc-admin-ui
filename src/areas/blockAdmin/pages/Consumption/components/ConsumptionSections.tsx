import React from 'react'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/Add'
import GroupsIcon from '@mui/icons-material/Groups'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import AppDialog from '../../../../../components/shared/AppDialog'
import ResponsiveDataView from '../../../../../components/shared/ResponsiveDataView'
import { useConsumptionColumns } from '../../../../../components/water/useConsumptionColumns'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import PagedResponsiveDataView from '../../../../../components/shared/PagedResponsiveDataView'
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
  const { blocks, blockFilter, setBlockFilter, period, setPeriod, minimumPeriod, rows, loading, error, refresh } = useWaterConsumptions({ submissionPeriodsOnly: true, includeBaselinePeriod: mode === 'admin' })
  const [open, setOpen] = React.useState(false)
  const [showSetupIssues, setShowSetupIssues] = React.useState(false)
  const [readingApartmentId, setReadingApartmentId] = React.useState<string | undefined>()
  const [searchParams] = useSearchParams()
  const requestedBlock = searchParams.get('blockId')
  const requestedPeriod = searchParams.get('period')
  const requestedApartment = searchParams.get('apartmentId')
  const requestKey = `${requestedBlock}:${requestedPeriod}:${requestedApartment}`
  const openedRequest = React.useRef('')
  React.useEffect(() => {
    if (mode !== 'admin' || loading || error || openedRequest.current === requestKey
      || (!requestedBlock && !requestedPeriod && !requestedApartment)) return
    const timeout = window.setTimeout(() => {
      if (requestedBlock && blocks.some(block => block.id === requestedBlock) && blockFilter !== requestedBlock) {
        setBlockFilter(requestedBlock)
      } else if (requestedPeriod && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(requestedPeriod)
        && (!minimumPeriod || requestedPeriod >= minimumPeriod) && period !== requestedPeriod) {
        setPeriod(requestedPeriod)
      } else if (requestedApartment && (!requestedPeriod || requestedPeriod === period) && rows.some(row => row.id === requestedApartment)) {
        openedRequest.current = requestKey
        setReadingApartmentId(requestedApartment)
        setOpen(true)
      }
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [mode, loading, error, requestKey, requestedBlock, requestedPeriod, requestedApartment, blocks, blockFilter, period, minimumPeriod, rows, setBlockFilter, setPeriod])
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
    key: 'actions', label: t('common.actions'), cardRole: 'actions',
    actions: (row) => {
      const state = reminderStates[`${period}:${row.id}`]
      const sent = row.reminderSent || state === 'sent'
      return [{
        id: 'reminder',
        label: t(sent ? 'consumption.reminder.sent' : state === 'sending' ? 'consumption.reminder.sending' : 'consumption.reminder.send'),
        icon: <NotificationsActiveOutlinedIcon />,
        visible: row.status === 'incomplete' && row.canRemind,
        disabled: sent || state === 'sending',
        loading: state === 'sending',
        color: 'primary',
        onClick: () => { void sendReminder(row) },
        priority: 1,
        cardLabel: t('consumption.reminder.caption'),
      }, {
        id: 'occupants', label: t('blockSetup.editOccupants'), icon: <GroupsIcon />,
        visible: row.meters.some(meter => meter.current !== null), priority: 0,
        disabled: !row.canSubmitReadings,
        onClick: () => { setReadingApartmentId(row.id); setOpen(true) },
      }]
    },
  })
  const incompleteApartments = rows.filter((row) => row.meters.some((meter) => meter.isActive && meter.current === null))
  const blockedApartments = rows.filter(row => !row.canSubmitReadings)

  return <Box sx={{ display: 'grid', gap: 2 }}>
    {rows.some((row) => reminderStates[`${period}:${row.id}`] === 'error') && <Alert severity="error">{t('consumption.reminder.failed')}</Alert>}
    {mode === 'admin' && !loading && !error && blockedApartments.length > 0 && <Alert severity="warning" sx={{ '& .MuiAlert-message': { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 } }}>
      {t('consumption.readingEligibility.adminSummary', { count: blockedApartments.length })}
      <Button size="small" color="inherit" onClick={() => setShowSetupIssues(true)}>{t('consumption.readingEligibility.viewAffected')}</Button>
    </Alert>}
    <FilterBar actions={mode === 'admin' ? <Button startIcon={<AddIcon />} variant="contained" disabled={loading || !!error || !incompleteApartments.some(row => row.canSubmitReadings)} onClick={() => {
      setReadingApartmentId(incompleteApartments.find(row => row.canSubmitReadings)?.id)
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
          : <PagedResponsiveDataView endpoint="/water-consumptions/page" query={{ blockId: blockFilter === 'all' ? undefined : blockFilter, year: period === 'all' ? undefined : Number(period.slice(0, 4)), month: period === 'all' ? undefined : Number(period.slice(5)) }} paginationId="ConsumptionSections-1" paginationResetKey={JSON.stringify([blockFilter, period])} ariaLabel={t('consumption.sections.readings')} columns={columns} getRowId={(row) => row.id} rows={rows} />}
    {mode === 'admin' && <AppDialog open={showSetupIssues} maxWidth="md" title={t('consumption.readingEligibility.affectedApartments')}
      hideCancelButton cancelLabel={t('common.close')} confirmLabel={t('common.close')} onCancel={() => setShowSetupIssues(false)} onConfirm={() => setShowSetupIssues(false)}>
      <ResponsiveDataView desktopTableMinWidth={700} paginationId="consumption-setup-issues" paginationResetKey={JSON.stringify([blockFilter, period])}
        ariaLabel={t('consumption.readingEligibility.affectedApartments')} rows={blockedApartments} getRowId={(row) => row.id} columns={[
          { key: 'apartment', label: t('finance.columns.apartment'), cardRole: 'primary', render: label },
          { key: 'issue', label: t('finance.billing.issue'), render: (row) => t(`consumption.readingEligibility.adminReasons.${row.readingSetupIssue ?? 'apartmentNotConfigured'}`) },
          { key: 'actions', label: t('common.actions'), actions: (row) => [{ id: 'configure', label: t('finance.billing.resolve'), icon: <EditIcon />, to: `/admin/apartments?blockId=${row.apartment.blockId}` }] },
        ]} />
    </AppDialog>}
    {mode === 'admin' && open && <WaterReadingDialog
      title={t('consumption.dialog.adminTitle')} year={Number(period.split('-')[0])} month={Number(period.split('-')[1])}
      initialApartmentId={readingApartmentId}
      apartments={rows.filter(row => incompleteApartments.includes(row) || row.id === readingApartmentId).map((row) => ({ id: row.id, label: label(row),
        householdCount: row.apartment.householdCount, declaredHouseholdCount: row.householdCount,
        canSubmitReadings: row.canSubmitReadings, readingSetupIssue: row.readingSetupIssue,
        meters: row.meters.filter((meter) => meter.isActive || meter.current !== null),
      }))}
      onClose={(changed) => { setOpen(false); if (changed) refresh() }} />}
  </Box>
}

export default ConsumptionSections
