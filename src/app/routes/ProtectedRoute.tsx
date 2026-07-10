import React from 'react'
import { Navigate } from 'react-router-dom'
import { RoleContext } from '../../contexts/RoleContext'
import { rolePermissions, type Permission } from '../../mocks/roles'

type ProtectedRouteProps = {
  permission: Permission
  children: React.ReactElement
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { isAuthenticated, role } = React.useContext(RoleContext)
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const allowed = rolePermissions[role]?.includes(permission)
  if (!allowed) return <Navigate to={role === 'SuperAdmin' ? '/superadmin/dashboard' : '/admin/dashboard'} replace />

  return children
}

export default ProtectedRoute
