import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import './index.css'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import Users from './pages/Users/Users'
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
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<AdminLayout toggleTheme={toggleTheme} themeMode={mode} />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
