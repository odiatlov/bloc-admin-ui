import React from 'react'
import { usePageFilter } from '../../../../hooks/usePageFilter'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import ActionBar from '../../../../components/shared/ActionBar'
import AppDialog from '../../../../components/shared/AppDialog'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import SearchField from '../../../../components/shared/SearchField'
import { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import PagedResponsiveDataView from '../../../../components/shared/PagedResponsiveDataView'
import StatusChip from '../../../../components/shared/StatusChip'
import ResidentApartmentAssignments from '../../../../components/shared/ResidentApartmentAssignments'
import { translatePersonStatus } from '../../../../domain/displayLabels'
import { useBlocks } from '../../../../hooks/useBlocks'
import { personsApi } from '../../../../services/personsApi'
import { superAdminApi } from '../../../../services/superAdminApi'
import { ApiError } from '../../../../services/apiClient'
import type { PersonResponse, PersonStatus } from '../../../../types/management'
import CreateForAdmin from '../../components/CreateForAdmin'

type FormState = {
  firstName: string
  lastName: string
  blockId: string
  invitePerson: boolean
  email: string
  phone: string
  status: PersonStatus
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  blockId: '',
  invitePerson: false,
  email: '',
  phone: '',
  status: 'active',
}

const personStatuses: PersonStatus[] = ['active', 'inactive']
const tableEmptyValue = '-'
const normalizeFilterValue = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const SuperAdminPersons: React.FC = () => {
  const { t } = useTranslation()
  const databaseBlocks = useBlocks()
  const [persons, setResidents] = React.useState<PersonResponse[]>([])
  const [nameFilter, setNameFilter] = usePageFilter('platformResidents.name', '')
  const [selectedBlockId, setSelectedBlockId] = usePageFilter('platformResidents.block', 'all')
  const [statusFilter, setStatusFilter] = usePageFilter<'all' | PersonStatus>('platformResidents.status', 'all')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingResident, setEditingResident] = React.useState<PersonResponse | null>(null)
  const [deletingResident, setDeletingResident] = React.useState<PersonResponse | null>(null)
  const [isDeletingResident, setIsDeletingResident] = React.useState(false)
  const [deletionError, setDeletionError] = React.useState<string | null>(null)
  const [notification, setNotification] = React.useState('')
  const [form, setForm] = React.useState<FormState>(emptyForm)

  const loadResidents = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setResidents(await personsApi.getAll())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load platform persons')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timer = window.setTimeout(() => { void loadResidents() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadResidents])

  const selectedBlockFilter = selectedBlockId === 'all' || databaseBlocks.blocks.some((block) => block.id === selectedBlockId)
    ? selectedBlockId
    : 'all'

  const filteredResidents = React.useMemo(() => {
    const normalizedNameFilter = normalizeFilterValue(nameFilter)

    return persons.filter((resident) => {
      const matchesName = !normalizedNameFilter || normalizeFilterValue(resident.fullName).includes(normalizedNameFilter)
      const matchesBlock = selectedBlockFilter === 'all'
        || resident.blocks.some((block) => block.blockId === selectedBlockFilter)
        || resident.apartments.some((apartment) => apartment.blockId === selectedBlockFilter)
      const matchesStatus = statusFilter === 'all' || resident.status === statusFilter

      return matchesName && matchesBlock && matchesStatus
    })
  }, [nameFilter, persons, selectedBlockFilter, statusFilter])

  const clearFilters = () => {
    setNameFilter('')
    setSelectedBlockId('all')
    setStatusFilter('all')
  }

  const openEditDialog = (resident: PersonResponse) => {
    setEditingResident(resident)
    setForm({
      firstName: resident.firstName,
      lastName: resident.lastName,
      blockId: resident.blocks[0]?.blockId ?? databaseBlocks.blocks[0]?.id ?? '',
      invitePerson: resident.hasRegisteredAccount,
      email: resident.email ?? '',
      phone: resident.phone ?? '',
      status: resident.status,
    })
    setDialogMode('edit')
  }

  const saveResident = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.blockId) return

    const request = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      blockId: form.blockId,
      invitePerson: form.invitePerson,
      email: form.invitePerson ? form.email.trim() || null : null,
      phone: form.phone.trim() || null,
      userId: null,
      status: form.status,
    }

    setError(null)

    try {
      if (editingResident) {
        await personsApi.update(editingResident.id, request)
      } else {
        const createdResident = await personsApi.create(request)
        if (createdResident.wasExistingIdentity) {
          setNotification(t('persons.notifications.existingLinked'))
        }
      }

      setDialogMode(null)
      setEditingResident(null)
      await loadResidents()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save resident')
    }
  }

  const deleteResident = async () => {
    if (!deletingResident?.canDeleteUnlinkedProfile || isDeletingResident) return

    setIsDeletingResident(true)
    setDeletionError(null)

    try {
      await superAdminApi.deleteUnlinkedPerson(deletingResident.id)
      setDeletingResident(null)
      setNotification(t('adminUserDeletion.residentProfile.success'))
      await loadResidents()
    } catch (nextError) {
      const code = nextError instanceof ApiError ? nextError.code : undefined
      setDeletionError(code === 'DELETION_RESIDENT_NOT_UNLINKED' ? t('adminUserDeletion.residentProfile.blocked')
        : code === 'TRUSTED_AUTH_REQUIRED' ? t('adminUserDeletion.authRequired')
          : code === 'DELETION_DISABLED' ? t('adminUserDeletion.disabled')
            : code === 'DELETION_CSRF_INVALID' ? t('adminUserDeletion.csrfInvalid') : t('adminUserDeletion.residentProfile.failed'))
    } finally {
      setIsDeletingResident(false)
    }
  }

  const columns: DataColumn<PersonResponse>[] = [
    { key: 'name', label: t('superAdmin.persons.columns.name'), cardRole: 'primary', render: (resident) => resident.fullName },
    { key: 'email', label: t('superAdmin.persons.columns.email'), render: (resident) => resident.email || tableEmptyValue },
    { key: 'admins', label: t('superAdmin.persons.columns.admins'), render: (resident) => resident.adminAccounts.map((account) => account.displayName).join(', ') || tableEmptyValue },
    { key: 'phone', label: t('superAdmin.persons.columns.phone'), render: (resident) => resident.phone || tableEmptyValue },
    {
      key: 'assignments',
      label: t('persons.assignments.title'),
      render: resident => <ResidentApartmentAssignments apartments={resident.apartments} />,
    },
    {
      key: 'accountStatus',
      label: t('superAdmin.persons.columns.accountStatus'),
      cardRole: 'status',
      render: (resident) => (
        <StatusChip
          status={resident.hasRegisteredAccount ? 'active' : 'no_account'}
          label={resident.hasRegisteredAccount ? t('persons.account.registered') : t('persons.account.unregistered')}
        />
      ),
    },
    {
      key: 'membershipStatus',
      label: t('superAdmin.persons.columns.membershipStatus'),
      cardRole: 'status',
      render: (resident) => <StatusChip status={resident.status} label={translatePersonStatus(t, resident.status)} />,
    },
    {
      key: 'actions',
      label: t('superAdmin.persons.columns.quickAction'),
      cardRole: 'actions',
      actions: (resident) => [
        { id: 'edit', label: t('persons.actions.editPerson'), icon: <EditIcon />, visible: false, onClick: () => openEditDialog(resident), priority: 2 },
        { id: 'delete', label: t('adminUserDeletion.residentProfile.action'), icon: <DeleteIcon />, visible: resident.canDeleteUnlinkedProfile === true,
          onClick: () => { setDeletionError(null); setDeletingResident(resident) }, disabled: isDeletingResident, color: 'error', priority: 1 },
      ],
    },
  ]

  const hasValidInviteEmail = !form.invitePerson || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const canSave = Boolean(form.firstName.trim() && form.lastName.trim() && form.blockId && hasValidInviteEmail)
  const loadError = error || databaseBlocks.error
  const loading = isLoading || databaseBlocks.isLoading

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <PageHeader title={t('superAdmin.persons.title')} description={t('superAdmin.persons.description')} />
      <ActionBar
        title={(
          <>
            <SearchField
              disabled={Boolean(loadError)}
              label={t('persons.filters.searchName')}
              size="small"
              value={nameFilter}
              onClear={() => setNameFilter('')}
              onChange={(event) => setNameFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 240 } }}
            />
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 180 } }} disabled={Boolean(loadError) || loading}>
              <InputLabel>{t('settings.fields.block')}</InputLabel>
              <Select
                label={t('settings.fields.block')}
                value={selectedBlockFilter}
                onChange={(event: SelectChangeEvent) => setSelectedBlockId(event.target.value)}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                {databaseBlocks.blocks.map((block) => (
                  <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }} disabled={Boolean(loadError) || loading}>
              <InputLabel>{t('persons.fields.status')}</InputLabel>
              <Select
                label={t('persons.fields.status')}
                value={statusFilter}
                onChange={(event: SelectChangeEvent) => setStatusFilter(event.target.value as 'all' | PersonStatus)}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                {personStatuses.map((status) => (
                  <MenuItem key={status} value={status}>{translatePersonStatus(t, status)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      >
        <CreateForAdmin kind="person" onCreated={async () => { clearFilters(); await loadResidents() }} />
      </ActionBar>

      {loading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('superAdmin.persons.loading')}</Typography>
        </Paper>
      ) : loadError ? (
        <LoadErrorState helperText={t('superAdmin.persons.errors.loadFailed')} onRetry={() => { void loadResidents(); void databaseBlocks.refresh() }} />
      ) : persons.length === 0 ? (
        <EmptyState
          headline={t('superAdmin.persons.empty.headline')}
          helperText={t('superAdmin.persons.empty.helperText')}
        />
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          actionLabel={t('common.clearFilters')}
          headline={t('persons.filters.emptyHeadline')}
          helperText={t('persons.filters.emptyHelper')}
          onAction={clearFilters}
        />
      ) : (
        <PagedResponsiveDataView endpoint="/persons/page" query={{ search: nameFilter, blockId: selectedBlockFilter === 'all' ? undefined : selectedBlockFilter, status: statusFilter === 'all' ? undefined : statusFilter }}
          paginationId="SuperAdminPersons-1"
          paginationResetKey={JSON.stringify([nameFilter, selectedBlockFilter, statusFilter])}
          ariaLabel={t('superAdmin.persons.title')}
          columns={columns}
          desktopTableMinWidth={1100}
          getRowId={(resident) => resident.id}
          rows={filteredResidents}
        />
      )}

      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!canSave}
        confirmLabel={t('common.save')}
        contentSx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}
        maxWidth="sm"
        onCancel={() => setDialogMode(null)}
        onConfirm={() => { void saveResident() }}
        open={Boolean(dialogMode)}
        title={dialogMode === 'edit' ? t('persons.actions.editPerson') : t('persons.actions.addPerson')}
      >
        <TextField
          autoFocus
          fullWidth
          required
          size="small"
          label={t('persons.fields.firstName')}
          value={form.firstName}
          onChange={(event) => setForm((value) => ({ ...value, firstName: event.target.value }))}
        />
        <TextField
          fullWidth
          required
          size="small"
          label={t('persons.fields.lastName')}
          value={form.lastName}
          onChange={(event) => setForm((value) => ({ ...value, lastName: event.target.value }))}
        />
        <FormControl fullWidth required size="small">
          <InputLabel>{t('settings.fields.block')}</InputLabel>
          <Select
            label={t('settings.fields.block')}
            value={form.blockId}
            onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, blockId: event.target.value }))}
          >
            {databaseBlocks.blocks.map((block) => (
              <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={(
            <Checkbox
              checked={form.invitePerson}
              disabled={Boolean(editingResident?.hasRegisteredAccount)}
              onChange={(event) => setForm((value) => ({ ...value, invitePerson: event.target.checked, email: event.target.checked ? value.email : '' }))}
            />
          )}
          label={t('persons.fields.invitePerson')}
        />
        {form.invitePerson && (
          <TextField
            fullWidth
            required
            size="small"
            label={t('persons.fields.email')}
            type="email"
            value={form.email}
            error={Boolean(form.email.trim()) && !hasValidInviteEmail}
            helperText={Boolean(form.email.trim()) && !hasValidInviteEmail ? t('persons.errors.invalidEmail') : undefined}
            onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
          />
        )}
        <TextField
          fullWidth
          size="small"
          label={t('persons.fields.phoneOptional')}
          value={form.phone}
          onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))}
        />
        <FormControl fullWidth size="small">
          <InputLabel>{t('persons.fields.status')}</InputLabel>
          <Select
            label={t('persons.fields.status')}
            value={form.status}
            onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, status: event.target.value as PersonStatus }))}
          >
            {personStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {translatePersonStatus(t, status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </AppDialog>

      <AppDialog
        pending={isDeletingResident}
        confirmColor="error"
        maxWidth="xs"
        cancelLabel={t('common.cancel')}
        confirmDisabled={!deletingResident || isDeletingResident}
        confirmLabel={isDeletingResident ? t('persons.dialog.deleting') : t('persons.dialog.deleteConfirmYes')}
        onCancel={() => { if (!isDeletingResident) setDeletingResident(null) }}
        onConfirm={() => { void deleteResident() }}
        open={Boolean(deletingResident)}
        title={t('adminUserDeletion.residentProfile.title')}
      >
        <Typography color="text.secondary">
          {t('adminUserDeletion.residentProfile.confirm', {
            resident: deletingResident?.fullName ?? '',
          })}
        </Typography>
        {deletionError && <Alert severity="error" sx={{ mt: 2 }}>{deletionError}</Alert>}
      </AppDialog>

      <Snackbar
        autoHideDuration={5000}
        open={Boolean(notification)}
        onClose={() => setNotification('')}
      >
        <Alert severity="info" variant="filled" onClose={() => setNotification('')}>
          {notification}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SuperAdminPersons
