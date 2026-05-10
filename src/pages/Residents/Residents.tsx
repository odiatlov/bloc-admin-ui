import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/shared/PageHeader'
import ResidentsOverview from './components/ResidentsOverview'

const Residents: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box>
      <PageHeader title={t('pages.residents.title')} description={t('pages.residents.description')} />
      <ResidentsOverview />
    </Box>
  )
}

export default Residents
