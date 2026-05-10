import { StrictMode, useMemo, useState } from 'react'
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
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="residents" element={<Residents />} />
              <Route path="finance" element={<Finance />} />
              <Route path="consumption" element={<Consumption />} />
              <Route path="reports" element={<Reports />} />
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
