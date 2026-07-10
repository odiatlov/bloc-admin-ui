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
import ActionBar from '../../../../../components/shared/ActionBar'
import AppDialog from '../../../../../components/shared/AppDialog'
import ConfirmationDialog from '../../../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../../components/shared/StatusChip'
import { translateResidentStatus } from '../../../../../domain/displayLabels'
import { useBlocks } from '../../../../../hooks/useBlocks'
import { residentsApi } from '../../../../../services/residentsApi'
import type { ResidentResponse, ResidentStatus } from '../../../../../types/management'

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
const tableEmptyValue = '-'

const normalizeFilterValue = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const getUniqueApartmentValues = (
  resident: ResidentResponse,
  getValue: (apartment: ResidentResponse['apartments'][number]) => string | null,
) => {
  const values = resident.apartments
    .map(getValue)
    .filter((value): value is string => Boolean(value))

  return Array.from(new Set(values)).join(', ')
}

const getRoleLabel = (t: ReturnType<typeof useTranslation>['t'], role: string) => (
  t(`residents.roles.${role}`, { defaultValue: role })
)

const getDisplayRoles = (resident: ResidentResponse) => {
  const elevatedRoles = resident.roles.filter((role) => role === 'Admin' || role === 'Censor')

  return elevatedRoles.length > 0 ? elevatedRoles : ['Resident']
}

const ApiResidentsOverview: React.FC = () => {
  const { t } = useTranslation()
  const databaseBlocks = useBlocks()
  const [residents, setResidents] = React.useState<ResidentResponse[]>([])
  const [nameFilter, setNameFilter] = React.useState('')
  const [selectedBlockId, setSelectedBlockId] = React.useState('all')
  const [staircaseFilter, setStaircaseFilter] = React.useState('')
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
    const timeoutId = window.setTimeout(() => {
      void loadResidents()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadResidents])

  const selectedBlockFilter = selectedBlockId === 'all' || databaseBlocks.blocks.some((block) => block.id === selectedBlockId)
    ? selectedBlockId
    : 'all'

  const filteredResidents = React.useMemo(() => {
    const normalizedNameFilter = normalizeFilterValue(nameFilter)
    const normalizedStaircaseFilter = normalizeFilterValue(staircaseFilter)

    return residents.filter((resident) => {
      const matchesName = !normalizedNameFilter || normalizeFilterValue(resident.fullName).includes(normalizedNameFilter)
      const matchesBlock = selectedBlockFilter === 'all' || resident.apartments.some((apartment) => apartment.blockId === selectedBlockFilter)
      const matchesStaircase = !normalizedStaircaseFilter || resident.apartments.some((apartment) => (
        normalizeFilterValue(apartment.staircaseName).includes(normalizedStaircaseFilter)
      ))

      return matchesName && matchesBlock && matchesStaircase
    })
  }, [nameFilter, residents, selectedBlockFilter, staircaseFilter])

  const clearFilters = () => {
    setNameFilter('')
    setSelectedBlockId('all')
    setStaircaseFilter('')
  }

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
    { key: 'email', label: t('residents.fields.email'), render: (resident) => resident.email || tableEmptyValue },
    { key: 'phone', label: t('residents.fields.phone'), render: (resident) => resident.phone || tableEmptyValue },
    {
      key: 'roles',
      label: t('residents.fields.roles'),
      render: (resident) => getDisplayRoles(resident).map((role) => getRoleLabel(t, role)).join(', '),
    },
    {
      key: 'block',
      label: t('settings.fields.block'),
      render: (resident) => resident.apartmentCount === 0
        ? tableEmptyValue
        : getUniqueApartmentValues(resident, (apartment) => apartment.blockName) || tableEmptyValue,
    },
    {
      key: 'staircase',
      label: t('blocks.columns.staircase'),
      render: (resident) => resident.apartmentCount === 0
        ? tableEmptyValue
        : getUniqueApartmentValues(resident, (apartment) => apartment.staircaseName) || tableEmptyValue,
    },
    {
      key: 'apartment',
      label: t('apartments.setup.number'),
      render: (resident) => resident.apartmentCount === 0
        ? tableEmptyValue
        : getUniqueApartmentValues(resident, (apartment) => apartment.apartmentNumber) || tableEmptyValue,
    },
    {
      key: 'status',
      label: t('residents.fields.status'),
      cardRole: 'status',
      render: (resident) => <StatusChip status={resident.status} label={translateResidentStatus(t, resident.status)} />,
    },
    {
      key: 'registeredAccount',
      label: t('residents.fields.registeredAccount'),
      cardRole: 'status',
      render: (resident) => (
        <StatusChip
          status={resident.hasRegisteredAccount ? 'active' : 'unregistered'}
          label={resident.hasRegisteredAccount ? t('residents.account.registered') : t('residents.account.unregistered')}
        />
      ),
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
      <ActionBar
        title={(
          <>
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 180 } }} disabled={Boolean(error) || databaseBlocks.isLoading || Boolean(databaseBlocks.error)}>
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
            <TextField
              disabled={Boolean(error)}
              label={t('residents.filters.staircase')}
              size="small"
              value={staircaseFilter}
              onChange={(event) => setStaircaseFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />
            <TextField
              disabled={Boolean(error)}
              label={t('residents.filters.searchName')}
              size="small"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 240 } }}
            />
          </>
        )}
      >
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
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          actionLabel={t('common.clearFilters')}
          headline={t('residents.filters.emptyHeadline')}
          helperText={t('residents.filters.emptyHelper')}
          onAction={clearFilters}
        />
      ) : (
        <ResponsiveDataView
          ariaLabel={t('sidebar.residents')}
          columns={columns}
          desktopTableMinWidth={1400}
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
