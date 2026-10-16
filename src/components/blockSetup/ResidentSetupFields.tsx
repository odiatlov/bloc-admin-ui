import { Autocomplete, Box, Checkbox, CircularProgress, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import EmptyState from '../shared/EmptyState'
import LoadErrorState from '../shared/LoadErrorState'
import type { ResidentResponse } from '../../types/management'
import type { ResidentDraft } from './setupDraft'

type Props = {
  value: ResidentDraft
  onChange: (patch: Partial<ResidentDraft>) => void
  residents: ResidentResponse[]
  loading: boolean
  error: boolean
  onRetry: () => void
  disabled: boolean
  errors?: Partial<Record<'residentId' | 'firstName' | 'lastName' | 'phone' | 'email', string>>
}

export default function ResidentSetupFields({ value, onChange, residents, loading, error, onRetry, disabled, errors = {} }: Props) {
  const { t } = useTranslation()
  const selected = residents.find(resident => resident.id === value.residentId) ?? null
  const registered = value.mode === 'existing' && selected?.hasRegisteredAccount
  return <Box sx={{ px: 1.5, pb: 1.5, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, minWidth: 0 }}>
    <TextField select size="small" label={t('blockSetup.residentMode')} value={value.mode} disabled={disabled}
      onChange={event => onChange({ mode: event.target.value as ResidentDraft['mode'], inviteResident: false, email: '' })} sx={{ gridColumn: '1 / -1' }}>
      <MenuItem value="new">{t('blockSetup.newResident')}</MenuItem>
      <MenuItem value="existing">{t('blockSetup.existingResident')}</MenuItem>
    </TextField>
    {value.mode === 'new' ? <>
      <TextField required fullWidth size="small" error={Boolean(errors.firstName)} helperText={errors.firstName} label={t('residents.fields.firstName')} value={value.firstName} disabled={disabled}
        slotProps={{ htmlInput: { maxLength: 100 } }} onChange={event => onChange({ firstName: event.target.value })} />
      <TextField required fullWidth size="small" error={Boolean(errors.lastName)} helperText={errors.lastName} label={t('residents.fields.lastName')} value={value.lastName} disabled={disabled}
        slotProps={{ htmlInput: { maxLength: 100 } }} onChange={event => onChange({ lastName: event.target.value })} />
      <TextField fullWidth size="small" error={Boolean(errors.phone)} helperText={errors.phone} label={t('residents.fields.phoneOptional')} value={value.phone} disabled={disabled}
        slotProps={{ htmlInput: { maxLength: 50 } }} onChange={event => onChange({ phone: event.target.value })} />
    </> : <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
      {loading ? <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} /><Typography variant="body2">{t('residents.loading')}</Typography></Box>
        : error ? <LoadErrorState inline helperText={t('residents.errors.loadFailed')} onRetry={onRetry} isRetrying={disabled} />
        : !loading && residents.length === 0 ? <EmptyState inline headline={t('blockSetup.noResidents')} helperText="" />
        : <Autocomplete options={residents} value={selected} loading={loading} disabled={disabled || loading}
          getOptionLabel={resident => resident.fullName} isOptionEqualToValue={(option, next) => option.id === next.id}
          noOptionsText={t('blockSetup.noMatchingResidents')} loadingText={t('residents.loading')}
          clearText={t('blockSetup.clearResident')} openText={t('blockSetup.openResidents')} closeText={t('common.close')}
          onChange={(_event, resident) => onChange({ residentId: resident?.id ?? '', inviteResident: false, email: '' })}
          renderInput={params => <TextField {...params} required size="small" error={Boolean(errors.residentId)} helperText={errors.residentId} label={t('blockSetup.existingResident')} />} />}
    </Box>}
    <FormControlLabel sx={{ gridColumn: '1 / -1', m: 0 }} label={t('residents.fields.inviteResident')}
      control={<Checkbox checked={!registered && value.inviteResident} disabled={disabled || Boolean(registered) || (value.mode === 'existing' && !selected)}
        onChange={event => onChange({ inviteResident: event.target.checked })} />} />
    {!registered && value.inviteResident && <TextField required fullWidth size="small" type="email" label={t('residents.fields.email')}
      error={Boolean(errors.email)} helperText={errors.email}
      value={value.email} disabled={disabled} slotProps={{ htmlInput: { maxLength: 200 } }}
      onChange={event => onChange({ email: event.target.value })} sx={{ gridColumn: '1 / -1' }} />}
  </Box>
}
