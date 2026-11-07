import { Box, IconButton, MenuItem, TextField } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import IconButtonTooltip from '../shared/IconButtonTooltip'
import { waterLocationTypes, type WaterZoneDraft } from '../../domain/waterMeterConfiguration'

export default function WaterMeterZoneFields({ zone, hasBoiler, disabled = false, showErrors = false, onChange, onRemove }: {
  zone: WaterZoneDraft; hasBoiler: boolean; disabled?: boolean; showErrors?: boolean
  onChange: (patch: Partial<WaterZoneDraft>) => void; onRemove: () => void
}) {
  const { t } = useTranslation()
  const invalidCount = (count: number) => !Number.isInteger(count) || count < 0 || count > 50
  return <Box sx={{ display: 'grid', alignItems: 'start', gap: 1, minWidth: 0,
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr)) auto', sm: 'minmax(0, 1fr) minmax(0, 1fr) 76px 76px auto' } }}>
    <TextField select fullWidth size="small" disabled={disabled} label={t('apartments.waterIndex.locationType')} value={zone.locationType}
      onChange={event => onChange({ locationType: event.target.value, name: t(`apartments.waterIndex.locations.${event.target.value}`) })}>
      {waterLocationTypes.map(location => <MenuItem key={location} value={location}>{t(`apartments.waterIndex.locations.${location}`)}</MenuItem>)}
    </TextField>
    <TextField fullWidth required size="small" disabled={disabled} label={t('apartments.waterIndex.zoneName')} value={zone.name}
      error={showErrors && (!zone.name.trim() || zone.name.trim().length > 100)}
      slotProps={{ htmlInput: { maxLength: 100 } }} onChange={event => onChange({ name: event.target.value })} />
    <TextField fullWidth size="small" type="number" disabled={disabled} label={t('apartments.waterIndex.coldCount')} value={zone.coldWaterCount}
      error={showErrors && invalidCount(zone.coldWaterCount)} slotProps={{ htmlInput: { min: 0, max: 50, step: 1 } }}
      onChange={event => onChange({ coldWaterCount: Number(event.target.value) })} sx={{ gridColumn: { xs: 1, sm: 'auto' } }} />
    <TextField fullWidth size="small" type="number" disabled={disabled || hasBoiler} label={t('apartments.waterIndex.hotCount')} value={hasBoiler ? 0 : zone.hotWaterCount}
      error={showErrors && invalidCount(zone.hotWaterCount)} slotProps={{ htmlInput: { min: 0, max: 50, step: 1 } }}
      onChange={event => onChange({ hotWaterCount: Number(event.target.value) })} sx={{ gridColumn: { xs: 2, sm: 'auto' } }} />
    <IconButtonTooltip title={t('apartments.waterIndex.removeZone')}><IconButton disabled={disabled} aria-label={t('apartments.waterIndex.removeZone')}
      onClick={onRemove} sx={{ gridColumn: { xs: 3, sm: 'auto' }, gridRow: { xs: '1 / span 2', sm: 'auto' } }}><DeleteIcon /></IconButton></IconButtonTooltip>
  </Box>
}
