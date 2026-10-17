import React from 'react'
import { Alert, Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import BlockSetupWizard from '../../../components/blockSetup/BlockSetupWizard'
import ResidentSetupFields from '../../../components/blockSetup/ResidentSetupFields'
import { newApartment, type ResidentDraft } from '../../../components/blockSetup/setupDraft'
import AppDialog from '../../../components/shared/AppDialog'
import LoadErrorState from '../../../components/shared/LoadErrorState'
import EmptyState from '../../../components/shared/EmptyState'
import { superAdminApi, type SuperAdminAdminAccountResponse } from '../../../services/superAdminApi'
import type { ResidentResponse } from '../../../types/management'

type Props = { kind: 'block' | 'resident'; initialAdminId?: string; onCreated: () => void | Promise<void> }

export default function CreateForAdmin({ kind, initialAdminId, onCreated }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  return <>
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
      {t(kind === 'block' ? 'settings.actions.addBlock' : 'residents.actions.addResident')}
    </Button>
    {open && <CreationFlow kind={kind} initialAdminId={initialAdminId} onCreated={onCreated} onClose={() => setOpen(false)} />}
  </>
}

function CreationFlow({ kind, initialAdminId, onCreated, onClose }: Props & { onClose: () => void }) {
  const { t } = useTranslation()
  const [phase, setPhase] = React.useState<'admin' | 'form'>('admin')
  const [admins, setAdmins] = React.useState<SuperAdminAdminAccountResponse[]>([])
  const [residents, setResidents] = React.useState<ResidentResponse[]>([])
  const [adminId, setAdminId] = React.useState(initialAdminId ?? '')
  const [draft, setDraft] = React.useState<ResidentDraft>(() => newApartment().resident)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState('')
  const [revision, setRevision] = React.useState(0)
  const [requestId] = React.useState(() => crypto.randomUUID())
  const submitting = React.useRef(false)

  React.useEffect(() => {
    let active = true
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(false)
      try {
        if (phase === 'admin') {
          const accounts = await superAdminApi.getAdminAccounts()
          if (active) setAdmins(accounts.filter(account => account.status === 'Active'))
        } else if (kind === 'resident') {
          const nextResidents = await superAdminApi.getAdminResidents(adminId)
          if (active) setResidents(nextResidents.filter(resident => resident.status === 'active'))
        }
      } catch { if (active) setError(true) }
      finally { if (active) setLoading(false) }
    }, 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [phase, kind, adminId, revision])

  const selectedAdmin = admins.find(admin => admin.adminAccountId === adminId)
  const caption = t('superAdmin.creation.forAdmin', { admin: selectedAdmin?.ownerName ?? '' })
  const loadResidents = React.useCallback(() => superAdminApi.getAdminResidents(adminId), [adminId])
  const finish = () => { void Promise.resolve(onCreated()).catch(() => undefined); onClose() }
  const hasValidEmail = !draft.inviteResident || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())
  const selectedResident = residents.find(resident => resident.id === draft.residentId)
  const canSave = hasValidEmail && (draft.mode === 'existing' ? Boolean(selectedResident && !selectedResident.hasRegisteredAccount && draft.inviteResident)
    : Boolean(draft.firstName.trim() && draft.lastName.trim()))

  const save = async () => {
    if (submitting.current || !canSave) return
    submitting.current = true; setSaving(true); setSaveError('')
    try {
      await superAdminApi.createResidentForAdmin(adminId, {
        requestId, existingResidentId: draft.mode === 'existing' ? draft.residentId : undefined,
        firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), phone: draft.phone.trim() || undefined,
        email: draft.email.trim() || undefined, inviteResident: draft.inviteResident,
      })
      finish()
    } catch { setSaveError(t('superAdmin.creation.saveFailed')) }
    finally { submitting.current = false; setSaving(false) }
  }

  if (phase === 'form' && kind === 'block') return <BlockSetupWizard accountCaption={caption} loadResidentOptions={loadResidents}
    onClose={finish} onSimple={async block => { await superAdminApi.createBlockForAdmin(adminId, requestId, block); finish() }}
    onSetup={async request => {
      const result = await superAdminApi.createBlockSetupForAdmin(adminId, request)
      if (result.invitations.every(invitation => invitation.succeeded)) finish()
      else { void Promise.resolve(onCreated()).catch(() => undefined) }
      return result
    }} />

  return <>
    <AppDialog open title={t(phase === 'admin' ? 'superAdmin.creation.selectAdmin' : 'residents.actions.addResident')}
      cancelLabel={t('common.cancel')} confirmLabel={t(phase === 'admin' ? 'superAdmin.creation.continue' : 'common.save')}
      pending={saving} confirmDisabled={loading || error || saving || (phase === 'admin' ? !selectedAdmin : !canSave)}
      onCancel={onClose} onConfirm={() => { if (phase === 'admin') { setLoading(true); setPhase('form') } else void save() }}>
      {loading ? <Typography role="status">{t('common.pagination.loading')}</Typography>
        : error ? <LoadErrorState inline onRetry={() => setRevision(value => value + 1)} />
          : phase === 'admin' ? admins.length === 0 ? <EmptyState inline headline={t('superAdmin.creation.noAdmins')} helperText="" />
            : <TextField select fullWidth required label={t('settings.blockDialog.administrator')} value={selectedAdmin ? adminId : ''}
              onChange={event => setAdminId(event.target.value)}>
              {admins.map(admin => <MenuItem key={admin.adminAccountId} value={admin.adminAccountId}>{admin.ownerName} — {admin.ownerEmail}</MenuItem>)}
            </TextField>
            : <Box sx={{ display: 'grid', gap: 2 }}>
              <Alert severity="info">{t('residents.assignments.createWithoutHousing')}</Alert>
              <Typography color="text.secondary">{caption}</Typography>
              <ResidentSetupFields value={draft} onChange={patch => setDraft(value => ({ ...value, ...patch }))}
                residents={residents.filter(resident => !resident.hasRegisteredAccount)} loading={loading} error={error} onRetry={() => setRevision(value => value + 1)} disabled={saving} />
            </Box>}
      {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
    </AppDialog>
  </>
}
