import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import SaveIcon from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../contexts/RoleContext'
import PageHeader from '../../components/shared/PageHeader'
import SettingsSections from './components/SettingsSections'

const Settings: React.FC = () => {
  const { t } = useTranslation()
  const { role } = React.useContext(RoleContext)

  return (
    <Box>
      <PageHeader
        title={t('pages.settings.title')}
        description={role === 'Resident' ? t('settings.resident.description') : t('pages.settings.description')}
        actions={(
          <Button startIcon={<SaveIcon />} variant="contained">
            {t('common.save')}
          </Button>
        )}
      />
      <SettingsSections mode={role === 'Resident' ? 'resident' : 'admin'} />
    </Box>
  )
}

export default Settings
