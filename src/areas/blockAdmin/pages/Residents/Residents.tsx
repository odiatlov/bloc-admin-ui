import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../../components/shared/PageHeader'
import ApiResidentsOverview from './components/ApiResidentsOverview'

const Residents: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box>
      <PageHeader title={t('pages.residents.title')} description={t('pages.residents.description')} />
      <ApiResidentsOverview />
    </Box>
  )
}

export default Residents
