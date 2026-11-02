import React from 'react'
import Alert from '@mui/material/Alert'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../../../contexts/RoleContext'
import AdminDashboard from './components/AdminDashboard'
import CensorDashboard from './components/CensorDashboard'
import ResidentDashboard from './components/ResidentDashboard' 

const Dashbaord: React.FC = () => {
  const { role } = React.useContext(RoleContext)
  const { t } = useTranslation()
  if (role === 'None') return <Alert severity="info">{t('persons.noAccess')}</Alert>

  if (role === 'Resident') return <ResidentDashboard />
  if (role === 'Censor') return <CensorDashboard />
  return <AdminDashboard />
}

export default Dashbaord
