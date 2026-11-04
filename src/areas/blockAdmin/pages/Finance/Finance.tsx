import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../../../contexts/RoleContext'
import PageHeader from '../../../../components/shared/PageHeader'
import FinanceSections from './components/FinanceSections'
import ResidentBills from './components/ResidentBills'
import ApiCensorReviews from './components/ApiCensorReviews'

const Finance: React.FC = () => {
  const { t } = useTranslation()
  const { role } = React.useContext(RoleContext)
  if (role === 'Censor') return <ApiCensorReviews />

  return (
    <Box>
      <PageHeader
        title={role === 'Resident' ? t('sidebar.myBills') : t('pages.finance.title')}
        description={role === 'Resident' ? t('resident.bills.description') : t('pages.finance.description')}
      />
      {role === 'Resident' ? <ResidentBills /> : <FinanceSections />}
    </Box>
  )
}

export default Finance
