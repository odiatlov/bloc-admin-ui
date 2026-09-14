import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import SaveIcon from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import ConfirmationDialog from '../../../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../../../components/shared/EmptyState'
import { EntityListItem } from '../../../../../components/shared/EntityPresentation'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../../components/shared/StatusChip'
import { translateApartmentSetupStatus, translateResidentStatus } from '../../../../../domain/displayLabels'
import { useBlocks } from '../../../../../hooks/useBlocks'
import { formatSquareMeters } from '../../../../../hooks/useApartmentData'
import { apartmentResidentsApi } from '../../../../../services/apartmentResidentsApi'
import { apartmentsApi } from '../../../../../services/apartmentsApi'
import { residentsApi } from '../../../../../services/residentsApi'
import { staircasesApi } from '../../../../../services/staircasesApi'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'
import type { ApartmentSetupStatus } from '../../../../../types/apartment'
import type { ApartmentResidentResponse, ApartmentResponse, ResidentResponse, StaircaseResponse } from '../../../../../types/management'
import type { ApartmentWaterConfigurationZone } from '../../../../../types/waterReadings'

type ApiApartmentManagementProps = {
  hideScopeFilters?: boolean
  initialBlockId?: string
}

type FormState = {
  blockId: string
  staircaseId: string
  number: string
  residentCount: string
  floor: string
  usableSqm: string
  setupStatus: ApartmentSetupStatus
  hasBoiler: boolean
}

type WaterZoneForm = ApartmentWaterConfigurationZone & {
  id: string
}

const emptyForm: FormState = {
  blockId: '',
  staircaseId: '',
  number: '',
  residentCount: '0',
  floor: '',
  usableSqm: '',
  setupStatus: 'unconfigured',
  hasBoiler: false,
}

const setupStatuses: ApartmentSetupStatus[] = ['configured', 'unconfigured']
const waterLocationTypes = ['Kitchen', 'Bathroom', 'SecondaryBathroom', 'ServiceToilet', 'Other']
const tableEmptyValue = '-'

