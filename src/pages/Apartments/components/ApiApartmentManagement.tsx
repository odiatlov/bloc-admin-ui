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
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../components/shared/AppDialog'
import EmptyState from '../../../components/shared/EmptyState'
import FilterBar from '../../../components/shared/FilterBar'
import LoadErrorState from '../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { translateApartmentSetupStatus } from '../../../domain/displayLabels'
import { useBlocks } from '../../../hooks/useBlocks'
import { formatNumber } from '../../../hooks/useApartmentData'
import { apartmentsApi } from '../../../services/apartmentsApi'
import { staircasesApi } from '../../../services/staircasesApi'
import type { ApartmentSetupStatus } from '../../../types/apartment'
import type { ApartmentResponse, StaircaseResponse } from '../../../types/management'

type ApiApartmentManagementProps = {
  initialBlockId?: string
}

type FormState = {
  blockId: string
  staircaseId: string
  number: string
  familyName: string
  residentCount: string
  floor: string
  usableSqm: string
  setupStatus: ApartmentSetupStatus
}

const emptyForm: FormState = {
  blockId: '',
  staircaseId: '',
  number: '',
  familyName: '',
  residentCount: '0',
  floor: '',
  usableSqm: '',
  setupStatus: 'unconfigured',
}

const setupStatuses: ApartmentSetupStatus[] = ['configured', 'unconfigured']

