import React from 'react'
import { Navigate } from 'react-router-dom'
import { RoleContext } from '../../contexts/RoleContext'
import { rolePermissions, type Permission } from '../../mocks/roles'
import CircularProgress from '@mui/material/CircularProgress'
import LoadErrorState from '../../components/shared/LoadErrorState'
import { useTranslation } from 'react-i18next'

type ProtectedRouteProps = {
  permission: Permission
  children: React.ReactElement
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { isAuthenticated, role, accountsLoading, accountsError, refreshAccounts } = React.useContext(RoleContext)
  const { t } = useTranslation()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (accountsLoading) return <CircularProgress aria-label={t('consumption.loading')} />
  if (accountsError) return <LoadErrorState onRetry={refreshAccounts} />

  const allowed = rolePermissions[role]?.includes(permission)
  if (!allowed) return <Navigate to={role === 'SuperAdmin' ? '/superadmin/dashboard' : '/admin/dashboard'} replace />

  return children
}

export default ProtectedRoute
