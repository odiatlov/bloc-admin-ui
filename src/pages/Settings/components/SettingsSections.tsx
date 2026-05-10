import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

type SettingsSectionsProps = {
  mode: 'admin' | 'resident'
}

const SettingsSections: React.FC<SettingsSectionsProps> = ({ mode }) => {
  const { t } = useTranslation()

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
    <Box sx={{ display: 'grid', gap: 2, maxWidth: 840 }}>
      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="h6">{t('settings.admin.blocks')}</Typography>
        <TextField label={t('settings.fields.blocks')} defaultValue="A, B, C" />
        <TextField label={t('settings.fields.deadline')} type="number" defaultValue={15} />
      </Paper>
      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="h6">{t('settings.admin.pricing')}</Typography>
        <TextField label={t('settings.fields.waterPrice')} type="number" defaultValue={8.5} />
        <TextField label={t('settings.fields.maintenanceFee')} type="number" defaultValue={125} />
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