const ApiApartmentManagement: React.FC<ApiApartmentManagementProps> = ({ initialBlockId }) => {
  const { t } = useTranslation()
  const databaseBlocks = useBlocks()
  const [apartments, setApartments] = React.useState<ApartmentResponse[]>([])
  const [staircases, setStaircases] = React.useState<StaircaseResponse[]>([])
  const [selectedBlockId, setSelectedBlockId] = React.useState(initialBlockId ?? 'all')
  const [selectedStaircaseId, setSelectedStaircaseId] = React.useState('all')
  const [setupStatusFilter, setSetupStatusFilter] = React.useState<ApartmentSetupStatus | 'all'>('all')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingApartment, setEditingApartment] = React.useState<ApartmentResponse | null>(null)
  const [form, setForm] = React.useState<FormState>(emptyForm)

  const blocks = databaseBlocks.blocks
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId)
  const formBlock = blocks.find((block) => block.id === form.blockId)
  const formBlockStaircases = staircases.filter((staircase) => staircase.blockId === form.blockId)
  const selectedBlockStaircases = staircases.filter((staircase) => staircase.blockId === selectedBlockId)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextApartments, nextStaircases] = await Promise.all([
        apartmentsApi.getAll(),
        staircasesApi.getAll(),
      ])
      setApartments(nextApartments)
      setStaircases(nextStaircases)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load apartments')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  React.useEffect(() => {
    if (selectedBlockId !== 'all' && !blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(blocks[0]?.id ?? 'all')
      setSelectedStaircaseId('all')
    }
  }, [blocks, selectedBlockId])

  React.useEffect(() => {
    if (!selectedBlock?.hasStaircases) {
      setSelectedStaircaseId('all')
    }
  }, [selectedBlock])

  const filteredApartments = React.useMemo(() => (
    apartments.filter((apartment) => {
      const matchesBlock = selectedBlockId === 'all' || apartment.blockId === selectedBlockId
      const matchesStaircase = selectedStaircaseId === 'all' || apartment.staircaseId === selectedStaircaseId
      const matchesStatus = setupStatusFilter === 'all' || apartment.setupStatus === setupStatusFilter
      return matchesBlock && matchesStaircase && matchesStatus
    })
  ), [apartments, selectedBlockId, selectedStaircaseId, setupStatusFilter])

  const openCreateDialog = () => {
    const blockId = selectedBlockId !== 'all' ? selectedBlockId : blocks[0]?.id ?? ''
    const block = blocks.find((item) => item.id === blockId)
    setEditingApartment(null)
    setForm({
      ...emptyForm,
      blockId,
      staircaseId: block?.hasStaircases && selectedStaircaseId !== 'all' ? selectedStaircaseId : '',
      number: String(apartments.filter((apartment) => apartment.blockId === blockId).length + 1),
    })
    setDialogMode('create')
  }

  const openEditDialog = (apartment: ApartmentResponse) => {
    setEditingApartment(apartment)
    setForm({
      blockId: apartment.blockId,
      staircaseId: apartment.staircaseId ?? '',
      number: apartment.number,
      familyName: apartment.familyName ?? '',
      residentCount: String(apartment.residentCount),
      floor: apartment.floor === null ? '' : String(apartment.floor),
      usableSqm: apartment.usableSqm === null ? '' : String(apartment.usableSqm),
      setupStatus: apartment.setupStatus,
    })
    setDialogMode('edit')
  }

  const saveApartment = async () => {
    const block = blocks.find((item) => item.id === form.blockId)
    if (!block || !form.number.trim()) return
    if (block.hasStaircases && !form.staircaseId) return

    const request = {
      blockId: form.blockId,
      staircaseId: block.hasStaircases ? form.staircaseId : null,
      number: form.number.trim(),
      familyName: form.familyName.trim() || null,
      residentCount: Math.max(0, Number(form.residentCount) || 0),
      floor: form.floor.trim() ? Number(form.floor) : null,
      usableSqm: form.usableSqm.trim() ? Number(form.usableSqm) : null,
      setupStatus: form.setupStatus,
    }

    if (dialogMode === 'edit' && editingApartment) {
      await apartmentsApi.update(editingApartment.id, request)
    } else {
      await apartmentsApi.create(request)
    }

    setDialogMode(null)
    await loadData()
    void databaseBlocks.refresh()
  }

  const columns: DataColumn<ApartmentResponse>[] = [
    { key: 'number', label: t('apartments.setup.number'), cardRole: 'primary', render: (apartment) => t('residents.apartment.number', { number: apartment.number }) },
    { key: 'familyName', label: t('apartments.setup.familyName'), cardRole: 'secondary', render: (apartment) => apartment.familyName || t('common.notAvailable') },
    { key: 'residents', label: t('residents.family.members'), render: (apartment) => apartment.residentCount },
    { key: 'floor', label: t('blocks.columns.floor'), render: (apartment) => apartment.floor ?? t('common.notAvailable') },
    { key: 'staircase', label: t('blocks.columns.staircase'), render: (apartment) => apartment.staircaseName ? t('settings.fields.staircaseName', { staircase: apartment.staircaseName }) : t('common.notAvailable') },
    { key: 'usableSurface', label: t('blocks.columns.usableSurface'), render: (apartment) => apartment.usableSqm === null ? t('common.notAvailable') : formatNumber(apartment.usableSqm) },
    { key: 'setupStatus', label: t('apartments.setup.setupStatus'), cardRole: 'status', render: (apartment) => <StatusChip status={apartment.setupStatus} label={translateApartmentSetupStatus(t, apartment.setupStatus)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: (apartment) => (
        <Button size="small" startIcon={<EditIcon />} onClick={() => openEditDialog(apartment)}>
          {t('apartments.actions.edit')}
        </Button>
      ),
    },
  ]

  const loadError = error || databaseBlocks.error
  const loading = isLoading || databaseBlocks.isLoading
  const canSave = Boolean(form.blockId && form.number.trim() && (!formBlock?.hasStaircases || form.staircaseId))

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <FilterBar
        actions={(
          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreateDialog} disabled={Boolean(loadError) || blocks.length === 0}>
            {t('apartments.setup.addApartment')}
          </Button>
        )}
      >
        <FormControl size="small" sx={{ minWidth: { sm: 180 } }} disabled={Boolean(loadError)}>
          <InputLabel>{t('settings.fields.block')}</InputLabel>
          <Select label={t('settings.fields.block')} value={selectedBlockId} onChange={(event: SelectChangeEvent) => { setSelectedBlockId(event.target.value); setSelectedStaircaseId('all') }}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {blocks.map((block) => (
              <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" disabled={Boolean(loadError) || !selectedBlock?.hasStaircases} sx={{ minWidth: { sm: 180 } }}>
          <InputLabel>{t('blocks.columns.staircase')}</InputLabel>
          <Select label={t('blocks.columns.staircase')} value={selectedStaircaseId} onChange={(event: SelectChangeEvent) => setSelectedStaircaseId(event.target.value)}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {selectedBlockStaircases.map((staircase) => (
              <MenuItem key={staircase.id} value={staircase.id}>{t('settings.fields.staircaseName', { staircase: staircase.name })}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { sm: 180 } }} disabled={Boolean(loadError)}>
          <InputLabel>{t('apartments.filters.setupStatus')}</InputLabel>
          <Select label={t('apartments.filters.setupStatus')} value={setupStatusFilter} onChange={(event: SelectChangeEvent) => setSetupStatusFilter(event.target.value as ApartmentSetupStatus | 'all')}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {setupStatuses.map((status) => (
              <MenuItem key={status} value={status}>{translateApartmentSetupStatus(t, status)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {loading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('apartments.loading')}</Typography>
        </Paper>
      ) : loadError ? (
        <LoadErrorState helperText={t('apartments.errors.loadFailed')} onRetry={() => { void loadData(); void databaseBlocks.refresh() }} />
      ) : filteredApartments.length === 0 ? (
        <EmptyState
          actionLabel={t('emptyState.action', { information: t('emptyState.information.apartments') })}
          headline={t('emptyState.headline', { information: t('emptyState.information.apartments') })}
          helperText={t('emptyState.helper.dedicated', { information: t('emptyState.information.apartments') })}
          onAction={openCreateDialog}
        />
      ) : (
        <ResponsiveDataView
          ariaLabel={t('sidebar.apartments')}
          columns={columns}
          desktopTableMinWidth={1120}
          getRowId={(apartment) => apartment.id}
          rows={filteredApartments}
        />
      )}

      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!canSave}
        confirmLabel={t('common.save')}
        contentSx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}
        maxWidth="md"
        onCancel={() => setDialogMode(null)}
        onConfirm={() => { void saveApartment() }}
        open={Boolean(dialogMode)}
        title={dialogMode === 'edit' ? t('apartments.dialog.editTitle') : t('apartments.setup.addApartment')}
      >
        <FormControl fullWidth size="small" required>
          <InputLabel>{t('settings.fields.block')}</InputLabel>
          <Select label={t('settings.fields.block')} value={form.blockId} onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, blockId: event.target.value, staircaseId: '' }))}>
            {blocks.map((block) => (
              <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" required={Boolean(formBlock?.hasStaircases)} disabled={!formBlock?.hasStaircases}>
          <InputLabel>{t('blocks.columns.staircase')}</InputLabel>
          <Select label={t('blocks.columns.staircase')} value={form.staircaseId} onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, staircaseId: event.target.value }))}>
            <MenuItem value="">{t('common.notAvailable')}</MenuItem>
            {formBlockStaircases.map((staircase) => (
              <MenuItem key={staircase.id} value={staircase.id}>{t('settings.fields.staircaseName', { staircase: staircase.name })}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField fullWidth required size="small" label={t('apartments.setup.number')} value={form.number} onChange={(event) => setForm((value) => ({ ...value, number: event.target.value }))} />
        <TextField fullWidth size="small" label={t('apartments.setup.familyName')} value={form.familyName} onChange={(event) => setForm((value) => ({ ...value, familyName: event.target.value }))} />
        <TextField fullWidth size="small" type="number" label={t('residents.family.members')} value={form.residentCount} onChange={(event) => setForm((value) => ({ ...value, residentCount: event.target.value }))} />
        <TextField fullWidth size="small" type="number" label={t('blocks.columns.floor')} value={form.floor} onChange={(event) => setForm((value) => ({ ...value, floor: event.target.value }))} />
        <TextField fullWidth size="small" type="number" label={t('blocks.columns.usableSurface')} value={form.usableSqm} onChange={(event) => setForm((value) => ({ ...value, usableSqm: event.target.value }))} />
        <FormControl fullWidth size="small" required>
          <InputLabel>{t('apartments.setup.setupStatus')}</InputLabel>
          <Select label={t('apartments.setup.setupStatus')} value={form.setupStatus} onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, setupStatus: event.target.value as ApartmentSetupStatus }))}>
            {setupStatuses.map((status) => (
              <MenuItem key={status} value={status}>{translateApartmentSetupStatus(t, status)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </AppDialog>
    </Box>
  )
}

export default ApiApartmentManagement
