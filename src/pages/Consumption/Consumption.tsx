import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../contexts/RoleContext'
import PageHeader from '../../components/shared/PageHeader'
import ConsumptionSections from './components/ConsumptionSections'

const Consumption: React.FC = () => {
  const { t } = useTranslation()
  const { role } = React.useContext(RoleContext)

  return (
    <Box>
      <PageHeader
        title={role === 'Resident' ? t('sidebar.waterIndex') : t('pages.consumption.title')}
        description={role === 'Resident' ? t('consumption.resident.description') : t('pages.consumption.description')}
      />
      <ConsumptionSections mode={role === 'Resident' ? 'resident' : 'admin'} />
    </Box>
  )
}

export default Consumption
