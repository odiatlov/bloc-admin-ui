import React, { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import './index.css'
import './i18n'
import AdminLayout from './layouts/AdminLayout'
import { RoleProvider } from './contexts/RoleContext'
import Residents from './pages/Residents/Residents'
import Finance from './pages/Finance/Finance'
import Consumption from './pages/Consumption/Consumption'
import Reports from './pages/Reports/Reports'
import Settings from './pages/Settings/Settings'
import createAuroraTheme from './theme/auroraTheme'
import globalStyles from './theme/globalStyles'
import Dashboard from './pages/Dashboard/Dashboard'
import Blocks from './pages/Blocks/Blocks'
import BlockContext from './pages/Blocks/BlockContext'
import Login from './pages/Login/Login'
import { RoleContext } from './contexts/RoleContext'
import { rolePermissions, type Permission } from './mocks/roles'

type ProtectedRouteProps = {
  permission: Permission
  children: React.ReactElement
}

// eslint-disable-next-line react-refresh/only-export-components
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { isAuthenticated, role } = React.useContext(RoleContext)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const allowed = rolePermissions[role]?.includes(permission)

  if (!allowed) return <Navigate to="/admin/dashboard" replace />

  return children
}

// eslint-disable-next-line react-refresh/only-export-components
const RootApp: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')

  const theme = useMemo(() => createAuroraTheme(mode), [mode])

  const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles(theme)} />
      <BrowserRouter>
        <RoleProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout toggleTheme={toggleTheme} themeMode={mode} />}>
              <Route index element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="dashboard" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="blocks" element={<ProtectedRoute permission="blocks"><Blocks /></ProtectedRoute>} />
              <Route path="residents" element={<ProtectedRoute permission="residents"><Residents /></ProtectedRoute>} />
              <Route path="finance" element={<ProtectedRoute permission="finance"><Finance /></ProtectedRoute>} />
              <Route path="consumption" element={<ProtectedRoute permission="consumption"><Consumption /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute permission="reports"><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute permission="settings"><Settings /></ProtectedRoute>} />
              <Route path="blocks/:blockId/:section" element={<ProtectedRoute permission="blocks"><BlockContext /></ProtectedRoute>} />
            </Route>
          </Routes>
        </RoleProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
