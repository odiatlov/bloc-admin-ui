import TextField from '@mui/material/TextField'
import { useTranslation } from 'react-i18next'

export default function BlockFields({ name, address, onChange }: {
  name: string; address: string; onChange: (field: 'name' | 'address', value: string) => void
}) {
  const { t } = useTranslation()
  return <>
    <TextField required fullWidth label={t('settings.fields.blockName')} value={name} onChange={e => onChange('name', e.target.value)} />
    <TextField fullWidth label={t('settings.blockDialog.address')} value={address} onChange={e => onChange('address', e.target.value)} />
  </>
}
