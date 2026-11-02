import React from 'react'
import { usePageFilter } from '../../../../../hooks/usePageFilter'
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
import { translatePersonStatus } from '../../../../../domain/displayLabels'
import { useBlocks } from '../../../../../hooks/useBlocks'
import { personsApi } from '../../../../../services/personsApi'
import { personErrorMessage } from '../../../../../services/personErrors'
import type { PersonResponse, PersonStatus } from '../../../../../types/management'
import { RoleContext } from '../../../../../contexts/RoleContext'
import AssociationBadge from '../../../../../components/shared/AssociationBadge'
import ResidentApartmentAssignments from '../../../../../components/shared/ResidentApartmentAssignments'

type FormState = {
  firstName: string
  lastName: string
  invitePerson: boolean
  email: string
  phone: string
  status: PersonStatus
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  invitePerson: false,
  email: '',
  phone: '',
  status: 'active',
}

const personStatuses: PersonStatus[] = ['active', 'inactive']
const tableEmptyValue = '-'

const normalizeFilterValue = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const getRoleLabel = (t: ReturnType<typeof useTranslation>['t'], role: string) => (
  t(`persons.roles.${role}`, { defaultValue: role })
)

const getDisplayRoles = (person: PersonResponse) => Array.from(new Set([
  ...person.roles,
  ...(person.apartments.length > 0 ? ['Resident'] : []),
])).filter(role => role === 'Admin' || role === 'Censor' || role === 'Resident')

