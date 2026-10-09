import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../../components/shared/PageHeader'
import ApiResidentsOverview from './components/ApiResidentsOverview'
import { RoleContext } from '../../../../contexts/RoleContext'

const Residents: React.FC = () => {
  const { t } = useTranslation()
  const { account, role, token } = React.useContext(RoleContext)
  return (
    <Box>
      <PageHeader title={t('pages.residents.title')} description={t('pages.residents.description')} />
      <ApiResidentsOverview key={`${account.id}:${role}:${token}`} />
    </Box>
  )
}

export default Residents
