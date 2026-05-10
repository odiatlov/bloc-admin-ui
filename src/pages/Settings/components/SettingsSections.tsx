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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import { blocks, staircases, utilityMonthlyInputs, type UtilityCategory } from '../../../mocks/apartmentData'

type SettingsSectionsProps = {
  mode: 'admin' | 'resident'
}

const utilityCategories: UtilityCategory[] = ['gas', 'electricity', 'garbage', 'water', 'heating']

const SettingsSections: React.FC<SettingsSectionsProps> = ({ mode }) => {
  const { t } = useTranslation()
  const [selectedBlockId, setSelectedBlockId] = React.useState(blocks[0]?.id ?? '')
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? blocks[0]
  const selectedBlockStaircases = staircases.filter((staircase) => staircase.blockId === selectedBlock?.id)

  const handleBlockChange = (event: SelectChangeEvent) => {
    setSelectedBlockId(event.target.value)
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
        <Button variant="contained" sx={{ justifySelf: 'start' }}>
          {t('common.save')}
        </Button>
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
          <TextField label={t('settings.fields.blockDeadline')} type="date" defaultValue="2026-05-15" slotProps={{ inputLabel: { shrink: true } }} />
          {selectedBlock?.hasStaircases && (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {selectedBlockStaircases.map((staircase, index) => (
                <TextField
                  key={staircase.id}
                  label={t('settings.fields.staircaseDeadline', { staircase: staircase.name })}
                  type="date"
                  defaultValue={`2026-05-${String(15 + index).padStart(2, '0')}`}
                  slotProps={{ inputLabel: { shrink: true } }}
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

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">{t('settings.sections.notifications')}</Typography>
        <FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.overdueAlerts')} />
        <FormControlLabel control={<Checkbox defaultChecked />} label={t('settings.fields.cashAlerts')} />
      </Paper>
      <Button variant="contained" sx={{ justifySelf: 'start' }}>
        {t('common.save')}
      </Button>
    </Box>
  )
}

export default SettingsSections
