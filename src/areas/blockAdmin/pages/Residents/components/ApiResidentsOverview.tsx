import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
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
import ActionBar from '../../../../../components/shared/ActionBar'
import AppDialog from '../../../../../components/shared/AppDialog'
import ConfirmationDialog from '../../../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import SearchField from '../../../../../components/shared/SearchField'
import { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import PagedResponsiveDataView from '../../../../../components/shared/PagedResponsiveDataView'
import StatusChip from '../../../../../components/shared/StatusChip'
import { translateResidentStatus } from '../../../../../domain/displayLabels'
import { useBlocks } from '../../../../../hooks/useBlocks'
import { blocksApi } from '../../../../../services/blocksApi'
import { residentsApi } from '../../../../../services/residentsApi'
import type { ResidentResponse, ResidentStatus } from '../../../../../types/management'
import { RoleContext } from '../../../../../contexts/RoleContext'

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
  const values = apartments
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
  const { role } = React.useContext(RoleContext)
  const canManage = role === 'Admin'
  const databaseBlocks = useBlocks()
  const [residents, setResidents] = React.useState<ResidentResponse[]>([])
  const [nameFilter, setNameFilter] = React.useState('')
  const [selectedBlockId, setSelectedBlockId] = React.useState('all')
  const [staircaseFilter, setStaircaseFilter] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [mutationError, setMutationError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingResident, setEditingResident] = React.useState<ResidentResponse | null>(null)
  const [deletingResidents, setDeletingResidents] = React.useState<ResidentResponse[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeletingResident, setIsDeletingResident] = React.useState(false)
  const [isAssigningCensor, setIsAssigningCensor] = React.useState(false)
  const [notification, setNotification] = React.useState('')
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const allowedBlockIds = React.useMemo(
    () => new Set(databaseBlocks.blocks.map((block) => block.id)),
    [databaseBlocks.blocks],
  )
  // The API owns resident visibility, including retained residents without a block.
  const scopedResidents = residents

  const loadResidents = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextResidents = await residentsApi.getAll()
      setResidents(nextResidents)
      setSelectedIds((previous) => new Set([...previous].filter((id) => nextResidents.some((resident) => resident.id === id))))
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

  const selectedBlockFilter = selectedBlockId === 'all' || selectedBlockId === 'unassigned' || databaseBlocks.blocks.some((block) => block.id === selectedBlockId)
    ? selectedBlockId
    : 'all'

  React.useEffect(() => {
    if (databaseBlocks.isLoading || selectedBlockId === selectedBlockFilter) return
    const timer = window.setTimeout(() => {
      setSelectedBlockId('all')
      setStaircaseFilter('')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [databaseBlocks.isLoading, selectedBlockFilter, selectedBlockId])

  const filteredResidents = React.useMemo(() => {
    const normalizedNameFilter = normalizeFilterValue(nameFilter)
    const normalizedStaircaseFilter = normalizeFilterValue(staircaseFilter)

    return scopedResidents.filter((resident) => {
      const visibleApartments = resident.apartments.filter((apartment) => allowedBlockIds.has(apartment.blockId))
      const visibleBlocks = resident.blocks.filter((block) => allowedBlockIds.has(block.blockId))
      const matchesName = !normalizedNameFilter || normalizeFilterValue(resident.fullName).includes(normalizedNameFilter)
      const matchesBlock = selectedBlockFilter === 'all'
        || (selectedBlockFilter === 'unassigned'
          ? visibleBlocks.length === 0 && visibleApartments.length === 0
          : visibleBlocks.some((block) => block.blockId === selectedBlockFilter) || visibleApartments.some((apartment) => apartment.blockId === selectedBlockFilter))
      const matchesStaircase = !normalizedStaircaseFilter || visibleApartments.some((apartment) => (
        normalizeFilterValue(apartment.staircaseName).includes(normalizedStaircaseFilter)
      ))

      return matchesName && matchesBlock && matchesStaircase
    })
  }, [allowedBlockIds, nameFilter, scopedResidents, selectedBlockFilter, staircaseFilter])

  const clearFilters = () => {
    setNameFilter('')
    setSelectedBlockId('all')
    setStaircaseFilter('')
  }

  const openCreateDialog = () => {
    setMutationError(null)
    setEditingResident(null)
    setForm({
      ...emptyForm,
      blockId: allowedBlockIds.has(selectedBlockFilter) ? selectedBlockFilter : databaseBlocks.blocks[0]?.id ?? '',
    })
    setDialogMode('create')
  }

  const openEditDialog = (resident: ResidentResponse) => {
    setMutationError(null)
    setEditingResident(resident)
    setForm({
      firstName: resident.firstName,
      lastName: resident.lastName,
      blockId: resident.blocks.find((block) => allowedBlockIds.has(block.blockId))?.blockId ?? databaseBlocks.blocks[0]?.id ?? '',
      inviteResident: resident.hasRegisteredAccount,
      email: resident.email ?? '',
      phone: resident.phone ?? '',
      status: resident.status,
    })
    setDialogMode('edit')
  }

  const saveResident = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.blockId || isSaving || !canManage) return

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

    setMutationError(null)
    setIsSaving(true)

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
      await databaseBlocks.refresh()
    } catch (nextError) {
      setMutationError(nextError instanceof Error ? nextError.message : t('residents.retention.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const deleteResident = async () => {
    if (deletingResidents.length === 0 || isDeletingResident || !canManage) return

    setIsDeletingResident(true)
    setMutationError(null)

    try {
      if (deletingResidents.length === 1) await residentsApi.delete(deletingResidents[0].id)
      else await residentsApi.removeMany(deletingResidents.map((resident) => resident.id))
      setDeletingResidents([])
      setSelectedIds(new Set())
      await loadResidents()
      await databaseBlocks.refresh()
    } catch (nextError) {
      setMutationError(nextError instanceof Error ? nextError.message : t('residents.retention.removeFailed'))
    } finally {
      setIsDeletingResident(false)
    }
  }

  const assignCensor = async () => {
    if (!editingResident || !form.blockId || isAssigningCensor) return

    setIsAssigningCensor(true)
    setMutationError(null)

    try {
      await blocksApi.assignCensor(form.blockId, { residentId: editingResident.id })
      setNotification(t('residents.notifications.censorAssigned'))
      await loadResidents()
    } catch (nextError) {
      setMutationError(nextError instanceof Error ? nextError.message : t('residents.retention.saveFailed'))
    } finally {
      setIsAssigningCensor(false)
    }
  }

  const columns: DataColumn<ResidentResponse>[] = [
    ...(canManage ? [{
      key: 'selection', label: t('residents.retention.select'), cardRole: 'hidden' as const,
      render: (resident: ResidentResponse) => renderSelection(resident),
    }] : []),
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
      render: (resident) => {
        const visibleBlocks = resident.blocks.filter((block) => allowedBlockIds.has(block.blockId))
        return visibleBlocks.length === 0
          ? resident.apartments.length > 0
            ? Array.from(new Set(resident.apartments.map((apartment) => apartment.blockName))).join(', ')
            : <StatusChip status="unassigned" label={t('residents.retention.noBlock')} />
          : Array.from(new Set(visibleBlocks.map((block) => block.blockName))).join(', ') || tableEmptyValue
      },
    },
    {
      key: 'staircase',
      label: t('blocks.columns.staircase'),
      render: (resident) => {
        const visibleApartments = resident.apartments.filter((apartment) => allowedBlockIds.has(apartment.blockId))
        return visibleApartments.length === 0
          ? tableEmptyValue
          : getUniqueApartmentValues(visibleApartments, (apartment) => apartment.staircaseName) || tableEmptyValue
      },
    },
    {
      key: 'apartment',
      label: t('apartments.setup.number'),
      render: (resident) => {
        const visibleApartments = resident.apartments.filter((apartment) => allowedBlockIds.has(apartment.blockId))
        return visibleApartments.length === 0
          ? tableEmptyValue
          : getUniqueApartmentValues(visibleApartments, (apartment) => apartment.apartmentNumber) || tableEmptyValue
      },
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
      actions: (resident) => [
        { id: 'edit', label: t('residents.actions.editResident'), icon: <EditIcon />, onClick: () => openEditDialog(resident), disabled: !canManage || databaseBlocks.blocks.length === 0 || isDeletingResident, priority: 2 },
        { id: 'delete', label: t('residents.actions.deleteResident'), icon: <DeleteIcon />, onClick: () => { setMutationError(null); setDeletingResidents([resident]) }, disabled: !canManage || isDeletingResident, color: 'error', priority: 1 },
      ],
    },
  ]

  const hasValidInviteEmail = !form.inviteResident || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const canSave = Boolean(canManage && !isSaving && form.firstName.trim() && form.lastName.trim() && allowedBlockIds.has(form.blockId) && hasValidInviteEmail)
  const selectedCensorBlockName = databaseBlocks.blocks.find((block) => block.id === form.blockId)?.displayName ?? ''
  const canAssignCensor = Boolean(
    editingResident?.hasRegisteredAccount
    && form.blockId
    && editingResident.apartments.some((apartment) => apartment.blockId === form.blockId),
  )
  const censorAssignmentHelper = !editingResident
    ? ''
    : !editingResident.hasRegisteredAccount
      ? t('residents.censorAssignment.requiresAccount')
      : !editingResident.apartments.some((apartment) => apartment.blockId === form.blockId)
        ? t('residents.censorAssignment.requiresApartment')
        : t('residents.censorAssignment.helper', { block: selectedCensorBlockName })
  const loadError = error || databaseBlocks.error
  const loading = isLoading || databaseBlocks.isLoading

  function renderSelection(resident: ResidentResponse) {
    return <Checkbox
      checked={selectedIds.has(resident.id)}
      disabled={isDeletingResident || (!selectedIds.has(resident.id) && selectedIds.size >= 500)}
      slotProps={{ input: { 'aria-label': t('residents.retention.selectResident', { resident: resident.fullName }) } }}
      onChange={(event) => setSelectedIds((previous) => {
        const next = new Set(previous)
        if (event.target.checked) next.add(resident.id)
        else next.delete(resident.id)
        return next
      })}
    />
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <ActionBar
        title={(
          <>
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 180 } }} disabled={Boolean(loadError) || loading}>
              <InputLabel>{t('settings.fields.block')}</InputLabel>
              <Select
                label={t('settings.fields.block')}
                value={selectedBlockFilter}
                onChange={(event: SelectChangeEvent) => { setSelectedBlockId(event.target.value); setStaircaseFilter('') }}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="unassigned">{t('residents.retention.noBlock')}</MenuItem>
                {databaseBlocks.blocks.map((block) => (
                  <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <SearchField
              disabled={Boolean(loadError)}
              label={t('residents.filters.staircase')}
              size="small"
              value={staircaseFilter}
              onClear={() => setStaircaseFilter('')}
              onChange={(event) => setStaircaseFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />
            <SearchField
              disabled={Boolean(loadError)}
              label={t('residents.filters.searchName')}
              size="small"
              value={nameFilter}
              onClear={() => setNameFilter('')}
              onChange={(event) => setNameFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 240 } }}
            />
          </>
        )}
      >
        <Button startIcon={<PersonAddIcon />} variant="contained" onClick={openCreateDialog} disabled={!canManage || Boolean(loadError) || loading || databaseBlocks.blocks.length === 0}>
          {t('residents.actions.addResident')}
        </Button>
      </ActionBar>

      {canManage && !loading && !loadError && scopedResidents.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <FormControlLabel label={t('residents.retention.selectFiltered')}
            control={<Checkbox
              checked={filteredResidents.length > 0 && filteredResidents.every((resident) => selectedIds.has(resident.id))}
              indeterminate={filteredResidents.some((resident) => selectedIds.has(resident.id)) && !filteredResidents.every((resident) => selectedIds.has(resident.id))}
              disabled={isDeletingResident || filteredResidents.length === 0 || filteredResidents.length > 500}
              onChange={(event) => setSelectedIds(event.target.checked ? new Set(filteredResidents.map((resident) => resident.id)) : new Set())}
            />} />
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />}
            disabled={selectedIds.size === 0 || isDeletingResident}
            onClick={() => { setMutationError(null); setDeletingResidents(residents.filter((resident) => selectedIds.has(resident.id))) }}>
            {t('residents.retention.removeSelected', { count: selectedIds.size })}
          </Button>
        </Box>
      )}
      {!loading && !loadError && databaseBlocks.blocks.length === 0 && scopedResidents.length > 0 && (
        <Alert severity="info">{t('residents.retention.noDestinations')}</Alert>
      )}

      {loading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('residents.loading')}</Typography>
        </Paper>
      ) : loadError ? (
        <LoadErrorState helperText={t('residents.errors.loadFailed')} onRetry={() => { void loadResidents(); void databaseBlocks.refresh() }} />
      ) : scopedResidents.length === 0 ? (
        <EmptyState
          actionLabel={canManage && databaseBlocks.blocks.length > 0 ? t('emptyState.action', { information: t('emptyState.information.residents') }) : undefined}
          headline={t('emptyState.headline', { information: t('emptyState.information.residents') })}
          helperText={t('emptyState.helper.dedicated', { information: t('emptyState.information.residents') })}
          onAction={canManage && databaseBlocks.blocks.length > 0 ? openCreateDialog : undefined}
        />
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          actionLabel={t('common.clearFilters')}
          headline={t('residents.filters.emptyHeadline')}
          helperText={t('residents.filters.emptyHelper')}
          onAction={clearFilters}
        />
      ) : (
        <PagedResponsiveDataView endpoint="/residents/page" query={{ search: nameFilter, blockId: allowedBlockIds.has(selectedBlockFilter) ? selectedBlockFilter : undefined, unassignedResident: selectedBlockFilter === 'unassigned', staircaseSearch: staircaseFilter }}
          paginationId="ApiResidentsOverview-1"
          paginationResetKey={JSON.stringify([nameFilter, selectedBlockFilter, staircaseFilter])}
          ariaLabel={t('sidebar.residents')}
          columns={columns}
          desktopTableMinWidth={1400}
          getRowId={(resident) => resident.id}
          rows={filteredResidents}
          renderCardCornerActions={canManage ? renderSelection : undefined}
        />
      )}

      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!canSave}
        confirmLabel={t('common.save')}
        contentSx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}
        maxWidth="sm"
        onCancel={() => { if (!isSaving) setDialogMode(null) }}
        onConfirm={() => { void saveResident() }}
        open={Boolean(dialogMode)}
        title={dialogMode === 'edit' ? t('residents.actions.editResident') : t('residents.actions.addResident')}
      >
        {mutationError && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{mutationError}</Alert>}
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
        {editingResident && (
          <Paper variant="outlined" sx={{ gridColumn: '1 / -1', p: 1.5, display: 'grid', gap: 1 }}>
            <Typography variant="subtitle2">{t('residents.censorAssignment.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {censorAssignmentHelper}
            </Typography>
            <Button
              disabled={!canAssignCensor || isAssigningCensor}
              onClick={() => { void assignCensor() }}
              sx={{ justifySelf: 'start' }}
              variant="outlined"
            >
              {isAssigningCensor ? t('residents.censorAssignment.assigning') : t('residents.censorAssignment.assign')}
            </Button>
          </Paper>
        )}
      </AppDialog>

      <ConfirmationDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={deletingResidents.length === 0 || isDeletingResident}
        confirmLabel={isDeletingResident ? t('residents.dialog.deleting') : t('residents.dialog.deleteConfirmYes')}
        onCancel={() => { if (!isDeletingResident) setDeletingResidents([]) }}
        onConfirm={() => { void deleteResident() }}
        open={deletingResidents.length > 0}
        title={t('residents.dialog.deleteTitle')}
      >
        {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
        <Typography color="text.secondary">
          {deletingResidents.length === 1
            ? t('residents.dialog.deleteConfirm', { resident: deletingResidents[0].fullName })
            : t('residents.retention.bulkConfirm', { count: deletingResidents.length })}
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

export default ApiResidentsOverview