const ApiPersonsOverview: React.FC = () => {
  const { t } = useTranslation()
  const { role, refreshAccounts } = React.useContext(RoleContext)
  const canManage = role === 'Admin'
  const databaseBlocks = useBlocks({ filterSearch: false })
  const [persons, setPersons] = React.useState<PersonResponse[]>([])
  const [nameFilter, setNameFilter] = usePageFilter('persons.name', '')
  const [selectedBlockId, setSelectedBlockId] = usePageFilter('persons.block', 'all')
  const [staircaseFilter, setStaircaseFilter] = usePageFilter('persons.staircase', '')
  const [error, setError] = React.useState<string | null>(null)
  const [mutationError, setMutationError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingPerson, setEditingPerson] = React.useState<PersonResponse | null>(null)
  const [removingPersons, setRemovingPersons] = React.useState<PersonResponse[]>([])
  const [isDeletingAll, setIsDeletingAll] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRemovingPerson, setIsRemovingPerson] = React.useState(false)
  const [notification, setNotification] = React.useState('')
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [clearAssignments, setClearAssignments] = React.useState(false)
  const [confirmClearAssignments, setConfirmClearAssignments] = React.useState(false)
  const [censorBlockIds, setCensorBlockIds] = React.useState<string[]>([])
  const allowedBlockIds = React.useMemo(
    () => new Set(databaseBlocks.blocks.map((block) => block.id)),
    [databaseBlocks.blocks],
  )
  // The API owns resident visibility, including retained persons without a block.
  const scopedResidents = persons

  const loadPersons = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextResidents = await personsApi.getAll()
      setPersons(nextResidents)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load persons')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPersons()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadPersons])

  const selectedBlockFilter = selectedBlockId === 'all' || selectedBlockId === 'unassigned' || databaseBlocks.blocks.some((block) => block.id === selectedBlockId)
    ? selectedBlockId
    : 'all'

  React.useEffect(() => {
    if (databaseBlocks.isLoading || databaseBlocks.error || selectedBlockId === selectedBlockFilter) return
    const timer = window.setTimeout(() => {
      setSelectedBlockId('all')
      setStaircaseFilter('')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [databaseBlocks.isLoading, databaseBlocks.error, selectedBlockFilter, selectedBlockId, setSelectedBlockId, setStaircaseFilter])

  const filteredResidents = React.useMemo(() => {
    const normalizedNameFilter = normalizeFilterValue(nameFilter)
    const normalizedStaircaseFilter = normalizeFilterValue(staircaseFilter)

    return scopedResidents.filter((resident) => {
      const visibleApartments = resident.apartments.filter((apartment) => allowedBlockIds.has(apartment.blockId))
      const visibleBlocks = resident.blocks.filter((block) => allowedBlockIds.has(block.blockId))
      const visibleRoles = (resident.blockRoles ?? []).filter(item => allowedBlockIds.has(item.blockId))
      const matchesName = !normalizedNameFilter || normalizeFilterValue(resident.fullName).includes(normalizedNameFilter)
      const matchesBlock = selectedBlockFilter === 'all'
        || (selectedBlockFilter === 'unassigned'
          ? visibleBlocks.length === 0 && visibleApartments.length === 0 && visibleRoles.length === 0
          : visibleBlocks.some((block) => block.blockId === selectedBlockFilter) || visibleApartments.some((apartment) => apartment.blockId === selectedBlockFilter) || visibleRoles.some(item => item.blockId === selectedBlockFilter))
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
    setCensorBlockIds([])
    setClearAssignments(false)
    setConfirmClearAssignments(false)
    setMutationError(null)
    setEditingPerson(null)
    setForm(emptyForm)
    setDialogMode('create')
  }

  const openEditDialog = (resident: PersonResponse) => {
    setClearAssignments(false)
    setConfirmClearAssignments(false)
    setCensorBlockIds((resident.blockRoles ?? []).filter(item => item.role === 'Censor' && allowedBlockIds.has(item.blockId)).map(item => item.blockId))
    setMutationError(null)
    setEditingPerson(resident)
    setForm({
      firstName: resident.firstName,
      lastName: resident.lastName,
      invitePerson: resident.hasRegisteredAccount,
      email: resident.email ?? '',
      phone: resident.phone ?? '',
      status: resident.status,
    })
    setDialogMode('edit')
  }

  const savePerson = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || isSaving || !canManage) return

    const request = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      clearBlockAssignments: Boolean(editingPerson && clearAssignments),
      expectedApartmentIds: clearAssignments ? editingPerson?.apartments.filter(apartment => allowedBlockIds.has(apartment.blockId)).map(apartment => apartment.apartmentId) : undefined,
      expectedBlockIds: clearAssignments ? editingPerson?.blocks.filter(block => allowedBlockIds.has(block.blockId)).map(block => block.blockId) : undefined,
      censorBlockIds: editingPerson ? censorBlockIds : undefined,
      expectedCensorBlockIds: editingPerson ? (editingPerson.blockRoles ?? []).filter(item => item.role === 'Censor' && allowedBlockIds.has(item.blockId)).map(item => item.blockId) : undefined,
      invitePerson: form.invitePerson,
      email: form.invitePerson ? form.email.trim() || null : null,
      phone: form.phone.trim() || null,
      userId: null,
      status: form.status,
    }

    setMutationError(null)
    setIsSaving(true)

    try {
      if (editingPerson) {
        await personsApi.update(editingPerson.id, request)
      } else {
        const createdResident = await personsApi.create(request)
        if (createdResident.wasExistingIdentity) {
          setNotification(t('persons.notifications.existingLinked'))
        }
      }

      setDialogMode(null)
      setEditingPerson(null)
      if (!editingPerson) clearFilters()
      await loadPersons()
      await databaseBlocks.refresh()
      await refreshAccounts()
    } catch (nextError) {
      setMutationError(personErrorMessage(nextError, t, 'persons.retention.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const removePerson = async () => {
    if (removingPersons.length === 0 || isRemovingPerson || !canManage) return

    setIsRemovingPerson(true)
    setMutationError(null)

    try {
      if (isDeletingAll) await personsApi.removeUnassigned(removingPersons.map((resident) => resident.id))
      else if (removingPersons.length === 1) await personsApi.delete(removingPersons[0].id)
      else await personsApi.removeMany(removingPersons.map((resident) => resident.id))
      setRemovingPersons([])
      setIsDeletingAll(false)
      await loadPersons()
      await databaseBlocks.refresh()
    } catch (nextError) {
      setMutationError(personErrorMessage(nextError, t, 'persons.retention.removeFailed'))
    } finally {
      setIsRemovingPerson(false)
    }
  }

  const columns: DataColumn<PersonResponse>[] = [
    { key: 'name', label: t('persons.fields.name'), cardRole: 'primary', render: (resident) => resident.fullName },
    { key: 'email', label: t('persons.fields.email'), render: (resident) => resident.email || tableEmptyValue },
    { key: 'phone', label: t('persons.fields.phone'), render: (resident) => resident.phone || tableEmptyValue },
    {
      key: 'roles',
      label: t('persons.fields.roles'),
      render: (resident) => getDisplayRoles(resident).map((role) => getRoleLabel(t, role)).join(', ') || t('persons.roles.none'),
    },
    {
      key: 'assignments',
      label: t('persons.assignments.title'),
      render: resident => <ResidentApartmentAssignments apartments={resident.apartments.filter(apartment => allowedBlockIds.has(apartment.blockId))} />,
    },
    {
      key: 'censorAssignments',
      label: t('persons.censorAssignment.title'),
      render: person => {
        const assignments = (person.blockRoles ?? []).filter(item => item.role === 'Censor')
        if (assignments.length === 0) return tableEmptyValue

        return (
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            {assignments.map(item => (
              <AssociationBadge
                key={item.blockId}
                label={item.blockName ?? databaseBlocks.blocks.find(block => block.id === item.blockId)?.displayName ?? tableEmptyValue}
              />
            ))}
          </Box>
        )
      },
    },
    {
      key: 'status',
      label: t('persons.fields.status'),
      cardRole: 'status',
      render: (resident) => <StatusChip status={resident.status} label={translatePersonStatus(t, resident.status)} />,
    },
    {
      key: 'registeredAccount',
      label: t('persons.fields.registeredAccount'),
      cardRole: 'status',
      render: (resident) => (
        <StatusChip
          status={resident.hasRegisteredAccount ? 'active' : 'unregistered'}
          label={resident.hasRegisteredAccount ? t('persons.account.registered') : t('persons.account.unregistered')}
        />
      ),
    },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      actions: (resident) => [
        { id: 'edit', label: t('persons.actions.editPerson'), icon: <EditIcon />, onClick: () => openEditDialog(resident), disabled: !canManage || isRemovingPerson, priority: 2 },
        { id: 'delete', label: t('persons.actions.removePerson'), icon: <DeleteIcon />, onClick: () => { setMutationError(null); setIsDeletingAll(false); setRemovingPersons([resident]) }, disabled: !canManage || isRemovingPerson, color: 'error', priority: 1 },
      ],
    },
  ]

  const hasValidInviteEmail = !form.invitePerson || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const canSave = Boolean(canManage && !isSaving && form.firstName.trim() && form.lastName.trim() && hasValidInviteEmail && (censorBlockIds.length === 0 || form.invitePerson))
  const loadError = error || databaseBlocks.error
  const loading = isLoading || databaseBlocks.isLoading

  const unassignedPersons = persons.filter((resident) => resident.blocks.length === 0 && resident.apartments.length === 0 && (resident.blockRoles?.length ?? 0) === 0)

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
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
                onChange={(event: SelectChangeEvent) => { setSelectedBlockId(event.target.value); setStaircaseFilter('') }}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="unassigned">{t('persons.retention.noBlock')}</MenuItem>
                {databaseBlocks.blocks.map((block) => (
                  <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <SearchField
              disabled={Boolean(loadError)}
              label={t('persons.filters.staircase')}
              size="small"
              value={staircaseFilter}
              onClear={() => setStaircaseFilter('')}
              onChange={(event) => setStaircaseFilter(event.target.value)}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />
          </>
        )}
      >
        {canManage && selectedBlockFilter === 'unassigned' && (
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />}
            disabled={loading || Boolean(loadError) || isRemovingPerson || unassignedPersons.length === 0}
            onClick={() => { setMutationError(null); setIsDeletingAll(true); setRemovingPersons(unassignedPersons) }}>
            {t('persons.retention.deleteAll')}
          </Button>
        )}
        <Button startIcon={<PersonAddIcon />} variant="contained" onClick={openCreateDialog} disabled={!canManage || isLoading || Boolean(error)}>
          {t('persons.actions.addPerson')}
        </Button>
      </ActionBar>

      {!loading && !loadError && databaseBlocks.blocks.length === 0 && scopedResidents.length > 0 && (
        <Alert severity="info">{t('persons.retention.noDestinations')}</Alert>
      )}

      {loading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('persons.loading')}</Typography>
        </Paper>
      ) : loadError ? (
        <LoadErrorState helperText={t('persons.errors.loadFailed')} onRetry={() => { void loadPersons(); void databaseBlocks.refresh() }} />
      ) : scopedResidents.length === 0 ? (
        <EmptyState
          actionLabel={canManage ? t('emptyState.action', { information: t('emptyState.information.persons') }) : undefined}
          headline={t('emptyState.headline', { information: t('emptyState.information.persons') })}
          helperText={t('emptyState.helper.dedicated', { information: t('emptyState.information.persons') })}
          onAction={canManage ? openCreateDialog : undefined}
        />
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          actionLabel={t('common.clearFilters')}
          headline={t('persons.filters.emptyHeadline')}
          helperText={t('persons.filters.emptyHelper')}
          onAction={clearFilters}
        />
      ) : (
        <PagedResponsiveDataView endpoint="/persons/page" query={{ search: nameFilter, blockId: allowedBlockIds.has(selectedBlockFilter) ? selectedBlockFilter : undefined, unassignedPerson: selectedBlockFilter === 'unassigned', staircaseSearch: staircaseFilter }}
          paginationId="ApiPersonsOverview-1"
          paginationResetKey={JSON.stringify([nameFilter, selectedBlockFilter, staircaseFilter])}
          ariaLabel={t('sidebar.persons')}
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
        pending={isSaving}
        contentSx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}
        maxWidth="sm"
        onCancel={() => { if (!isSaving) setDialogMode(null) }}
        onConfirm={() => { void savePerson() }}
        open={Boolean(dialogMode)}
        title={dialogMode === 'edit' ? t('persons.actions.editPerson') : t('persons.actions.addPerson')}
      >
        {mutationError && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{mutationError}</Alert>}
        {dialogMode === 'create' && <Alert severity="info" sx={{ gridColumn: '1 / -1' }}>{t('persons.assignments.createWithoutHousing')}</Alert>}
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
        {editingPerson && <Paper variant="outlined" sx={{ gridColumn: '1 / -1', p: 1.5, display: 'grid', gap: 1 }}>
          <Typography variant="subtitle2">{t('persons.assignments.title')}</Typography>
          <ResidentApartmentAssignments apartments={clearAssignments ? [] : editingPerson.apartments.filter(apartment => allowedBlockIds.has(apartment.blockId))} />
          {clearAssignments ? <Alert severity="info">{t('persons.assignments.staged')}</Alert> :
            (editingPerson.blocks.length > 0 || editingPerson.apartments.length > 0) && <Button
              color="error" variant="outlined" sx={{ justifySelf: 'start' }} disabled={isSaving}
              onClick={() => setConfirmClearAssignments(true)}>{t('persons.assignments.clear')}</Button>}
        </Paper>}
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
        {editingPerson && (
          <Paper variant="outlined" sx={{ gridColumn: '1 / -1', p: 1.5, display: 'grid', gap: 1 }}>
            <Typography variant="subtitle2">{t('persons.censorAssignment.title')}</Typography>
            <FormControl fullWidth size="small" disabled={isSaving || Boolean(databaseBlocks.error)}>
              <InputLabel id="person-censor-blocks-label">{t('persons.censorAssignment.blocks')}</InputLabel>
              <Select<string[]>
                multiple
                labelId="person-censor-blocks-label"
                label={t('persons.censorAssignment.blocks')}
                value={censorBlockIds}
                onChange={event => setCensorBlockIds(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
                renderValue={selected => selected.map(id => databaseBlocks.blocks.find(block => block.id === id)?.displayName ?? '—').join(', ')}
              >
                {databaseBlocks.blocks.map(block => <MenuItem key={block.id} value={block.id}>
                  <Checkbox checked={censorBlockIds.includes(block.id)} />{block.displayName}
                </MenuItem>)}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">{t('persons.censorAssignment.helper')}</Typography>
            {censorBlockIds.length > 0 && !editingPerson.hasRegisteredAccount && <Alert severity="info">
              {t('persons.censorAssignment.requiresAccount')}
            </Alert>}
            <Typography variant="body2" color="text.secondary">{t('persons.censorAssignment.saveHint')}</Typography>
          </Paper>
        )}
        {form.invitePerson && (
          <TextField
            fullWidth
            required
            size="small"
            sx={{ gridColumn: '1 / -1' }}
            label={t('persons.fields.email')}
            type="email"
            disabled={Boolean(editingPerson?.hasRegisteredAccount)}
            value={form.email}
            error={Boolean(form.email.trim()) && !hasValidInviteEmail}
            helperText={editingPerson?.hasRegisteredAccount ? t('persons.assignments.registeredEmailLocked') : Boolean(form.email.trim()) && !hasValidInviteEmail ? t('persons.errors.invalidEmail') : undefined}
            onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
          />
        )}
        <FormControlLabel
          sx={{ gridColumn: '1 / -1', m: 0 }}
          control={(
            <Checkbox
              checked={form.invitePerson}
              disabled={Boolean(editingPerson?.hasRegisteredAccount)}
              onChange={(event) => setForm((value) => ({ ...value, invitePerson: event.target.checked, email: event.target.checked ? value.email : '' }))}
            />
          )}
          label={t('persons.fields.invitePerson')}
        />
      </AppDialog>

      <ConfirmationDialog open={confirmClearAssignments} title={t('persons.assignments.clear')}
        confirmColor="error"
        cancelLabel={t('common.cancel')} confirmLabel={t('persons.assignments.clear')}
        onCancel={() => setConfirmClearAssignments(false)}
        onConfirm={() => { setClearAssignments(true); setConfirmClearAssignments(false) }}>
        <Typography sx={{ mb: 2 }}>{t('persons.assignments.clearConfirm', { name: editingPerson?.fullName })}</Typography>
        <ResidentApartmentAssignments apartments={editingPerson?.apartments.filter(apartment => allowedBlockIds.has(apartment.blockId)) ?? []} />
        <Typography sx={{ mt: 2 }}>{t('persons.assignments.blocks')}: {editingPerson?.blocks.filter(block => allowedBlockIds.has(block.blockId)).map(block => block.blockName).join(', ') || '—'}</Typography>
      </ConfirmationDialog>

      <ConfirmationDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={removingPersons.length === 0 || isRemovingPerson}
        confirmLabel={isRemovingPerson ? t('persons.dialog.deleting') : t('persons.dialog.deleteConfirmYes')}
        onCancel={() => { if (!isRemovingPerson) { setRemovingPersons([]); setIsDeletingAll(false) } }}
        onConfirm={() => { void removePerson() }}
        open={removingPersons.length > 0}
        title={isDeletingAll ? t('persons.retention.deleteAll') : t('persons.dialog.deleteTitle')}
      >
        {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
        <Typography color="text.secondary">
          {isDeletingAll
            ? t('persons.retention.deleteAllConfirm', { count: removingPersons.length })
            : removingPersons.length === 1
            ? t('persons.dialog.deleteConfirm', { resident: removingPersons[0].fullName })
            : t('persons.retention.bulkConfirm', { count: removingPersons.length })}
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

export default ApiPersonsOverview
