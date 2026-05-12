import React from 'react'
import { RoleContext } from '../../contexts/RoleContext'
import AdminDashboard from './components/AdminDashboard'
import CensorDashboard from './components/CensorDashboard'
import ResidentDashboard from './components/ResidentDashboard' 

const Dashbaord: React.FC = () => {
  const { role } = React.useContext(RoleContext)

  if (role === 'Resident') return <ResidentDashboard />
  if (role === 'Censor') return <CensorDashboard />
  return <AdminDashboard />
}

export default Dashbaord
