import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

const Settings: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('pages.settings.title')}
      </Typography>
      <Typography>{t('pages.settings.description')}</Typography>
    </Box>
  )
}

export default Settings
