import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../contexts/RoleContext'
import PageHeader from '../../components/shared/PageHeader'
import CensorReviewWorkspace from './components/CensorReviewWorkspace'
import FinanceSections from './components/FinanceSections'
import ResidentBills from './components/ResidentBills'

const Finance: React.FC = () => {
  const { t } = useTranslation()
  const { role } = React.useContext(RoleContext)

  return (
    <Box>
      <PageHeader
        title={role === 'Resident' ? t('sidebar.myBills') : role === 'Censor' ? t('pages.censor.title') : t('pages.finance.title')}
        description={role === 'Resident' ? t('resident.bills.description') : role === 'Censor' ? t('pages.censor.description') : t('pages.finance.description')}
      />
      {role === 'Resident' ? <ResidentBills /> : role === 'Censor' ? <CensorReviewWorkspace /> : <FinanceSections />}
    </Box>
  )
}

export default Finance
