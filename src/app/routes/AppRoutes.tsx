import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Apartments from '../../areas/blockAdmin/pages/Apartments/Apartments'
import Blocks from '../../areas/blockAdmin/pages/Blocks/Blocks'
import BlockContext from '../../areas/blockAdmin/pages/Blocks/BlockContext'
import Consumption from '../../areas/blockAdmin/pages/Consumption/Consumption'
import Dashboard from '../../areas/blockAdmin/pages/Dashboard/Dashboard'
import Finance from '../../areas/blockAdmin/pages/Finance/Finance'
import Reports from '../../areas/blockAdmin/pages/Reports/Reports'
import Residents from '../../areas/blockAdmin/pages/Residents/Residents'
import Settings from '../../areas/blockAdmin/pages/Settings/Settings'
import Staircases from '../../areas/blockAdmin/pages/Staircases/Staircases'
import ExportData from '../../areas/supportPlatform/pages/ExportData/ExportData'
import ManageAdmins from '../../areas/supportPlatform/pages/ManageAdmins/ManageAdmins'
import SuperAdminBlocks from '../../areas/supportPlatform/pages/SuperAdminBlocks/SuperAdminBlocks'
import SuperAdminDashboard from '../../areas/supportPlatform/pages/SuperAdminDashboard/SuperAdminDashboard'
import SuperAdminResidents from '../../areas/supportPlatform/pages/SuperAdminResidents/SuperAdminResidents'
import { RoleContext } from '../../contexts/RoleContext'
import AppLayout from '../../layouts/AppLayout'
import Login from '../../pages/Login/Login'
import ProtectedRoute from './ProtectedRoute'

type AppRoutesProps = {
  themeMode: 'light' | 'dark'
  toggleTheme: () => void
}

const DashboardRoute: React.FC = () => {
  const { role } = React.useContext(RoleContext)

  if (role === 'SuperAdmin') return <Navigate to="/superadmin/dashboard" replace />

  return <Dashboard />
}

const AppRoutes: React.FC<AppRoutesProps> = ({ themeMode, toggleTheme }) => (
  <Routes>
    <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/admin" element={<AppLayout toggleTheme={toggleTheme} themeMode={themeMode} />}>
        <Route index element={<ProtectedRoute permission="dashboard"><DashboardRoute /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute permission="dashboard"><DashboardRoute /></ProtectedRoute>} />
        <Route path="blocks" element={<ProtectedRoute permission="blocks"><Blocks /></ProtectedRoute>} />
        <Route path="staircases" element={<ProtectedRoute permission="blocks"><Staircases /></ProtectedRoute>} />
        <Route path="apartments" element={<ProtectedRoute permission="blocks"><Apartments /></ProtectedRoute>} />
        <Route path="residents" element={<ProtectedRoute permission="residents"><Residents /></ProtectedRoute>} />
        <Route path="finance" element={<ProtectedRoute permission="finance"><Finance /></ProtectedRoute>} />
        <Route path="consumption" element={<ProtectedRoute permission="consumption"><Consumption /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute permission="reports"><Reports /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute permission="settings"><Settings /></ProtectedRoute>} />
        <Route path="blocks/:blockId/:section" element={<ProtectedRoute permission="blocks"><BlockContext /></ProtectedRoute>} />
        <Route path="super/*" element={<Navigate to="/superadmin/dashboard" replace />} />
    </Route>

    <Route path="/superadmin" element={<AppLayout toggleTheme={toggleTheme} themeMode={themeMode} />}>
      <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
      <Route path="dashboard" element={<ProtectedRoute permission="superAdmin"><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="manage-admins" element={<ProtectedRoute permission="superAdmin"><ManageAdmins /></ProtectedRoute>} />
      <Route path="blocks" element={<ProtectedRoute permission="superAdmin"><SuperAdminBlocks /></ProtectedRoute>} />
      <Route path="residents" element={<ProtectedRoute permission="superAdmin"><SuperAdminResidents /></ProtectedRoute>} />
      <Route path="export" element={<ProtectedRoute permission="superAdmin"><ExportData /></ProtectedRoute>} />
    </Route>
  </Routes>
)

export default AppRoutes
