import React from 'react'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../components/shared/AppDatePicker'
import ConfirmationDialog from '../../../components/shared/ConfirmationDialog'
import { filterBlocksForAccount } from '../../../application/accessScope'
import { RoleContext } from '../../../contexts/RoleContext'
import { useBlocks } from '../../../hooks/useBlocks'
import { blocksApi } from '../../../services/blocksApi'
import type { CreateBlockRequest } from '../../../types/block'
import {
  apartments,
  blocks,
  buildingAdminAssignments,
  customCostConfigurations,
  residentApartments,
  staircases,
  utilityMonthlyInputs,
  type AllocationType,
  type CostScopeLevel,
  type CustomCostConfiguration,
  type UtilityCategory,
} from '../../../mocks/apartmentData'
import AddBlockDialog from './AddBlockDialog'

type SettingsSectionsProps = {
  mode: 'admin' | 'resident'
}

const utilityCategories: UtilityCategory[] = ['gas', 'electricity', 'garbage', 'water', 'heating']
const allocationTypes: AllocationType[] = ['per_person', 'per_apartment', 'by_surface', 'by_heating_area', 'individual_meter', 'equal_split', 'custom']

const SettingsSections: React.FC<SettingsSectionsProps> = ({ mode }) => {
  const { t } = useTranslation()
  const { account, role } = React.useContext(RoleContext)
  const shouldUseDatabaseBlocks = account.id === 'acct-demo'
  const databaseOverview = useBlocks({ enabled: shouldUseDatabaseBlocks })
  const scopedBlocks = React.useMemo(
    () => filterBlocksForAccount(blocks, { ...account, role }, buildingAdminAssignments, residentApartments, apartments),
    [account, role],
  )
  const settingsBlocks = React.useMemo(() => (
    shouldUseDatabaseBlocks
      ? databaseOverview.blocks.map((block) => ({
          ...block,
          address: block.address ?? undefined,
          heatingType: 'central' as const,
        }))
      : scopedBlocks
  ), [databaseOverview.blocks, scopedBlocks, shouldUseDatabaseBlocks])
  const [selectedBlockId, setSelectedBlockId] = React.useState(settingsBlocks[0]?.id ?? '')
  const [selectedStaircaseId, setSelectedStaircaseId] = React.useState('all')
  const [blockDeadline, setBlockDeadline] = React.useState('2026-05-15')
  const [staircaseDeadlines, setStaircaseDeadlines] = React.useState<Record<string, string>>({})
  const [customCosts, setCustomCosts] = React.useState<CustomCostConfiguration[]>(customCostConfigurations)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeletingBlock, setIsDeletingBlock] = React.useState(false)
  const [notification, setNotification] = React.useState<{
    message: string
    severity: 'success' | 'error'
  } | null>(null)
  React.useEffect(() => {
    if (!settingsBlocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(settingsBlocks[0]?.id ?? '')
      setSelectedStaircaseId('all')
    }
  }, [settingsBlocks, selectedBlockId])

  const selectedBlock = settingsBlocks.find((block) => block.id === selectedBlockId) ?? settingsBlocks[0]
  const selectedDatabaseBlock = shouldUseDatabaseBlocks
    ? databaseOverview.blocks.find((block) => block.id === selectedBlockId) ?? null
    : null
  const selectedBlockStaircases = staircases.filter((staircase) => staircase.blockId === selectedBlock?.id)
  const selectedCustomCosts = customCosts.filter((cost) => cost.blockId === selectedBlock?.id)

  const handleStaircaseChange = (event: SelectChangeEvent) => {
    setSelectedStaircaseId(event.target.value)
  }

  const updateCustomCost = (id: string, updates: Partial<CustomCostConfiguration>) => {
    setCustomCosts((costs) => costs.map((cost) => (cost.id === id ? { ...cost, ...updates } : cost)))
  }

  const addCustomCost = () => {
    const fallbackStaircase = selectedBlockStaircases[0]
    const nextCost: CustomCostConfiguration = {
      id: `CC-DRAFT-${customCosts.length + 1}`,
      blockId: selectedBlock?.id ?? blocks[0]?.id ?? '',
      labelKey: 'settings.customCosts.types.customMonthlyFee',
      amount: 0,
      allocationType: 'per_apartment',
      scopeLevel: 'block',
      isActive: true,
      isRecurringMonthly: true,
      effectiveFrom: blockDeadline,
      notesKey: 'settings.customCosts.notes.manual',
      ...(fallbackStaircase ? { staircaseId: fallbackStaircase.id } : {}),
    }

    setCustomCosts((costs) => [nextCost, ...costs])
  }

  const saveBlock = async (request: CreateBlockRequest) => {
    if (!shouldUseDatabaseBlocks) return

    try {
      if (dialogMode === 'edit' && selectedDatabaseBlock) {
        await blocksApi.updateBlock(selectedDatabaseBlock.id, request)
      } else {
        await blocksApi.createBlock(request)
      }

      await databaseOverview.refresh()
      setDialogMode(null)
      setNotification({
        message: t(dialogMode === 'edit'
          ? 'settings.blockDialog.updateSuccess'
          : 'settings.blockDialog.createSuccess'),
        severity: 'success',
      })
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : t('settings.blockDialog.serverError'),
        severity: 'error',
      })
    }
  }

  const deleteBlock = async () => {
    if (!selectedDatabaseBlock || isDeletingBlock) return

    setIsDeletingBlock(true)

    try {
      await blocksApi.deleteBlock(selectedDatabaseBlock.id)
      await databaseOverview.refresh()
      setDeleteDialogOpen(false)
      setNotification({
        message: t('settings.blockDialog.deleteSuccess'),
        severity: 'success',
      })
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : t('settings.blockDialog.deleteError'),
        severity: 'error',
      })
    } finally {
      setIsDeletingBlock(false)
    }
  }

  if (mode === 'resident') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(280px, 1fr)' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
          <Typography variant="h6">{t('settings.resident.profile')}</Typography>
          <TextField label={t('settings.fields.name')} defaultValue="Ana Popescu" />
          <TextField label={t('settings.fields.email')} defaultValue="ana.popescu@example.com" />
          <FormControl size="small">
            <InputLabel>{t('settings.fields.language')}</InputLabel>
            <Select label={t('settings.fields.language')} defaultValue="en">
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="ro">RO</MenuItem>
            </Select>
          </FormControl>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">{t('settings.sections.notifications')}</Typography>
          <FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.emailNotifications')} />
          <FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.paymentReminders')} />
          <FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.maintenanceNotifications')} />
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="h6">{t('settings.admin.blockManagement')}</Typography>
        <Box
          sx={{
            alignItems: 'center',
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto' },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 280px))' },
              justifyContent: 'start',
            }}
          >
            <Autocomplete
              autoHighlight
              getOptionKey={(block) => block.id}
              getOptionLabel={(block) => t('common.blockValue', { block: block.name })}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              options={settingsBlocks}
              value={selectedBlock ?? null}
              onChange={(_, block) => {
                setSelectedBlockId(block?.id ?? '')
                setSelectedStaircaseId('all')
              }}
              renderInput={(params) => (
                <TextField {...params} label={t('settings.fields.block')} size="small" />
              )}
            />
            <FormControl size="small" disabled={!selectedBlock?.hasStaircases}>
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
          </Box>
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              justifyContent: { lg: 'end' },
              width: { xs: '100%', lg: 'auto' },
            }}
          >
            <Button
              startIcon={<EditIcon />}
              variant="contained"
              disabled={isDeletingBlock || (shouldUseDatabaseBlocks && !selectedDatabaseBlock)}
              onClick={() => {
                if (shouldUseDatabaseBlocks && selectedDatabaseBlock) setDialogMode('edit')
              }}
              sx={{ justifyContent: 'center', width: { xs: '100%', lg: 'auto' } }}
            >
              {t('settings.actions.editBlock')}
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              disabled={isDeletingBlock}
              onClick={() => {
                if (shouldUseDatabaseBlocks) setDialogMode('create')
              }}
              sx={{ justifyContent: 'center', width: { xs: '100%', lg: 'auto' } }}
            >
              {t('settings.actions.addBlock')}
            </Button>
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              variant="outlined"
              disabled={!shouldUseDatabaseBlocks || !selectedDatabaseBlock || isDeletingBlock}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ justifyContent: 'center', width: { xs: '100%', lg: 'auto' } }}
            >
              {isDeletingBlock ? t('settings.blockDialog.deleting') : t('settings.actions.deleteBlock')}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="h6">{t('settings.admin.financialSetup')}</Typography>
        <FormControl size="small" sx={{ maxWidth: 240 }}>
          <InputLabel>{t('settings.fields.currency')}</InputLabel>
          <Select label={t('settings.fields.currency')} defaultValue="EUR">
            <MenuItem value="EUR">EUR</MenuItem>
            <MenuItem value="RON">RON</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </Select>
        </FormControl>

        <Divider />

        <Typography variant="subtitle1">{t('settings.sections.deadlines')}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: selectedBlock?.hasStaircases ? 'repeat(2, minmax(0, 1fr))' : '1fr' }, gap: 2 }}>
          <AppDatePicker label={t('settings.fields.blockDeadline')} value={blockDeadline} onChange={setBlockDeadline} />
          {selectedBlock?.hasStaircases && (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {selectedBlockStaircases.map((staircase, index) => (
                <AppDatePicker
                  key={staircase.id}
                  label={t('settings.fields.staircaseDeadline', { staircase: staircase.name })}
                  value={staircaseDeadlines[staircase.id] ?? `2026-05-${String(15 + index).padStart(2, '0')}`}
                  onChange={(value) => setStaircaseDeadlines((deadlines) => ({ ...deadlines, [staircase.id]: value }))}
                />
              ))}
            </Box>
          )}
        </Box>

        <Divider />

        <Typography variant="subtitle1">{t('settings.sections.costs')}</Typography>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5 }}>
            {utilityCategories.map((category) => {
              const value = utilityMonthlyInputs.find((input) => input.blockId === selectedBlock?.id && input.month === '2026-05' && input.category === category)?.amount ?? 0
              return (
                <TextField
                  key={category}
                  label={t(`settings.costs.${category}`)}
                  type="number"
                  defaultValue={value}
                />
              )
            })}
          </Box>

          {selectedBlock?.hasStaircases && (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography variant="subtitle2">{t('settings.sections.staircaseCosts')}</Typography>
              {selectedBlockStaircases.map((staircase) => (
                <Paper key={staircase.id} variant="outlined" sx={{ p: 1.5, display: 'grid', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {t('settings.fields.staircaseName', { staircase: staircase.name })}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5 }}>
                    {utilityCategories.map((category) => (
                      <TextField
                        key={`${staircase.id}-${category}`}
                        label={t(`settings.costs.${category}`)}
                        type="number"
                        defaultValue={0}
                      />
                    ))}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6">{t('settings.customCosts.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.customCosts.description')}
            </Typography>
          </Box>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={addCustomCost}>
            {t('settings.customCosts.add')}
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {selectedCustomCosts.map((cost) => (
            <Paper key={cost.id} variant="outlined" sx={{ p: 1.5, display: 'grid', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2">{t(cost.labelKey)}</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={<Switch checked={cost.isActive} onChange={(event) => updateCustomCost(cost.id, { isActive: event.target.checked })} />}
                    label={t('settings.customCosts.active')}
                  />
                  <FormControlLabel
                    control={<Switch checked={cost.isRecurringMonthly} onChange={(event) => updateCustomCost(cost.id, { isRecurringMonthly: event.target.checked })} />}
                    label={t('settings.customCosts.recurring')}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
                <FormControl size="small">
                  <InputLabel>{t('settings.customCosts.type')}</InputLabel>
                  <Select label={t('settings.customCosts.type')} value={cost.labelKey} onChange={(event: SelectChangeEvent) => updateCustomCost(cost.id, { labelKey: event.target.value })}>
                    {[
                      'staircaseCleaning',
                      'gardening',
                      'repairs',
                      'pestControl',
                      'intercomMaintenance',
                      'elevatorMaintenance',
                      'administrationCost',
                      'customMonthlyFee',
                    ].map((type) => (
                      <MenuItem key={type} value={`settings.customCosts.types.${type}`}>
                        {t(`settings.customCosts.types.${type}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  label={t('finance.columns.amount')}
                  type="number"
                  value={cost.amount}
                  onChange={(event) => updateCustomCost(cost.id, { amount: Number(event.target.value) })}
                />

                <FormControl size="small">
                  <InputLabel>{t('settings.customCosts.allocation')}</InputLabel>
                  <Select
                    label={t('settings.customCosts.allocation')}
                    value={cost.allocationType}
                    onChange={(event: SelectChangeEvent) => updateCustomCost(cost.id, { allocationType: event.target.value as AllocationType })}
                  >
                    {allocationTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {t(`settings.allocation.${type}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small">
                  <InputLabel>{t('settings.customCosts.scope')}</InputLabel>
                  <Select
                    label={t('settings.customCosts.scope')}
                    value={cost.scopeLevel}
                    onChange={(event: SelectChangeEvent) => updateCustomCost(cost.id, { scopeLevel: event.target.value as CostScopeLevel })}
                  >
                    <MenuItem value="block">{t('settings.customCosts.blockScope')}</MenuItem>
                    <MenuItem value="staircase" disabled={!selectedBlock?.hasStaircases}>
                      {t('settings.customCosts.staircaseScope')}
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" disabled={cost.scopeLevel !== 'staircase' || !selectedBlock?.hasStaircases}>
                  <InputLabel>{t('blocks.columns.staircase')}</InputLabel>
                  <Select
                    label={t('blocks.columns.staircase')}
                    value={cost.staircaseId ?? selectedBlockStaircases[0]?.id ?? ''}
                    onChange={(event: SelectChangeEvent) => updateCustomCost(cost.id, { staircaseId: event.target.value })}
                  >
                    {selectedBlockStaircases.map((staircase) => (
                      <MenuItem key={staircase.id} value={staircase.id}>
                        {t('settings.fields.staircaseName', { staircase: staircase.name })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <AppDatePicker label={t('settings.customCosts.effectiveFrom')} value={cost.effectiveFrom} onChange={(value) => updateCustomCost(cost.id, { effectiveFrom: value })} />
              </Box>

              <TextField
                size="small"
                label={t('settings.customCosts.notesLabel')}
                defaultValue={cost.notesKey ? t(cost.notesKey) : ''}
                multiline
                minRows={2}
              />
            </Paper>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">{t('settings.sections.notifications')}</Typography>
        <FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.overdueAlerts')} />
        <FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.cashAlerts')} />
      </Paper>

      <AddBlockDialog
        block={dialogMode === 'edit' ? selectedDatabaseBlock : null}
        open={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        onSubmit={saveBlock}
      />
      <ConfirmationDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={isDeletingBlock}
        confirmLabel={isDeletingBlock ? t('settings.blockDialog.deleting') : t('settings.blockDialog.deleteConfirmYes')}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => void deleteBlock()}
        open={deleteDialogOpen}
        title={t('settings.blockDialog.deleteTitle')}
      >
        <Typography>
          {t('settings.blockDialog.deleteConfirm', {
            block: selectedDatabaseBlock?.name ?? selectedBlock?.name ?? '',
          })}
        </Typography>
      </ConfirmationDialog>
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        autoHideDuration={4000}
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
      >
        <Alert
          severity={notification?.severity ?? 'success'}
          variant="filled"
          onClose={() => setNotification(null)}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SettingsSections
