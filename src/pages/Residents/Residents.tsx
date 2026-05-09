import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

const Residents: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('pages.residents.title')}
      </Typography>
      <Typography>{t('pages.residents.description')}</Typography>
    </Box>
  )
}

export default Residents
