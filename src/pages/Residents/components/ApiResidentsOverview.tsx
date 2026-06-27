import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useTranslation } from 'react-i18next'
import ActionBar from '../../../components/shared/ActionBar'
import AppDialog from '../../../components/shared/AppDialog'
import ConfirmationDialog from '../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../components/shared/EmptyState'
import LoadErrorState from '../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { translateResidentStatus } from '../../../domain/displayLabels'
import { residentsApi } from '../../../services/residentsApi'
import type { ResidentResponse, ResidentStatus } from '../../../types/management'

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  status: ResidentStatus
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  status: 'active',
}

const residentStatuses: ResidentStatus[] = ['active', 'inactive']

const getUniqueApartmentValues = (
  resident: ResidentResponse,
  getValue: (apartment: ResidentResponse['apartments'][number]) => string | null,
) => {
  const values = resident.apartments
    .map(getValue)
    .filter((value): value is string => Boolean(value))

  return Array.from(new Set(values)).join(', ')
}

const ApiResidentsOverview: React.FC = () => {
  const { t } = useTranslation()
  const [residents, setResidents] = React.useState<ResidentResponse[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingResident, setEditingResident] = React.useState<ResidentResponse | null>(null)
  const [deletingResident, setDeletingResident] = React.useState<ResidentResponse | null>(null)
  const [isDeletingResident, setIsDeletingResident] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(emptyForm)

  const loadResidents = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setResidents(await residentsApi.getAll())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load residents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadResidents()
  }, [loadResidents])

  const openCreateDialog = () => {
    setEditingResident(null)
    setForm(emptyForm)
    setDialogMode('create')
  }

  const openEditDialog = (resident: ResidentResponse) => {
    setEditingResident(resident)
    setForm({
      firstName: resident.firstName,
      lastName: resident.lastName,
      email: resident.email ?? '',
      phone: resident.phone ?? '',
      status: resident.status,
    })
    setDialogMode('edit')
  }

  const saveResident = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return

    const request = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      userId: editingResident?.userId ?? null,
      status: form.status,
    }

    setError(null)

    try {
      if (editingResident) {
        await residentsApi.update(editingResident.id, request)
      } else {
        await residentsApi.create(request)
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
    { key: 'name', label: t('residents.fields.name'), cardRole: 'primary', render: (resident) => resident.fullName },
    { key: 'email', label: t('residents.fields.email'), render: (resident) => resident.email || t('residents.resident.noEmail') },
    { key: 'phone', label: t('residents.fields.phone'), render: (resident) => resident.phone || t('common.notAvailable') },
    {
      key: 'block',
      label: t('settings.fields.block'),
      render: (resident) => resident.apartmentCount === 0
        ? t('residents.apartment.unassigned')
        : getUniqueApartmentValues(resident, (apartment) => apartment.blockName),
    },
    {
      key: 'staircase',
      label: t('blocks.columns.staircase'),
      render: (resident) => resident.apartmentCount === 0
        ? t('common.notAvailable')
        : getUniqueApartmentValues(resident, (apartment) => apartment.staircaseName),
    },
    {
      key: 'apartment',
      label: t('apartments.setup.number'),
      render: (resident) => resident.apartmentCount === 0
        ? t('common.notAvailable')
        : getUniqueApartmentValues(resident, (apartment) => apartment.apartmentNumber),
    },
    {
      key: 'status',
      label: t('residents.fields.status'),
      cardRole: 'status',
      render: (resident) => <StatusChip status={resident.status} label={translateResidentStatus(t, resident.status)} />,
    },
    {
      key: 'actions',
      label: t('common.actions'),
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

  const canSave = Boolean(form.firstName.trim() && form.lastName.trim())

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <ActionBar title={t('dashboard.admin.quickActions')}>
        <Button startIcon={<PersonAddIcon />} variant="contained" onClick={openCreateDialog} disabled={Boolean(error)}>
          {t('residents.actions.addResident')}
        </Button>
      </ActionBar>

      {isLoading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('residents.loading')}</Typography>
        </Paper>
      ) : error ? (
        <LoadErrorState helperText={t('residents.errors.loadFailed')} onRetry={() => { void loadResidents() }} />
      ) : residents.length === 0 ? (
        <EmptyState
          actionLabel={t('emptyState.action', { information: t('emptyState.information.residents') })}
          headline={t('emptyState.headline', { information: t('emptyState.information.residents') })}
          helperText={t('emptyState.helper.dedicated', { information: t('emptyState.information.residents') })}
          onAction={openCreateDialog}
        />
      ) : (
        <ResponsiveDataView
          ariaLabel={t('sidebar.residents')}
          columns={columns}
          desktopTableMinWidth={1180}
          getRowId={(resident) => resident.id}
          rows={residents}
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
        <TextField
          fullWidth
          size="small"
          label={t('residents.fields.emailOptional')}
          type="email"
          value={form.email}
          onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
        />
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
    </Box>
  )
}

export default ApiResidentsOverview
