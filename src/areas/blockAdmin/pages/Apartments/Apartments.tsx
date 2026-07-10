import React from 'react'
import Box from '@mui/material/Box'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../../components/shared/PageHeader'
import ApiApartmentManagement from './components/ApiApartmentManagement'

const Apartments: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  return (
    <Box>
      <PageHeader
        title={t('pages.apartments.title')}
        description={t('pages.apartments.description')}
      />
      <ApiApartmentManagement initialBlockId={searchParams.get('blockId') ?? undefined} />
    </Box>
  )
}

export default Apartments
