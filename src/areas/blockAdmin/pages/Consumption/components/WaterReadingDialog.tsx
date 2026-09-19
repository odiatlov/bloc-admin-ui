import React from 'react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'
import { formatNumber } from '../../../../../utils/formatters'

export type ReadingDialogApartment = {
  id: string
  label: string
  meters: Array<{ id: string, name: string, utilityType: string, previous: number | null, current: number | null }>
}

type Props = {
  apartments: ReadingDialogApartment[]
  initialApartmentId?: string
  year: number
  month: number
  title: string
  onClose: (changed: boolean) => void
}

const WaterReadingDialog: React.FC<Props> = ({ apartments, initialApartmentId, year, month, title, onClose }) => {
  const { t, i18n } = useTranslation()
  const [apartmentId, setApartmentId] = React.useState(initialApartmentId ?? apartments[0]?.id ?? '')
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [saved, setSaved] = React.useState<Record<string, number>>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const busy = React.useRef(false)
  const apartment = apartments.find((item) => item.id === apartmentId)
  const meters = apartment?.meters ?? []
  const current = (meter: ReadingDialogApartment['meters'][number]) => saved[meter.id] ?? meter.current
  const value = (meter: ReadingDialogApartment['meters'][number]) => current(meter) !== null ? String(current(meter)) : values[meter.id] ?? ''
  const valid = (meter: ReadingDialogApartment['meters'][number]) => value(meter).trim() !== ''
    && Number.isFinite(Number(value(meter))) && Number(value(meter)) >= 0
    && (meter.previous === null || Number(value(meter)) >= meter.previous)
  const pending = meters.filter((meter) => current(meter) === null)

  const submit = async () => {
    if (busy.current || pending.length === 0 || !pending.every(valid)) return
    busy.current = true
    setSubmitting(true)
    setError(null)
    try {
      for (const meter of pending) {
        const readingValue = Number(value(meter))
        await waterReadingsApi.createReading({ apartmentWaterMeterId: meter.id, year, month, value: readingValue })
        setSaved((previous) => ({ ...previous, [meter.id]: readingValue }))
      }
      onClose(true)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t('consumption.errors.submitFailed'))
    } finally {
      busy.current = false
      setSubmitting(false)
    }
  }

  const renderSection = (utility: 'cold' | 'hot') => {
    const section = meters.filter((meter) => meter.utilityType.toLowerCase().replaceAll('_', '').replace('water', '') === utility)
    if (section.length === 0) return null
    const complete = section.every(valid)
    const previousTotal = section.every((meter) => meter.previous !== null)
      ? section.reduce((sum, meter) => sum + meter.previous!, 0) : null
    const total = complete ? section.reduce((sum, meter) => sum + Number(value(meter)), 0) : null
    return <Box sx={{ display: 'grid', gap: 1 }}>
      <Typography variant="subtitle1">{t(`consumption.dialog.${utility}WaterReadings`)}</Typography>
      {section.map((meter) => <TextField key={meter.id} label={meter.name} fullWidth size="small" type="number"
        disabled={submitting || current(meter) !== null} value={value(meter)}
        error={value(meter) !== '' && !valid(meter)}
        helperText={meter.previous !== null ? t('consumption.errors.previousReadingHelper', { value: formatNumber(meter.previous) }) : undefined}
        slotProps={{ htmlInput: { min: meter.previous ?? 0, step: '0.01' } }}
        onChange={(event) => setValues((previous) => ({ ...previous, [meter.id]: event.target.value }))} />)}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>{t('consumption.dialog.consumption')}: {previousTotal === null ? '-' : formatNumber(previousTotal)} {'\u2192'} {total === null ? '-' : formatNumber(total)}</Typography>
        <Typography sx={{ fontWeight: 700 }}>{t('consumption.dialog.total')}: {total !== null && previousTotal !== null ? `${formatNumber(total - previousTotal)} m\u00b3` : t('common.notAvailable')}</Typography>
      </Box>
    </Box>
  }

  return <AppDialog open title={title} cancelLabel={t('common.cancel')}
    confirmLabel={t(submitting ? 'consumption.actions.submitting' : 'common.save')}
    confirmDisabled={submitting || pending.length === 0 || !pending.every(valid)}
    onCancel={() => { if (!busy.current) onClose(Object.keys(saved).length > 0) }}
    onConfirm={() => { void submit() }} contentSx={{ display: 'grid', gap: 2, pt: 1 }}>
    {error && <Typography color="error" variant="body2">{error}</Typography>}
    <Typography color="text.secondary">{new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))}</Typography>
    <TextField select fullWidth label={t('consumption.columns.apartment')} value={apartmentId} disabled={submitting}
      onChange={(event) => { setApartmentId(event.target.value); setError(null) }}>
      {apartments.map((item) => <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>)}
    </TextField>
    {renderSection('cold')}
    {meters.some((meter) => meter.utilityType.toLowerCase().includes('cold')) && meters.some((meter) => meter.utilityType.toLowerCase().includes('hot')) && <Divider />}
    {renderSection('hot')}
  </AppDialog>
}

export default WaterReadingDialog
