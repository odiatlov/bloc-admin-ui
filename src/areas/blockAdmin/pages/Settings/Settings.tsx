import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import SaveIcon from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../../../contexts/RoleContext'
import ActionBar from '../../../../components/shared/ActionBar'
import PageHeader from '../../../../components/shared/PageHeader'
import SettingsSections from './components/SettingsSections'

const Settings: React.FC = () => {
  const { t } = useTranslation()
  const { role } = React.useContext(RoleContext)

  return (
    <Box>
      <PageHeader
        title={t('pages.settings.title')}
        description={role === 'Resident' ? t('settings.resident.description') : t('pages.settings.description')}
      />
      <Box sx={{ display: 'grid', gap: 2 }}>
        <SettingsSections mode={role === 'Resident' ? 'resident' : 'admin'} />
        <ActionBar title={t('settings.actions.saveChanges')}>
          <Button startIcon={<SaveIcon />} variant="contained" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}>
            {t('common.save')}
          </Button>
        </ActionBar>
      </Box>
    </Box>
  )
}

export default Settings
