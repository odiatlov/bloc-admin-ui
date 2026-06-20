import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../components/shared/AppDialog'
import EmptyState from '../../../components/shared/EmptyState'
import { EntityListItem } from '../../../components/shared/EntityPresentation'
import FilterBar from '../../../components/shared/FilterBar'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { filterBlocksForAccount } from '../../../application/accessScope'
import { RoleContext } from '../../../contexts/RoleContext'
import { translateApartmentSetupStatus, translateHeatingType, translateResidentAccountStatus } from '../../../domain/displayLabels'
import { formatSquareMeters, getApartmentResidents } from '../../../hooks/useApartmentData'
import {
  apartments,
  blocks,
  buildingAdminAssignments,
  residentApartments,
  residents,
  staircases,
  type Apartment,
  type ApartmentSetupStatus,
  type HeatingType,
  type ResidentApartment,
} from '../../../mocks/apartmentData'

type ApartmentManagementProps = {
  hideScopeFilters?: boolean
  initialBlockId?: string
}

const apartmentSetupStatuses: ApartmentSetupStatus[] = ['configured', 'unconfigured']
const heatingTypes: HeatingType[] = ['central', 'individual', 'gas_boiler', 'district']

const ApartmentManagement: React.FC<ApartmentManagementProps> = ({ hideScopeFilters = false, initialBlockId }) => {
  const { t } = useTranslation()
  const { account, role } = React.useContext(RoleContext)
  const scopedBlocks = React.useMemo(
    () => filterBlocksForAccount(blocks, { ...account, role }, buildingAdminAssignments, residentApartments, apartments),
    [account, role],
  )
  const initialScopedBlockId = scopedBlocks.find((block) => block.id === initialBlockId)?.id ?? scopedBlocks[0]?.id ?? ''
  const [selectedBlockId, setSelectedBlockId] = React.useState(initialScopedBlockId)
  const [selectedStaircaseId, setSelectedStaircaseId] = React.useState('all')
  const [setupStatusFilter, setSetupStatusFilter] = React.useState<ApartmentSetupStatus | 'all'>('all')
  const [selectedApartmentId, setSelectedApartmentId] = React.useState('')
  const [apartmentRecords, setApartmentRecords] = React.useState<Apartment[]>(apartments)
  const [residentApartmentRecords, setResidentApartmentRecords] = React.useState<ResidentApartment[]>(residentApartments)
  const [assignResidentId, setAssignResidentId] = React.useState('')
  const [editTab, setEditTab] = React.useState(0)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [apartmentForm, setApartmentForm] = React.useState({
    number: '',
    floor: '',
    familyName: '',
    setupStatus: 'unconfigured' as ApartmentSetupStatus,
    heatingType: 'central' as HeatingType,
    staircaseId: '',
    usableSurface: '',
    totalSurface: '',
    heatedSurface: '',
    indivisibleShare: '',
  })

  React.useEffect(() => {
    if (!scopedBlocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(scopedBlocks[0]?.id ?? '')
      setSelectedStaircaseId('all')
      setSelectedApartmentId('')
    }
  }, [scopedBlocks, selectedBlockId])

  const selectedBlock = scopedBlocks.find((block) => block.id === selectedBlockId) ?? scopedBlocks[0]
  const selectedBlockStaircases = staircases.filter((staircase) => staircase.blockId === selectedBlock?.id)
  const blockApartments = apartmentRecords.filter((apartment) => apartment.blockId === selectedBlock?.id)
  const locationApartments = blockApartments.filter((apartment) => selectedStaircaseId === 'all' || apartment.staircaseId === selectedStaircaseId)
  const selectedApartments = locationApartments.filter((apartment) => {
    const matchesSetupStatus = setupStatusFilter === 'all' || (apartment.setupStatus ?? 'configured') === setupStatusFilter

    return matchesSetupStatus
  })
  const selectedApartment = apartmentRecords.find((apartment) => apartment.id === selectedApartmentId) ?? null
  const selectedApartmentResidents = selectedApartment
    ? getApartmentResidents(selectedApartment.id, residents, residentApartmentRecords)
    : []
  const assignableResidents = selectedApartment
    ? residents.filter((resident) => !selectedApartmentResidents.some((apartmentResident) => apartmentResident.id === resident.id))
    : []
  const canAddApartment = apartmentForm.floor.trim() !== ''
    && Number.isFinite(Number(apartmentForm.floor))
    && (!selectedBlock?.hasStaircases || Boolean(apartmentForm.staircaseId))

  const updateApartment = (id: string, updates: Partial<Apartment>) => {
    setApartmentRecords((records) => records.map((apartment) => (apartment.id === id ? { ...apartment, ...updates } : apartment)))
  }

  const openAddApartmentDialog = () => {
    setApartmentForm({
      number: String(blockApartments.length + 1),
      floor: '',
      familyName: '',
      setupStatus: 'unconfigured',
      heatingType: selectedBlock?.heatingType ?? 'central',
      staircaseId: selectedBlock?.hasStaircases && selectedStaircaseId !== 'all' ? selectedStaircaseId : '',
      usableSurface: '',
      totalSurface: '',
      heatedSurface: '',
      indivisibleShare: '',
    })
    setIsAddDialogOpen(true)
  }

  const addApartment = () => {
    const floor = Number(apartmentForm.floor)
    const requiresStaircase = Boolean(selectedBlock?.hasStaircases)
    if (!Number.isFinite(floor) || (requiresStaircase && !apartmentForm.staircaseId)) return

    const nextApartment: Apartment = {
      id: `apt-draft-${Date.now()}`,
      blockId: selectedBlock?.id ?? scopedBlocks[0]?.id ?? '',
      staircaseId: requiresStaircase ? apartmentForm.staircaseId : undefined,
      floor,
      number: apartmentForm.number.trim() || String(blockApartments.length + 1),
      familyName: apartmentForm.familyName.trim(),
      setupStatus: apartmentForm.setupStatus,
      usableSurface: Number(apartmentForm.usableSurface) || 0,
      totalSurface: Number(apartmentForm.totalSurface) || 0,
      heatedSurface: Number(apartmentForm.heatedSurface) || 0,
      indivisibleShare: Number(apartmentForm.indivisibleShare) || 0,
      heatingType: apartmentForm.heatingType,
      boilerTaxEnabled: false,
      boilerTaxPercentage: 20,
    }

    setApartmentRecords((records) => [nextApartment, ...records])
    setSetupStatusFilter('all')
    setSelectedApartmentId(nextApartment.id)
    setEditTab(0)
    setIsAddDialogOpen(false)
  }

  const handleBlockChange = (event: SelectChangeEvent) => {
    setSelectedBlockId(event.target.value)
    setSelectedStaircaseId('all')
    setSelectedApartmentId('')
  }

  const handleStaircaseChange = (event: SelectChangeEvent) => {
    setSelectedStaircaseId(event.target.value)
    setSelectedApartmentId('')
  }

  const openEditDrawer = (apartmentId: string) => {
    setSelectedApartmentId(apartmentId)
    setEditTab(0)
  }

  const handleAssignResident = () => {
    if (!selectedApartment || !assignResidentId) return

    const alreadyAssigned = residentApartmentRecords.some((link) => (
      link.apartmentId === selectedApartment.id
      && link.residentId === assignResidentId
      && !link.ownershipEndDate
    ))
    if (alreadyAssigned) return

    setResidentApartmentRecords((links) => [{
      id: `RA-${assignResidentId}-${selectedApartment.id}-${Date.now()}`,
      residentId: assignResidentId,
      apartmentId: selectedApartment.id,
      ownershipType: 'tenant',
      ownershipStartDate: '2026-05-10',
      isPrimaryResidence: false,
    }, ...links])
    setAssignResidentId('')
  }

  const handleUnassignResident = (residentId: string) => {
    if (!selectedApartment) return

    setResidentApartmentRecords((links) => links.map((link) => (
      link.apartmentId === selectedApartment.id && link.residentId === residentId && !link.ownershipEndDate
        ? { ...link, ownershipEndDate: '2026-05-10', isPrimaryResidence: false }
        : link
    )))
  }

  const apartmentColumns: DataColumn<Apartment>[] = [
    { key: 'number', label: t('apartments.setup.number'), cardRole: 'primary', render: (apartment) => t('residents.apartment.number', { number: apartment.number }) },
    { key: 'familyName', label: t('apartments.setup.familyName'), cardRole: 'secondary', render: (apartment) => apartment.familyName || t('common.notAvailable') },
    { key: 'residents', label: t('residents.family.members'), render: (apartment) => getApartmentResidents(apartment.id, residents, residentApartmentRecords).length },
    { key: 'floor', label: t('blocks.columns.floor'), render: (apartment) => apartment.floor },
    { key: 'staircase', label: t('blocks.columns.staircase'), render: (apartment) => selectedBlockStaircases.find((staircase) => staircase.id === apartment.staircaseId)?.name ?? t('common.notAvailable') },
    { key: 'usableSurface', label: t('blocks.columns.usableSurface'), render: (apartment) => formatSquareMeters(apartment.usableSurface) },
    { key: 'setupStatus', label: t('apartments.setup.setupStatus'), cardRole: 'status', render: (apartment) => <StatusChip status={apartment.setupStatus ?? 'configured'} label={translateApartmentSetupStatus(t, apartment.setupStatus ?? 'configured')} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: (apartment) => (
        <Button size="small" startIcon={<EditIcon />} onClick={() => openEditDrawer(apartment.id)}>
          {t('apartments.actions.edit')}
        </Button>
      ),
    },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {!hideScopeFilters && (
        <FilterBar
          actions={(
            <Button startIcon={<AddIcon />} variant="contained" onClick={openAddApartmentDialog} sx={{ whiteSpace: 'nowrap' }}>
              {t('apartments.setup.addApartment')}
            </Button>
          )}
        >
          <FormControl size="small" sx={{ minWidth: { sm: 180 } }}>
            <InputLabel>{t('settings.fields.block')}</InputLabel>
            <Select label={t('settings.fields.block')} value={selectedBlockId} onChange={handleBlockChange}>
              {scopedBlocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>
                  {t('common.blockValue', { block: block.name })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" disabled={!selectedBlock?.hasStaircases} sx={{ minWidth: { sm: 180 } }}>
            <InputLabel>{t('blocks.columns.staircase')}</InputLabel>
            <Select label={t('blocks.columns.staircase')} value={selectedStaircaseId} onChange={handleStaircaseChange}>
              <MenuItem value="all">{t('common.all')}</MenuItem>
              {selectedBlockStaircases.map((staircase) => (
                <MenuItem key={staircase.id} value={staircase.id}>
                  {t('settings.fields.staircaseName', { staircase: staircase.name })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { sm: 180 } }}>
            <InputLabel>{t('apartments.filters.setupStatus')}</InputLabel>
            <Select
              label={t('apartments.filters.setupStatus')}
              value={setupStatusFilter}
              onChange={(event: SelectChangeEvent) => setSetupStatusFilter(event.target.value as ApartmentSetupStatus | 'all')}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              {apartmentSetupStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {translateApartmentSetupStatus(t, status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FilterBar>
      )}

      <ResponsiveDataView
        ariaLabel={t('sidebar.apartments')}
        columns={apartmentColumns}
        desktopTableMinWidth={1120}
        emptyState={(
          <EmptyState
            actionLabel={t('emptyState.action', { information: t('emptyState.information.apartments') })}
            actionTo="/admin/settings"
            headline={t('emptyState.headline', { information: t('emptyState.information.apartments') })}
            helperText={t('emptyState.helper.settings', { information: t('emptyState.information.apartments') })}
          />
        )}
        getRowId={(apartment) => apartment.id}
        rows={selectedApartments}
      />

      <Drawer
        anchor="right"
        open={Boolean(selectedApartment)}
        onClose={() => {
          setSelectedApartmentId('')
          setAssignResidentId('')
        }}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520 }, p: 2 } } }}
      >
        {selectedApartment && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setSelectedApartmentId('')
                  setAssignResidentId('')
                }}
              >
                {t('residents.actions.backToList')}
              </Button>
              <Box>
                <Typography variant="h6">{t('apartments.setup.title')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('residents.apartment.number', { number: selectedApartment.number })}
                </Typography>
              </Box>
            </Box>

            <Tabs value={editTab} onChange={(_, value: number) => setEditTab(value)} variant="fullWidth">
              <Tab label={t('apartments.tabs.details')} />
              <Tab label={t('apartments.tabs.residents', { count: selectedApartmentResidents.length })} />
            </Tabs>

            {editTab === 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('apartments.setup.number')}
                  value={selectedApartment.number}
                  onChange={(event) => updateApartment(selectedApartment.id, { number: event.target.value })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('blocks.columns.floor')}
                  type="number"
                  value={selectedApartment.floor}
                  onChange={(event) => updateApartment(selectedApartment.id, { floor: Number(event.target.value) })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('apartments.setup.familyName')}
                  value={selectedApartment.familyName}
                  onChange={(event) => updateApartment(selectedApartment.id, { familyName: event.target.value })}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>{t('apartments.setup.setupStatus')}</InputLabel>
                  <Select
                    label={t('apartments.setup.setupStatus')}
                    value={selectedApartment.setupStatus ?? 'configured'}
                    onChange={(event: SelectChangeEvent) => updateApartment(selectedApartment.id, { setupStatus: event.target.value as ApartmentSetupStatus })}
                  >
                    {apartmentSetupStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {translateApartmentSetupStatus(t, status)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('blocks.columns.heatingType')}</InputLabel>
                  <Select
                    label={t('blocks.columns.heatingType')}
                    value={selectedApartment.heatingType}
                    onChange={(event: SelectChangeEvent) => updateApartment(selectedApartment.id, { heatingType: event.target.value as HeatingType })}
                  >
                    {heatingTypes.map((heatingType) => (
                      <MenuItem key={heatingType} value={heatingType}>
                        {translateHeatingType(t, heatingType)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" disabled={!selectedBlock?.hasStaircases}>
                  <InputLabel>{t('blocks.columns.staircase')}</InputLabel>
                  <Select
                    label={t('blocks.columns.staircase')}
                    value={selectedApartment.staircaseId ?? ''}
                    onChange={(event: SelectChangeEvent) => updateApartment(selectedApartment.id, { staircaseId: event.target.value || undefined })}
                  >
                    <MenuItem value="">{t('common.notAvailable')}</MenuItem>
                    {selectedBlockStaircases.map((staircase) => (
                      <MenuItem key={staircase.id} value={staircase.id}>
                        {t('settings.fields.staircaseName', { staircase: staircase.name })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  size="small"
                  label={t('blocks.columns.usableSurface')}
                  type="number"
                  value={selectedApartment.usableSurface}
                  onChange={(event) => updateApartment(selectedApartment.id, { usableSurface: Number(event.target.value) })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('blocks.columns.totalSurface')}
                  type="number"
                  value={selectedApartment.totalSurface}
                  onChange={(event) => updateApartment(selectedApartment.id, { totalSurface: Number(event.target.value) })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('blocks.columns.heatedSurface')}
                  type="number"
                  value={selectedApartment.heatedSurface}
                  onChange={(event) => updateApartment(selectedApartment.id, { heatedSurface: Number(event.target.value) })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('apartments.setup.indivisibleShare')}
                  type="number"
                  value={selectedApartment.indivisibleShare}
                  onChange={(event) => updateApartment(selectedApartment.id, { indivisibleShare: Number(event.target.value) })}
                />
              </Box>
            )}

            {editTab === 1 && (
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {selectedApartmentResidents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('residents.apartment.noResidentsAssigned')}
                  </Typography>
                ) : selectedApartmentResidents.map((resident) => (
                  <EntityListItem
                    key={resident.id}
                    title={resident.name}
                    secondary={resident.email || t('residents.resident.noEmail')}
                    status={<StatusChip status={resident.accountStatus} label={translateResidentAccountStatus(t, resident.accountStatus)} />}
                    actions={(
                      <Button size="small" onClick={() => handleUnassignResident(resident.id)}>
                        {t('residents.actions.unassign')}
                      </Button>
                    )}
                  />
                ))}
                <Divider />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 220, flex: '1 1 220px' }}>
                    <InputLabel>{t('residents.actions.assignResident')}</InputLabel>
                    <Select label={t('residents.actions.assignResident')} value={assignResidentId} onChange={(event: SelectChangeEvent) => setAssignResidentId(event.target.value)}>
                      {assignableResidents.map((resident) => (
                        <MenuItem key={resident.id} value={resident.id}>
                          {resident.name} - {translateResidentAccountStatus(t, resident.accountStatus)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button startIcon={<PersonAddIcon />} variant="outlined" onClick={handleAssignResident} disabled={!assignResidentId}>
                    {t('residents.actions.assign')}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!canAddApartment}
        confirmLabel={t('apartments.setup.addApartment')}
        contentSx={{ display: 'grid', gap: 2 }}
        maxWidth="md"
        onCancel={() => setIsAddDialogOpen(false)}
        onConfirm={addApartment}
        open={isAddDialogOpen}
        title={t('apartments.setup.addApartment')}
      >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              label={t('apartments.setup.number')}
              value={apartmentForm.number}
              onChange={(event) => setApartmentForm((form) => ({ ...form, number: event.target.value }))}
            />
            <TextField
              fullWidth
              required
              size="small"
              label={t('blocks.columns.floor')}
              type="number"
              value={apartmentForm.floor}
              onChange={(event) => setApartmentForm((form) => ({ ...form, floor: event.target.value }))}
            />
            <FormControl fullWidth size="small" required disabled={!selectedBlock?.hasStaircases}>
              <InputLabel>{t('blocks.columns.staircase')}</InputLabel>
              <Select
                label={t('blocks.columns.staircase')}
                value={apartmentForm.staircaseId}
                onChange={(event: SelectChangeEvent) => setApartmentForm((form) => ({ ...form, staircaseId: event.target.value }))}
              >
                {selectedBlockStaircases.map((staircase) => (
                  <MenuItem key={staircase.id} value={staircase.id}>
                    {t('settings.fields.staircaseName', { staircase: staircase.name })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label={t('apartments.setup.familyName')}
              value={apartmentForm.familyName}
              onChange={(event) => setApartmentForm((form) => ({ ...form, familyName: event.target.value }))}
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t('apartments.setup.setupStatus')}</InputLabel>
              <Select
                label={t('apartments.setup.setupStatus')}
                value={apartmentForm.setupStatus}
                onChange={(event: SelectChangeEvent) => setApartmentForm((form) => ({ ...form, setupStatus: event.target.value as ApartmentSetupStatus }))}
              >
                {apartmentSetupStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {translateApartmentSetupStatus(t, status)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{t('blocks.columns.heatingType')}</InputLabel>
              <Select
                label={t('blocks.columns.heatingType')}
                value={apartmentForm.heatingType}
                onChange={(event: SelectChangeEvent) => setApartmentForm((form) => ({ ...form, heatingType: event.target.value as HeatingType }))}
              >
                {heatingTypes.map((heatingType) => (
                  <MenuItem key={heatingType} value={heatingType}>
                    {translateHeatingType(t, heatingType)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              label={t('blocks.columns.usableSurface')}
              type="number"
              value={apartmentForm.usableSurface}
              onChange={(event) => setApartmentForm((form) => ({ ...form, usableSurface: event.target.value }))}
            />
            <TextField
              fullWidth
              size="small"
              label={t('blocks.columns.totalSurface')}
              type="number"
              value={apartmentForm.totalSurface}
              onChange={(event) => setApartmentForm((form) => ({ ...form, totalSurface: event.target.value }))}
            />
            <TextField
              fullWidth
              size="small"
              label={t('blocks.columns.heatedSurface')}
              type="number"
              value={apartmentForm.heatedSurface}
              onChange={(event) => setApartmentForm((form) => ({ ...form, heatedSurface: event.target.value }))}
            />
            <TextField
              fullWidth
              size="small"
              label={t('apartments.setup.indivisibleShare')}
              type="number"
              value={apartmentForm.indivisibleShare}
              onChange={(event) => setApartmentForm((form) => ({ ...form, indivisibleShare: event.target.value }))}
            />
          </Box>
      </AppDialog>
    </Box>
  )
}

export default ApartmentManagement
