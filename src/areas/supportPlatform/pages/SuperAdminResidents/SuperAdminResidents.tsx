import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useTranslation } from 'react-i18next'
import ActionBar from '../../../../components/shared/ActionBar'
import AppDialog from '../../../../components/shared/AppDialog'
import ConfirmationDialog from '../../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../components/shared/StatusChip'
import { translateResidentStatus } from '../../../../domain/displayLabels'
import { useBlocks } from '../../../../hooks/useBlocks'
import { residentsApi } from '../../../../services/residentsApi'
import type { ResidentResponse, ResidentStatus } from '../../../../types/management'

type FormState = {
  firstName: string
  lastName: string
  blockId: string
  inviteResident: boolean
  email: string
  phone: string
  status: ResidentStatus
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  blockId: '',
  inviteResident: false,
  email: '',
  phone: '',
  status: 'active',
}

const residentStatuses: ResidentStatus[] = ['active', 'inactive']
const tableEmptyValue = '-'
const normalizeFilterValue = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const getUniqueApartmentValues = (
  apartments: ResidentResponse['apartments'],
  getValue: (apartment: ResidentResponse['apartments'][number]) => string | null,
) => {
  const values = apartments.map(getValue).filter((value): value is string => Boolean(value))

  return Array.from(new Set(values)).join(', ')
}

