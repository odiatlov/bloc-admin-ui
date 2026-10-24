import { MenuItem, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ApartmentConfigurationBadge from './ApartmentConfigurationBadge'

type Fields = { number: string; floor: string; usableSqm: string }
type FloorChoice = { value: string; label: string }
export default function ApartmentSetupFields({ value, onChange, compactLabels = false, errors = {}, floorChoices, disabled = false }: { value: Fields; onChange: (patch: Partial<Fields>) => void; compactLabels?: boolean; errors?: Partial<Record<keyof Fields, string>>; floorChoices?: FloorChoice[]; disabled?: boolean }) {
  const { t } = useTranslation()
  const label = (short: string, full: string) => t(compactLabels ? `blockSetup.mobile.${short}` : full)
  return <>
    <ApartmentConfigurationBadge usableSqm={value.usableSqm} zonesAfterCreate />
    <TextField fullWidth required disabled={disabled} size="small" error={Boolean(errors.number)} helperText={errors.number} label={label('number', 'apartments.setup.number')} slotProps={{ htmlInput: { 'aria-label': t('apartments.setup.number') } }} value={value.number} onChange={e => onChange({ number: e.target.value })} />
    {floorChoices ? <TextField fullWidth select disabled={disabled} size="small" data-setup-floor-choice error={Boolean(errors.floor)} helperText={errors.floor}
      label={label('floor', 'blocks.columns.floor')} value={value.floor} onChange={e => onChange({ floor: e.target.value })}>
      <MenuItem value="">{t('blockSetup.unassignedFloor')}</MenuItem>
      {value.floor && !floorChoices.some(choice => choice.value === value.floor) && <MenuItem value={value.floor} disabled>{value.floor}</MenuItem>}
      {floorChoices.map(choice => <MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>)}
    </TextField> : <TextField fullWidth disabled={disabled} size="small" type="number" error={Boolean(errors.floor)} helperText={errors.floor} label={label('floor', 'blocks.columns.floor')} slotProps={{ htmlInput: { 'aria-label': t('blocks.columns.floor') } }} value={value.floor} onChange={e => onChange({ floor: e.target.value })} />}
    <TextField fullWidth disabled={disabled} size="small" type="number" error={Boolean(errors.usableSqm)} helperText={errors.usableSqm} label={label('usableSqm', 'blocks.columns.usableSurface')} slotProps={{ htmlInput: { 'aria-label': t('blocks.columns.usableSurface') } }} value={value.usableSqm} onChange={e => onChange({ usableSqm: e.target.value })} />
  </>
}
