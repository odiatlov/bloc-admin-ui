import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import './index.css'
import AdminLayout from './layouts/AdminLayout'
import RoleAwareDashboard from './pages/Dashboard/RoleAwareDashboard'
import { RoleProvider } from './contexts/RoleContext'
import Tenants from './pages/Tenants/Tenants'
import Settings from './pages/Settings/Settings'
import createAuroraTheme from './theme/auroraTheme'
import globalStyles from './theme/globalStyles'

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
            <Route path="/admin" element={<AdminLayout toggleTheme={toggleTheme} themeMode={mode} />}>
              <Route index element={<RoleAwareDashboard />} />
              <Route path="dashboard" element={<RoleAwareDashboard />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="settings" element={<Settings />} />
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
