import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

const Reports: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('pages.reports.title')}
      </Typography>
      <Typography>{t('pages.reports.description')}</Typography>
    </Box>
  )
}

export default Reports
