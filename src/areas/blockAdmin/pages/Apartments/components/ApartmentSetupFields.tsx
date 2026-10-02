import { MenuItem, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { translateApartmentSetupStatus } from '../../../../../domain/displayLabels'

type Fields = { number: string; floor: string; usableSqm: string; setupStatus: 'configured' | 'unconfigured' }
export default function ApartmentSetupFields({ value, onChange }: { value: Fields; onChange: (patch: Partial<Fields>) => void }) {
  const { t } = useTranslation()
  return <>
    <TextField fullWidth required size="small" label={t('apartments.setup.number')} value={value.number} onChange={e => onChange({ number: e.target.value })} />
    <TextField fullWidth size="small" type="number" label={t('blocks.columns.floor')} value={value.floor} onChange={e => onChange({ floor: e.target.value })} />
    <TextField fullWidth size="small" type="number" label={t('blocks.columns.usableSurface')} value={value.usableSqm} onChange={e => onChange({ usableSqm: e.target.value })} />
    <TextField fullWidth select required size="small" label={t('apartments.setup.setupStatus')} value={value.setupStatus} onChange={e => onChange({ setupStatus: e.target.value as Fields['setupStatus'] })}>
      {(['configured', 'unconfigured'] as const).map(status => <MenuItem key={status} value={status}>{translateApartmentSetupStatus(t, status)}</MenuItem>)}
    </TextField>
  </>
}
