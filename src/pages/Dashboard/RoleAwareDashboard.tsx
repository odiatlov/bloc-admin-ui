import React from 'react'
import { RoleContext } from '../../contexts/RoleContext'
import AdminDashboard from './Admin/AdminDashboard'
import ResidentDashboard from './Resident/ResidentDashboard'

const RoleAwareDashboard: React.FC = () => {
  const { role } = React.useContext(RoleContext)

  if (role === 'Tenant') return <ResidentDashboard />
  return <AdminDashboard />
}

export default RoleAwareDashboard
