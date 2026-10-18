import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { residentsApi } from '../../../../../services/residentsApi'
import type { ResidentResponse } from '../../../../../types/management'
import BlockFinanceSettings from './BlockFinanceSettings'

type SettingsSectionsProps = {
  mode: 'admin' | 'resident'
  residentSaveSignal?: number
  onResidentSaveStateChange?: (state: { canSave: boolean; isSaving: boolean }) => void
}

const ResidentSettings: React.FC<Omit<SettingsSectionsProps, 'mode'>> = ({ residentSaveSignal = 0, onResidentSaveStateChange }) => {
  const { t } = useTranslation()
  const { account, refreshAccounts } = React.useContext(RoleContext)
  const [residentProfile, setResidentProfile] = React.useState<ResidentResponse | null>(null)
  const [residentProfileForm, setResidentProfileForm] = React.useState({ firstName: '', lastName: '', email: '' })
  const [isResidentProfileLoading, setIsResidentProfileLoading] = React.useState(Boolean(account.residentId))
  const [residentProfileError, setResidentProfileError] = React.useState<string | null>(null)
  const [isResidentProfileSaving, setIsResidentProfileSaving] = React.useState(false)
  const [retry, setRetry] = React.useState(0)
  React.useEffect(() => {
    let active = true
    if (!account.residentId) return
    residentsApi.getById(account.residentId).then((resident) => {
      if (!active) return
      setResidentProfile(resident)
      setResidentProfileForm({ firstName: resident.firstName, lastName: resident.lastName, email: resident.email ?? account.email })
      setResidentProfileError(null)
    }).catch((error) => { if (active) setResidentProfileError(error instanceof Error ? error.message : t('settings.resident.profileLoadFailed')) }).finally(() => { if (active) setIsResidentProfileLoading(false) })
    return () => { active = false }
  }, [account.email, account.residentId, retry, t])
  const hasValidResidentProfileEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(residentProfileForm.email.trim())
  const canSaveResidentProfile = Boolean(residentProfile && residentProfileForm.firstName.trim() && residentProfileForm.lastName.trim() && hasValidResidentProfileEmail && !isResidentProfileSaving)
  React.useEffect(() => { onResidentSaveStateChange?.({ canSave: canSaveResidentProfile, isSaving: isResidentProfileSaving }) }, [canSaveResidentProfile, isResidentProfileSaving, onResidentSaveStateChange])
  const saveResidentProfile = React.useCallback(async () => {
    if (!residentProfile || !canSaveResidentProfile) return
    setIsResidentProfileSaving(true); setResidentProfileError(null)
    try {
      const nextProfile = await residentsApi.updateProfile(residentProfile.id, { firstName: residentProfileForm.firstName.trim(), lastName: residentProfileForm.lastName.trim(), email: residentProfileForm.email.trim() })
      setResidentProfile(nextProfile)
      setResidentProfileForm({ firstName: nextProfile.firstName, lastName: nextProfile.lastName, email: nextProfile.email ?? residentProfileForm.email.trim() })
      await refreshAccounts()
    } catch (error) { setResidentProfileError(error instanceof Error ? error.message : t('settings.resident.profileSaveFailed')) }
    finally { setIsResidentProfileSaving(false) }
  }, [canSaveResidentProfile, refreshAccounts, residentProfile, residentProfileForm, t])
  const lastResidentSaveSignal = React.useRef(residentSaveSignal)
  React.useEffect(() => {
    if (residentSaveSignal === lastResidentSaveSignal.current) return
    lastResidentSaveSignal.current = residentSaveSignal
    void saveResidentProfile()
  }, [residentSaveSignal, saveResidentProfile])
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: 2, alignItems: 'stretch' }}>
    <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
      <Typography variant="h6">{t('settings.resident.profile')}</Typography>
      {isResidentProfileLoading ? <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'center', py: 2 }}><CircularProgress size={28} /><Typography color="text.secondary">{t('settings.resident.profileLoading')}</Typography></Box>
        : residentProfileError && !residentProfile ? <LoadErrorState helperText={t('settings.resident.profileLoadFailed')} onRetry={() => { setIsResidentProfileLoading(true); setRetry((value) => value + 1) }} /> : <>
          {residentProfileError && <Alert severity="error">{residentProfileError}</Alert>}
          <TextField label={t('residents.fields.firstName')} value={residentProfileForm.firstName} onChange={(event) => setResidentProfileForm((value) => ({ ...value, firstName: event.target.value }))} />
          <TextField label={t('residents.fields.lastName')} value={residentProfileForm.lastName} onChange={(event) => setResidentProfileForm((value) => ({ ...value, lastName: event.target.value }))} />
          <TextField error={Boolean(residentProfileForm.email.trim()) && !hasValidResidentProfileEmail} helperText={Boolean(residentProfileForm.email.trim()) && !hasValidResidentProfileEmail ? t('residents.errors.invalidEmail') : undefined} label={t('settings.fields.email')} type="email" value={residentProfileForm.email} onChange={(event) => setResidentProfileForm((value) => ({ ...value, email: event.target.value }))} />
        </>}
      <FormControl size="small"><InputLabel>{t('settings.fields.language')}</InputLabel><Select label={t('settings.fields.language')} defaultValue="en"><MenuItem value="en">EN</MenuItem><MenuItem value="ro">RO</MenuItem></Select></FormControl>
    </Paper>
    <Paper sx={{ p: 2 }}><Typography variant="h6">{t('settings.sections.notifications')}</Typography><FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.emailNotifications')} /><FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.paymentReminders')} /><FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.maintenanceNotifications')} /></Paper>
  </Box>
}

const SettingsSections: React.FC<SettingsSectionsProps> = ({ mode, ...props }) => {
  const { account } = React.useContext(RoleContext)
  return mode === 'admin' ? <BlockFinanceSettings /> : <ResidentSettings key={account.residentId ?? account.id} {...props} />
}
export default SettingsSections
