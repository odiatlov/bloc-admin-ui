import React from 'react'
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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../components/shared/AppDatePicker'
import {
  blocks,
  customCostConfigurations,
  staircases,
  utilityMonthlyInputs,
  type AllocationType,
  type CostScopeLevel,
  type CustomCostConfiguration,
  type UtilityCategory,
} from '../../../mocks/apartmentData'

type SettingsSectionsProps = {
  mode: 'admin' | 'resident'
}

const utilityCategories: UtilityCategory[] = ['gas', 'electricity', 'garbage', 'water', 'heating']
const allocationTypes: AllocationType[] = ['per_person', 'per_apartment', 'by_surface', 'by_heating_area', 'individual_meter', 'equal_split', 'custom']

const SettingsSections: React.FC<SettingsSectionsProps> = ({ mode }) => {
  const { t } = useTranslation()
  const [selectedBlockId, setSelectedBlockId] = React.useState(blocks[0]?.id ?? '')
  const [blockDeadline, setBlockDeadline] = React.useState('2026-05-15')
  const [staircaseDeadlines, setStaircaseDeadlines] = React.useState<Record<string, string>>({})
  const [customCosts, setCustomCosts] = React.useState<CustomCostConfiguration[]>(customCostConfigurations)
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? blocks[0]
  const selectedBlockStaircases = staircases.filter((staircase) => staircase.blockId === selectedBlock?.id)
  const selectedCustomCosts = customCosts.filter((cost) => cost.blockId === selectedBlock?.id)

  const handleBlockChange = (event: SelectChangeEvent) => {
    setSelectedBlockId(event.target.value)
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

  if (mode === 'resident') {
    return (
      <Box sx={{ display: 'grid', gap: 2, maxWidth: 720 }}>
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
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h6">{t('settings.admin.blockManagement')}</Typography>
          <Button startIcon={<AddIcon />} variant="outlined">
            {t('settings.actions.addBlock')}
          </Button>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 320px) minmax(0, 1fr)' }, gap: 2 }}>
          <FormControl size="small">
            <InputLabel>{t('settings.fields.block')}</InputLabel>
            <Select label={t('settings.fields.block')} value={selectedBlockId} onChange={handleBlockChange}>
              {blocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>
                  {t('common.blockValue', { block: block.name })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField size="small" label={t('settings.fields.blockName')} defaultValue={selectedBlock?.name} sx={{ minWidth: { xs: '100%', sm: 180 } }} />
            <Button startIcon={<EditIcon />} variant="contained">
              {t('settings.actions.editBlock')}
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
    </Box>
  )
}

export default SettingsSections
