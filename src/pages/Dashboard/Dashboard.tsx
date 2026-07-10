import React from 'react'
import { RoleContext } from '../../contexts/RoleContext'
import AdminDashboard from './components/AdminDashboard'
import CensorDashboard from './components/CensorDashboard'
import ResidentDashboard from './components/ResidentDashboard' 
import SuperAdminDashboard from '../SuperAdmin/SuperAdminDashboard'

const Dashbaord: React.FC = () => {
  const { role } = React.useContext(RoleContext)

  if (role === 'SuperAdmin') return <SuperAdminDashboard />
  if (role === 'Resident') return <ResidentDashboard />
  if (role === 'Censor') return <CensorDashboard />
  return <AdminDashboard />
}

export default Dashbaord
