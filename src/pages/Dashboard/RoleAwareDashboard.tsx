import React from 'react'
import { RoleContext } from '../../contexts/RoleContext'
import AdminDashboard from './AdminDashboard'
import TenantDashboard from './TenantDashboard'

const RoleAwareDashboard: React.FC = () => {
  const { role } = React.useContext(RoleContext)

  if (role === 'Tenant') return <TenantDashboard />
  return <AdminDashboard />
}

export default RoleAwareDashboard
