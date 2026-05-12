import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import MenuIcon from '@mui/icons-material/Menu'
import { useNavigate } from 'react-router-dom'

import { RoleContext, type Role } from '../../../contexts/RoleContext'
import { useTranslation } from 'react-i18next'

type Props = {
  drawerWidth?: number
  toggleTheme?: () => void
  themeMode?: 'light' | 'dark'
  isMobile?: boolean
  onMenuClick?: () => void
}

const Topbar: React.FC<Props> = ({
  drawerWidth = 240,
  toggleTheme,
  themeMode = 'dark',
  isMobile = false,
  onMenuClick,
}) => {
  const { role, setRole } = React.useContext(RoleContext)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [language, setLanguage] = React.useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('appLanguage') : null
    return saved || i18n.language || 'en'
  })

  React.useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('appLanguage') : null
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved)
    }
  }, [i18n])

  const handleRoleChange = (e: SelectChangeEvent<string>) => {
    setRole(e.target.value as Role)
    navigate('/admin/dashboard')
  }

  const handleLanguageChange = (e: SelectChangeEvent<string>) => {
    const lang = e.target.value
    setLanguage(lang)
    i18n.changeLanguage(lang)
    try {
      localStorage.setItem('appLanguage', lang)
    } catch {
      // ignore
    }
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        ml: { xs: 0, md: `${drawerWidth}px` },
      }}
    >
      <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minWidth: 0 }}>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            aria-label={t('layout.topbar.openSidebar')}
            sx={{ flexShrink: 0 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <FormControl variant="standard" sx={{ minWidth: { xs: 96, sm: 120 }, flexShrink: 0 }}>
          <Select value={role} onChange={handleRoleChange} inputProps={{ 'aria-label': 'role-select' }}>
            <MenuItem value="Admin">{t('layout.topbar.role.admin')}</MenuItem>
            <MenuItem value="Resident">{t('layout.topbar.role.resident')}</MenuItem>
            <MenuItem value="Censor">{t('layout.topbar.role.censor')}</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton color="inherit" onClick={toggleTheme} aria-label={t('layout.topbar.toggleTheme')}>
          {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

          <FormControl variant="standard" sx={{ minWidth: 72, flexShrink: 0 }}>
            <Select value={language} onChange={handleLanguageChange} inputProps={{ 'aria-label': 'language-select' }}>
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="ro">RO</MenuItem>
            </Select>
          </FormControl>

      </Toolbar>
    </AppBar>
  )
}

export default Topbar
