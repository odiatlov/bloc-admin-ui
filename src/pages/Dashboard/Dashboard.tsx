import React from 'react'
import { RoleContext } from '../../contexts/RoleContext'
import AdminDashboard from './components/AdminDashboard'
import ResidentDashboard from './components/ResidentDashboard' 

const Dashbaord: React.FC = () => {
  const { role } = React.useContext(RoleContext)

  if (role === 'Resident') return <ResidentDashboard />
  return <AdminDashboard />
}

export default Dashbaord
