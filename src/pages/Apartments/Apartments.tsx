import React from 'react'
import Box from '@mui/material/Box'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/shared/PageHeader'
import { RoleContext } from '../../contexts/RoleContext'
import ApiApartmentManagement from './components/ApiApartmentManagement'
import ApartmentManagement from './components/ApartmentManagement'

const Apartments: React.FC = () => {
  const { t } = useTranslation()
  const { account } = React.useContext(RoleContext)
  const [searchParams] = useSearchParams()
  const shouldUseDatabase = account.id === 'acct-demo'

  return (
    <Box>
      <PageHeader
        title={t('pages.apartments.title')}
        description={t('pages.apartments.description')}
      />
      {shouldUseDatabase ? (
        <ApiApartmentManagement initialBlockId={searchParams.get('blockId') ?? undefined} />
      ) : (
        <ApartmentManagement initialBlockId={searchParams.get('blockId') ?? undefined} />
      )}
    </Box>
  )
}

export default Apartments