const ApiApartmentManagement: React.FC<ApiApartmentManagementProps> = ({ hideScopeFilters = false, initialBlockId }) => {
  const { t } = useTranslation()
  const databaseBlocks = useBlocks()
  const [apartments, setApartments] = React.useState<ApartmentResponse[]>([])
  const [residentRecords, setResidentRecords] = React.useState<ResidentResponse[]>([])
  const [apartmentResidentLinks, setApartmentResidentLinks] = React.useState<ApartmentResidentResponse[]>([])
  const [staircases, setStaircases] = React.useState<StaircaseResponse[]>([])
  const [selectedBlockId, setSelectedBlockId] = React.useState(initialBlockId ?? 'all')
  const [selectedStaircaseId, setSelectedStaircaseId] = React.useState('all')
  const [setupStatusFilter, setSetupStatusFilter] = React.useState<ApartmentSetupStatus | 'all'>('all')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingApartment, setEditingApartment] = React.useState<ApartmentResponse | null>(null)
  const [editTab, setEditTab] = React.useState(0)
  const [deletingApartment, setDeletingApartment] = React.useState<ApartmentResponse | null>(null)
  const [isDeletingApartment, setIsDeletingApartment] = React.useState(false)
  const [isLoadingApartmentResidents, setIsLoadingApartmentResidents] = React.useState(false)
  const [assignResidentId, setAssignResidentId] = React.useState('')
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [waterZones, setWaterZones] = React.useState<WaterZoneForm[]>([])
  const [isLoadingWaterConfig, setIsLoadingWaterConfig] = React.useState(false)
  const [waterConfigError, setWaterConfigError] = React.useState<string | null>(null)

  const blocks = databaseBlocks.blocks
  const allowedBlockIds = React.useMemo(() => new Set(blocks.map((block) => block.id)), [blocks])
  const scopedApartments = React.useMemo(
    () => apartments.filter((apartment) => allowedBlockIds.has(apartment.blockId)),
    [allowedBlockIds, apartments],
  )
  const scopedStaircases = React.useMemo(
    () => staircases.filter((staircase) => allowedBlockIds.has(staircase.blockId)),
    [allowedBlockIds, staircases],
  )
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId)
  const formBlock = blocks.find((block) => block.id === form.blockId)
  const formBlockStaircases = scopedStaircases.filter((staircase) => staircase.blockId === form.blockId)
  const selectedBlockStaircases = scopedStaircases.filter((staircase) => staircase.blockId === selectedBlockId)
  const selectedBlockHasStaircases = Boolean(selectedBlock?.hasStaircases || selectedBlockStaircases.length > 0)
  const formBlockHasStaircases = Boolean(formBlock?.hasStaircases || formBlockStaircases.length > 0)
  const hasAssignedResident = apartmentResidentLinks.length > 0
  const assignableResidents = React.useMemo(() => (
    hasAssignedResident ? [] : residentRecords
  ), [hasAssignedResident, residentRecords])

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextApartments, nextStaircases, nextResidents] = await Promise.all([
        apartmentsApi.getAll(),
        staircasesApi.getAll(),
        residentsApi.getAll(),
      ])
      setApartments(nextApartments)
      setStaircases(nextStaircases)
      setResidentRecords(nextResidents)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load apartments')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  const loadApartmentResidents = React.useCallback(async (apartmentId: string) => {
    setIsLoadingApartmentResidents(true)
    setError(null)

    try {
      setApartmentResidentLinks(await apartmentResidentsApi.getByApartment(apartmentId))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load apartment residents')
    } finally {
      setIsLoadingApartmentResidents(false)
    }
  }, [])

  const loadWaterConfiguration = React.useCallback(async (apartmentId: string) => {
    setIsLoadingWaterConfig(true)
    setWaterConfigError(null)

    try {
      const configuration = await waterReadingsApi.getApartmentConfiguration(apartmentId)
      setForm((value) => ({ ...value, hasBoiler: configuration.hasBoiler }))
      setWaterZones(configuration.zones.map((zone, index) => ({
        id: `${zone.locationType}-${zone.name}-${index}`,
        locationType: zone.locationType,
        name: zone.name,
        coldWaterCount: 1,
        hotWaterCount: configuration.hasBoiler ? 0 : 1,
      })))
    } catch (nextError) {
      setWaterZones([])
      setWaterConfigError(nextError instanceof Error ? nextError.message : 'Unable to load water index configuration')
    } finally {
      setIsLoadingWaterConfig(false)
    }
  }, [])

  React.useEffect(() => {
    if (databaseBlocks.isLoading) return

    if (selectedBlockId !== 'all' && !blocks.some((block) => block.id === selectedBlockId)) {
      const timeoutId = window.setTimeout(() => {
        setSelectedBlockId(blocks[0]?.id ?? 'all')
        setSelectedStaircaseId('all')
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [blocks, databaseBlocks.isLoading, selectedBlockId])

  React.useEffect(() => {
    if (!selectedBlockHasStaircases) {
      const timeoutId = window.setTimeout(() => {
        setSelectedStaircaseId('all')
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [selectedBlockHasStaircases])

  const filteredApartments = React.useMemo(() => (
    scopedApartments.filter((apartment) => {
      const matchesBlock = selectedBlockId === 'all' || apartment.blockId === selectedBlockId
      const matchesStaircase = selectedStaircaseId === 'all' || apartment.staircaseId === selectedStaircaseId
      const matchesStatus = setupStatusFilter === 'all' || apartment.setupStatus === setupStatusFilter
      return matchesBlock && matchesStaircase && matchesStatus
    })
  ), [scopedApartments, selectedBlockId, selectedStaircaseId, setupStatusFilter])

  const openCreateDialog = () => {
    const blockId = selectedBlockId !== 'all' ? selectedBlockId : blocks[0]?.id ?? ''
    const block = blocks.find((item) => item.id === blockId)
    setEditingApartment(null)
    setForm({
      ...emptyForm,
      blockId,
      staircaseId: (block?.hasStaircases || scopedStaircases.some((staircase) => staircase.blockId === blockId)) && selectedStaircaseId !== 'all' ? selectedStaircaseId : '',
      number: String(scopedApartments.filter((apartment) => apartment.blockId === blockId).length + 1),
    })
    setDialogMode('create')
  }

  const openEditDialog = (apartment: ApartmentResponse) => {
    setEditingApartment(apartment)
    setApartmentResidentLinks([])
    setAssignResidentId('')
    setForm({
      blockId: apartment.blockId,
      staircaseId: apartment.staircaseId ?? '',
      number: apartment.number,
      residentCount: String(apartment.residentCount),
      floor: apartment.floor === null ? '' : String(apartment.floor),
      usableSqm: apartment.usableSqm === null ? '' : String(apartment.usableSqm),
      setupStatus: apartment.setupStatus,
      hasBoiler: apartment.hasBoiler,
    })
    setWaterZones([])
    setWaterConfigError(null)
    setEditTab(0)
    void loadApartmentResidents(apartment.id)
    void loadWaterConfiguration(apartment.id)
  }

  const saveApartment = async () => {
    const block = blocks.find((item) => item.id === form.blockId)
    if (!block || !form.number.trim()) return
    if (formBlockHasStaircases && !form.staircaseId) return

    const request = {
      blockId: form.blockId,
      staircaseId: formBlockHasStaircases ? form.staircaseId : null,
      number: form.number.trim(),
      residentCount: Math.max(0, Number(form.residentCount) || 0),
      floor: form.floor.trim() ? Number(form.floor) : null,
      usableSqm: form.usableSqm.trim() ? Number(form.usableSqm) : null,
      setupStatus: form.setupStatus,
      hasBoiler: form.hasBoiler,
    }

    if (editingApartment) {
      await apartmentsApi.update(editingApartment.id, request)
      await waterReadingsApi.updateApartmentConfiguration(editingApartment.id, {
        hasBoiler: form.hasBoiler,
        zones: waterZones.map((zone) => ({
          locationType: zone.locationType,
          name: zone.name.trim() || zone.locationType,
          coldWaterCount: 1,
          hotWaterCount: form.hasBoiler ? 0 : 1,
        })),
      })
    } else {
      await apartmentsApi.create(request)
    }

    setDialogMode(null)
    setEditingApartment(null)
    await loadData()
    void databaseBlocks.refresh()
  }

  const deleteApartment = async () => {
    if (!deletingApartment || isDeletingApartment) return

    setIsDeletingApartment(true)
    setError(null)

    try {
      await apartmentsApi.delete(deletingApartment.id)
      setDeletingApartment(null)
      await loadData()
      void databaseBlocks.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete apartment')
    } finally {
      setIsDeletingApartment(false)
    }
  }

  const closeEditDrawer = () => {
    setEditingApartment(null)
    setApartmentResidentLinks([])
    setAssignResidentId('')
    setWaterZones([])
    setWaterConfigError(null)
  }

  const assignResident = async () => {
    if (!editingApartment || !assignResidentId) return

    setError(null)

    try {
      await apartmentResidentsApi.create(editingApartment.id, {
        residentId: assignResidentId,
        livesHere: true,
      })
      setAssignResidentId('')
      setForm((value) => ({ ...value, residentCount: String(Math.max(Number(value.residentCount) || 0, 1)) }))
      await loadApartmentResidents(editingApartment.id)
      await loadData()
      void databaseBlocks.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to assign resident')
    }
  }

  const removeResidentLink = async (link: ApartmentResidentResponse) => {
    if (!editingApartment) return

    setError(null)

    try {
      await apartmentResidentsApi.delete(editingApartment.id, link.id)
      setForm((value) => ({ ...value, residentCount: '0' }))
      await loadApartmentResidents(editingApartment.id)
      await loadData()
      void databaseBlocks.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to remove resident')
    }
  }

  const columns: DataColumn<ApartmentResponse>[] = [
    { key: 'number', label: t('apartments.setup.number'), cardRole: 'primary', render: (apartment) => t('residents.apartment.number', { number: apartment.number }) },
    { key: 'residentNames', label: t('apartments.setup.assignedResident'), cardRole: 'secondary', render: (apartment) => apartment.residentNames || t('apartments.setup.noOwner') },
    { key: 'residents', label: t('apartments.setup.householdMembers'), render: (apartment) => apartment.residentCount },
    { key: 'floor', label: t('blocks.columns.floor'), render: (apartment) => apartment.floor ?? tableEmptyValue },
    { key: 'staircase', label: t('blocks.columns.staircase'), render: (apartment) => apartment.staircaseName || tableEmptyValue },
    { key: 'usableSurface', label: t('blocks.columns.usableSurface'), render: (apartment) => apartment.usableSqm === null ? tableEmptyValue : formatSquareMeters(apartment.usableSqm) },
    { key: 'setupStatus', label: t('apartments.setup.setupStatus'), cardRole: 'status', render: (apartment) => <StatusChip status={apartment.setupStatus} label={translateApartmentSetupStatus(t, apartment.setupStatus)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: (apartment) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button size="small" startIcon={<EditIcon />} onClick={() => openEditDialog(apartment)}>
            {t('apartments.actions.edit')}
          </Button>
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setDeletingApartment(apartment)}
            disabled={isDeletingApartment}
          >
            {t('apartments.actions.delete')}
          </Button>
        </Box>
      ),
    },
  ]

  const loadError = error || databaseBlocks.error
  const loading = isLoading || databaseBlocks.isLoading
  const residentCountValue = Math.max(0, Number(form.residentCount) || 0)
  const hasValidResidentCount = editingApartment
    ? (hasAssignedResident ? residentCountValue >= 1 : residentCountValue === 0)
    : residentCountValue === 0
  const canSave = Boolean(
    form.blockId
    && form.number.trim()
    && (!formBlockHasStaircases || form.staircaseId)
    && hasValidResidentCount
    && (!editingApartment || (!isLoadingWaterConfig && !waterConfigError))
  )
  const updateWaterZone = (id: string, patch: Partial<WaterZoneForm>) => {
    setWaterZones((zones) => zones.map((zone) => zone.id === id ? { ...zone, ...patch } : zone))
  }

  const addWaterZone = () => {
    setWaterZones((zones) => [
      ...zones,
      {
        id: crypto.randomUUID(),
        locationType: 'Kitchen',
        name: t('consumption.waterLocation.kitchen'),
        coldWaterCount: 1,
        hotWaterCount: form.hasBoiler ? 0 : 1,
      },
    ])
  }

  const removeWaterZone = (id: string) => {
    setWaterZones((zones) => zones.filter((zone) => zone.id !== id))
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {!hideScopeFilters && (
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
          <FormControl size="small" disabled={Boolean(loadError) || !selectedBlockHasStaircases} sx={{ minWidth: { sm: 180 } }}>
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
      )}

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
        open={dialogMode === 'create'}
        title={t('apartments.setup.addApartment')}
      >
        <FormControl fullWidth size="small" required>
          <InputLabel>{t('settings.fields.block')}</InputLabel>
          <Select label={t('settings.fields.block')} value={form.blockId} onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, blockId: event.target.value, staircaseId: '' }))}>
            {blocks.map((block) => (
              <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" required={formBlockHasStaircases} disabled={!formBlockHasStaircases}>
          <InputLabel>{t('blocks.columns.staircase')}</InputLabel>
          <Select label={t('blocks.columns.staircase')} value={form.staircaseId} onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, staircaseId: event.target.value }))}>
            <MenuItem value="">{t('common.notAvailable')}</MenuItem>
            {formBlockStaircases.map((staircase) => (
              <MenuItem key={staircase.id} value={staircase.id}>{t('settings.fields.staircaseName', { staircase: staircase.name })}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField fullWidth required size="small" label={t('apartments.setup.number')} value={form.number} onChange={(event) => setForm((value) => ({ ...value, number: event.target.value }))} />
        <TextField fullWidth size="small" type="number" label={t('apartments.setup.householdMembers')} value={form.residentCount} disabled helperText={t('apartments.setup.assignOwnerBeforeCount')} />
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

      <Drawer
        anchor="right"
        open={Boolean(editingApartment)}
        onClose={closeEditDrawer}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520 }, p: 2 } } }}
      >
        {editingApartment && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ alignItems: 'flex-start', display: 'flex', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={closeEditDrawer}>
                  {t('residents.actions.backToList')}
                </Button>
                <Box>
                  <Typography variant="h6">{t('apartments.setup.title')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('residents.apartment.number', { number: editingApartment.number })}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', alignContent: 'start', gap: 2 }}>
              <Tabs value={editTab} onChange={(_, value: number) => setEditTab(value)} variant="fullWidth">
                <Tab label={t('apartments.tabs.details')} />
                <Tab label={t('apartments.tabs.assignedResident', { count: apartmentResidentLinks.length })} />
              </Tabs>

              {editTab === 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                  <TextField fullWidth required size="small" label={t('apartments.setup.number')} value={form.number} onChange={(event) => setForm((value) => ({ ...value, number: event.target.value }))} />
                  <TextField fullWidth size="small" type="number" label={t('blocks.columns.floor')} value={form.floor} onChange={(event) => setForm((value) => ({ ...value, floor: event.target.value }))} />
                  <FormControl fullWidth size="small" required>
                    <InputLabel>{t('apartments.setup.setupStatus')}</InputLabel>
                    <Select label={t('apartments.setup.setupStatus')} value={form.setupStatus} onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, setupStatus: event.target.value as ApartmentSetupStatus }))}>
                      {setupStatuses.map((status) => (
                        <MenuItem key={status} value={status}>{translateApartmentSetupStatus(t, status)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" required={formBlockHasStaircases} disabled={!formBlockHasStaircases}>
                    <InputLabel>{t('blocks.columns.staircase')}</InputLabel>
                    <Select label={t('blocks.columns.staircase')} value={form.staircaseId} onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, staircaseId: event.target.value }))}>
                      <MenuItem value="">{t('common.notAvailable')}</MenuItem>
                      {formBlockStaircases.map((staircase) => (
                        <MenuItem key={staircase.id} value={staircase.id}>{t('settings.fields.staircaseName', { staircase: staircase.name })}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    helperText={hasAssignedResident ? t('apartments.setup.householdMembersHelp') : t('apartments.setup.assignOwnerBeforeCount')}
                    slotProps={{ htmlInput: { min: hasAssignedResident ? 1 : 0 } }}
                    size="small"
                    type="number"
                    label={t('apartments.setup.householdMembers')}
                    value={form.residentCount}
                    onChange={(event) => setForm((value) => ({ ...value, residentCount: event.target.value }))}
                  />
                  <TextField fullWidth size="small" type="number" label={t('blocks.columns.usableSurface')} value={form.usableSqm} onChange={(event) => setForm((value) => ({ ...value, usableSqm: event.target.value }))} />
                  <Box sx={{ display: 'grid', gap: 1.5, gridColumn: '1 / -1', pt: 1 }}>
                    <Divider />
                    <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">{t('apartments.waterIndex.title')}</Typography>
                      <Button size="small" startIcon={<AddIcon />} onClick={addWaterZone}>
                        {t('apartments.waterIndex.addZone')}
                      </Button>
                    </Box>
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={form.hasBoiler}
                          onChange={(event) => {
                            const hasBoiler = event.target.checked
                            setForm((value) => ({ ...value, hasBoiler }))
                            if (hasBoiler) {
                              setWaterZones((zones) => zones.map((zone) => ({ ...zone, hotWaterCount: 0 })))
                            }
                          }}
                        />
                      )}
                      label={t('apartments.waterIndex.hasBoiler')}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('apartments.waterIndex.helper')}
                      </Typography>
                    </Box>
                    {isLoadingWaterConfig ? (
                      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">{t('apartments.waterIndex.loading')}</Typography>
                      </Box>
                    ) : waterConfigError ? (
                      <Alert severity="warning">{waterConfigError}</Alert>
                    ) : waterZones.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t('apartments.waterIndex.empty')}
                      </Typography>
                    ) : waterZones.map((zone) => (
                      <Box
                        key={zone.id}
                        sx={{
                          alignItems: 'center',
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' },
                        }}
                      >
                        <FormControl fullWidth size="small">
                          <InputLabel>{t('apartments.waterIndex.locationType')}</InputLabel>
                          <Select
                            label={t('apartments.waterIndex.locationType')}
                            value={zone.locationType}
                            onChange={(event: SelectChangeEvent) => {
                              const locationType = event.target.value
                              updateWaterZone(zone.id, {
                                locationType,
                                name: zone.name.trim() ? zone.name : locationType,
                              })
                            }}
                          >
                            {waterLocationTypes.map((locationType) => (
                              <MenuItem key={locationType} value={locationType}>
                                {t(`apartments.waterIndex.locations.${locationType}`)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          label={t('apartments.waterIndex.zoneName')}
                          onChange={(event) => updateWaterZone(zone.id, { name: event.target.value })}
                          size="small"
                          value={zone.name}
                        />
                        <IconButton aria-label={t('apartments.waterIndex.removeZone')} onClick={() => removeWaterZone(zone.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gridColumn: '1 / -1', justifyContent: { xs: 'stretch', sm: 'flex-end' }, pt: 0.5 }}>
                    <Button
                      fullWidth
                      startIcon={<SaveIcon />}
                      variant="contained"
                      onClick={() => { void saveApartment() }}
                      disabled={!canSave}
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                      {t('common.save')}
                    </Button>
                  </Box>
                </Box>
              )}

              {editTab === 1 && (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {isLoadingApartmentResidents ? (
                    <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">{t('residents.loading')}</Typography>
                    </Box>
                  ) : apartmentResidentLinks.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('apartments.setup.noAssignedResident')}
                    </Typography>
                  ) : apartmentResidentLinks.map((link) => (
                    <EntityListItem
                      key={link.id}
                      title={link.residentFullName}
                      secondary={link.residentEmail || link.residentPhone || t('residents.resident.noEmail')}
                      status={<StatusChip status={link.residentStatus} label={translateResidentStatus(t, link.residentStatus)} />}
                      actions={(
                        <Button size="small" startIcon={<PersonRemoveIcon />} onClick={() => { void removeResidentLink(link) }}>
                          {t('residents.actions.unassign')}
                        </Button>
                      )}
                    />
                  ))}
                  <Divider />
                  <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <FormControl size="small" sx={{ flex: '1 1 220px', minWidth: 220 }} disabled={hasAssignedResident}>
                      <InputLabel>{t('apartments.actions.assignResident')}</InputLabel>
                      <Select
                        label={t('apartments.actions.assignResident')}
                        value={assignResidentId}
                        onChange={(event: SelectChangeEvent) => setAssignResidentId(event.target.value)}
                      >
                        {assignableResidents.map((resident) => (
                          <MenuItem key={resident.id} value={resident.id}>
                            {resident.fullName} - {translateResidentStatus(t, resident.status)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      startIcon={<PersonAddIcon />}
                      variant="outlined"
                      onClick={() => { void assignResident() }}
                      disabled={!assignResidentId || hasAssignedResident}
                    >
                      {t('residents.actions.assign')}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

          </Box>
        )}
      </Drawer>

      <ConfirmationDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!deletingApartment || isDeletingApartment}
        confirmLabel={isDeletingApartment ? t('apartments.dialog.deleting') : t('apartments.dialog.deleteConfirmYes')}
        onCancel={() => setDeletingApartment(null)}
        onConfirm={() => { void deleteApartment() }}
        open={Boolean(deletingApartment)}
        title={t('apartments.dialog.deleteTitle')}
      >
        <Typography color="text.secondary">
          {t('apartments.dialog.deleteConfirm', {
            apartment: deletingApartment?.number ?? '',
          })}
        </Typography>
      </ConfirmationDialog>
    </Box>
  )
}

export default ApiApartmentManagement
