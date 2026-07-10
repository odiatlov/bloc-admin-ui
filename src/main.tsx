import React, { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import './i18n'
import AppRoutes from './app/routes/AppRoutes'
import { RoleProvider } from './contexts/RoleContext'
import createThemeConfig from './theme/themeConfig'

// eslint-disable-next-line react-refresh/only-export-components
const RootApp: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')

  const theme = useMemo(() => createThemeConfig(mode), [mode])

  const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <RoleProvider>
          <AppRoutes themeMode={mode} toggleTheme={toggleTheme} />
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
