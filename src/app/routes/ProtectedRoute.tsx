import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RoleContext } from '../../contexts/RoleContext'
import { rolePermissions, type Permission } from '../../mocks/roles'
import LoadErrorState from '../../components/shared/LoadErrorState'
import LoadingState from '../../components/shared/LoadingState'
import { useTranslation } from 'react-i18next'

type ProtectedRouteProps = {
  permission: Permission
  children: React.ReactElement
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { isAuthenticated, role, accountsLoading, accountsError, refreshAccounts, logoutRequested } = React.useContext(RoleContext)
  const { t } = useTranslation()
  const location = useLocation()
  if (logoutRequested) return <Navigate to="/login" replace />
  if (accountsLoading) return <LoadingState variant="page" label={t('common.pagination.loading')} />
  if (accountsError) return <LoadErrorState onRetry={refreshAccounts} />

  if (!isAuthenticated) return <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />

  const allowed = rolePermissions[role]?.includes(permission)
  if (!allowed) return <Navigate to={role === 'SuperAdmin' ? '/superadmin/dashboard' : '/admin/dashboard'} replace />

  return children
}

export default ProtectedRoute
