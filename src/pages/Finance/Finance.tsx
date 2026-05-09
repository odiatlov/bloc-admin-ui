import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

const Finance: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('pages.finance.title')}
      </Typography>
      <Typography>{t('pages.finance.description')}</Typography>
    </Box>
  )
}

export default Finance