const SuperAdminResidents: React.FC = () => {
  const { t } = useTranslation()
  const databaseBlocks = useBlocks()
  const [residents, setResidents] = React.useState<ResidentResponse[]>([])
  const [nameFilter, setNameFilter] = React.useState('')
  const [selectedBlockId, setSelectedBlockId] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState<'all' | ResidentStatus>('all')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingResident, setEditingResident] = React.useState<ResidentResponse | null>(null)
  const [deletingResident, setDeletingResident] = React.useState<ResidentResponse | null>(null)
  const [isDeletingResident, setIsDeletingResident] = React.useState(false)
  const [notification, setNotification] = React.useState('')
  const [form, setForm] = React.useState<FormState>(emptyForm)

  const loadResidents = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setResidents(await residentsApi.getAll())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load platform residents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadResidents()
  }, [loadResidents])

  const selectedBlockFilter = selectedBlockId === 'all' || databaseBlocks.blocks.some((block) => block.id === selectedBlockId)
    ? selectedBlockId
    : 'all'

  const filteredResidents = React.useMemo(() => {
    const normalizedNameFilter = normalizeFilterValue(nameFilter)

    return residents.filter((resident) => {
      const matchesName = !normalizedNameFilter || normalizeFilterValue(resident.fullName).includes(normalizedNameFilter)
      const matchesBlock = selectedBlockFilter === 'all'
        || resident.blocks.some((block) => block.blockId === selectedBlockFilter)
        || resident.apartments.some((apartment) => apartment.blockId === selectedBlockFilter)
      const matchesStatus = statusFilter === 'all' || resident.status === statusFilter

      return matchesName && matchesBlock && matchesStatus
    })
  }, [nameFilter, residents, selectedBlockFilter, statusFilter])

  const clearFilters = () => {
    setNameFilter('')
    setSelectedBlockId('all')
    setStatusFilter('all')
  }

  const openCreateDialog = () => {
    setEditingResident(null)
    setForm({
      ...emptyForm,
      blockId: selectedBlockFilter !== 'all' ? selectedBlockFilter : databaseBlocks.blocks[0]?.id ?? '',
    })
    setDialogMode('create')
  }

  const openEditDialog = (resident: ResidentResponse) => {
    setEditingResident(resident)
    setForm({
      firstName: resident.firstName,
      lastName: resident.lastName,
      blockId: resident.blocks[0]?.blockId ?? databaseBlocks.blocks[0]?.id ?? '',
      inviteResident: resident.hasRegisteredAccount,
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
      inviteResident: form.inviteResident,
      email: form.inviteResident ? form.email.trim() || null : null,
      phone: form.phone.trim() || null,
      userId: null,
      status: form.status,
    }

    setError(null)

    try {
      if (editingResident) {
        await residentsApi.update(editingResident.id, request)
      } else {
        const createdResident = await residentsApi.create(request)
        if (createdResident.wasExistingIdentity) {
          setNotification(t('residents.notifications.existingLinked'))
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
    if (!deletingResident || isDeletingResident) return

    setIsDeletingResident(true)
    setError(null)

    try {
      await residentsApi.delete(deletingResident.id)
      setDeletingResident(null)
      await loadResidents()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete resident')
    } finally {
      setIsDeletingResident(false)
    }
  }

  const columns: DataColumn<ResidentResponse>[] = [
    { key: 'name', label: t('superAdmin.residents.columns.name'), cardRole: 'primary', render: (resident) => resident.fullName },
    { key: 'email', label: t('superAdmin.residents.columns.email'), render: (resident) => resident.email || tableEmptyValue },
    { key: 'phone', label: t('superAdmin.residents.columns.phone'), render: (resident) => resident.phone || tableEmptyValue },
    {
      key: 'block',
      label: t('superAdmin.residents.columns.block'),
      render: (resident) => resident.blocks.length === 0
        ? tableEmptyValue
        : Array.from(new Set(resident.blocks.map((block) => block.blockName))).join(', ') || tableEmptyValue,
    },
    {
      key: 'staircase',
      label: t('superAdmin.residents.columns.staircase'),
      render: (resident) => getUniqueApartmentValues(resident.apartments, (apartment) => apartment.staircaseName) || tableEmptyValue,
    },
    {
      key: 'apartment',
      label: t('superAdmin.residents.columns.apartment'),
      render: (resident) => getUniqueApartmentValues(resident.apartments, (apartment) => apartment.apartmentNumber) || tableEmptyValue,
    },
    {
      key: 'accountStatus',
      label: t('superAdmin.residents.columns.accountStatus'),
      cardRole: 'status',
      render: (resident) => (
        <StatusChip
          status={resident.hasRegisteredAccount ? 'active' : 'no_account'}
          label={resident.hasRegisteredAccount ? t('residents.account.registered') : t('residents.account.unregistered')}
        />
      ),
    },
    {
      key: 'membershipStatus',
      label: t('superAdmin.residents.columns.membershipStatus'),
      cardRole: 'status',
      render: (resident) => <StatusChip status={resident.status} label={translateResidentStatus(t, resident.status)} />,
    },
    {
      key: 'actions',
      label: t('superAdmin.residents.columns.quickAction'),
      cardRole: 'actions',
      render: (resident) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button size="small" startIcon={<EditIcon />} onClick={() => openEditDialog(resident)}>
            {t('residents.actions.editResident')}
          </Button>
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setDeletingResident(resident)}
            disabled={isDeletingResident}
          >
            {t('residents.actions.deleteResident')}
          </Button>
        </Box>
      ),
    },
  ]

  const hasValidInviteEmail = !form.inviteResident || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const canSave = Boolean(form.firstName.trim() && form.lastName.trim() && form.blockId && hasValidInviteEmail)
  const loadError = error || databaseBlocks.error
  const loading = isLoading || databaseBlocks.isLoading

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <PageHeader title={t('superAdmin.residents.title')} description={t('superAdmin.residents.description')} />
      <ActionBar
        title={(
          <>
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
              <InputLabel>{t('residents.fields.status')}</InputLabel>
              <Select
                label={t('residents.fields.status')}
                value={statusFilter}
                onChange={(event: SelectChangeEvent) => setStatusFilter(event.target.value as 'all' | ResidentStatus)}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                {residentStatuses.map((status) => (
                  <MenuItem key={status} value={status}>{translateResidentStatus(t, status)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              disabled={Boolean(loadError)}
              label={t('residents.filters.searchName')}
              size="small"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 240 } }}
            />
          </>
        )}
      >
        <Button startIcon={<PersonAddIcon />} variant="contained" onClick={openCreateDialog} disabled={Boolean(loadError) || databaseBlocks.blocks.length === 0}>
          {t('residents.actions.addResident')}
        </Button>
      </ActionBar>

      {loading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('superAdmin.residents.loading')}</Typography>
        </Paper>
      ) : loadError ? (
        <LoadErrorState helperText={t('superAdmin.residents.errors.loadFailed')} onRetry={() => { void loadResidents(); void databaseBlocks.refresh() }} />
      ) : residents.length === 0 ? (
        <EmptyState
          actionLabel={t('emptyState.action', { information: t('emptyState.information.residents') })}
          headline={t('superAdmin.residents.empty.headline')}
          helperText={t('superAdmin.residents.empty.helperText')}
          onAction={openCreateDialog}
        />
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          actionLabel={t('common.clearFilters')}
          headline={t('residents.filters.emptyHeadline')}
          helperText={t('residents.filters.emptyHelper')}
          onAction={clearFilters}
        />
      ) : (
        <ResponsiveDataView
          ariaLabel={t('superAdmin.residents.title')}
          columns={columns}
          desktopTableMinWidth={1300}
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
        title={dialogMode === 'edit' ? t('residents.actions.editResident') : t('residents.actions.addResident')}
      >
        <TextField
          autoFocus
          fullWidth
          required
          size="small"
          label={t('residents.fields.firstName')}
          value={form.firstName}
          onChange={(event) => setForm((value) => ({ ...value, firstName: event.target.value }))}
        />
        <TextField
          fullWidth
          required
          size="small"
          label={t('residents.fields.lastName')}
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
              checked={form.inviteResident}
              disabled={Boolean(editingResident?.hasRegisteredAccount)}
              onChange={(event) => setForm((value) => ({ ...value, inviteResident: event.target.checked, email: event.target.checked ? value.email : '' }))}
            />
          )}
          label={t('residents.fields.inviteResident')}
        />
        {form.inviteResident && (
          <TextField
            fullWidth
            required
            size="small"
            label={t('residents.fields.email')}
            type="email"
            value={form.email}
            error={Boolean(form.email.trim()) && !hasValidInviteEmail}
            helperText={Boolean(form.email.trim()) && !hasValidInviteEmail ? t('residents.errors.invalidEmail') : undefined}
            onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
          />
        )}
        <TextField
          fullWidth
          size="small"
          label={t('residents.fields.phoneOptional')}
          value={form.phone}
          onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))}
        />
        <FormControl fullWidth size="small">
          <InputLabel>{t('residents.fields.status')}</InputLabel>
          <Select
            label={t('residents.fields.status')}
            value={form.status}
            onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, status: event.target.value as ResidentStatus }))}
          >
            {residentStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {translateResidentStatus(t, status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </AppDialog>

      <ConfirmationDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!deletingResident || isDeletingResident}
        confirmLabel={isDeletingResident ? t('residents.dialog.deleting') : t('residents.dialog.deleteConfirmYes')}
        onCancel={() => setDeletingResident(null)}
        onConfirm={() => { void deleteResident() }}
        open={Boolean(deletingResident)}
        title={t('residents.dialog.deleteTitle')}
      >
        <Typography color="text.secondary">
          {t('residents.dialog.deleteConfirm', {
            resident: deletingResident?.fullName ?? '',
          })}
        </Typography>
      </ConfirmationDialog>

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

export default SuperAdminResidents
