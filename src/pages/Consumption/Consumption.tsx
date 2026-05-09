import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

const Consumption: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('pages.consumption.title')}
      </Typography>
      <Typography>{t('pages.consumption.description')}</Typography>
    </Box>
  )
}

export default Consumption
