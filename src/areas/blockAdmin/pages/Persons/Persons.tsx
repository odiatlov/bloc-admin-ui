import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../../components/shared/PageHeader'
import ApiPersonsOverview from './components/ApiPersonsOverview'
import { RoleContext } from '../../../../contexts/RoleContext'

const Persons: React.FC = () => {
  const { t } = useTranslation()
  const { account, role, token } = React.useContext(RoleContext)
  return (
    <Box>
      <PageHeader title={t('pages.persons.title')} description={t('pages.persons.description')} />
      <ApiPersonsOverview key={`${account.id}:${role}:${token}`} />
    </Box>
  )
}

export default Persons
