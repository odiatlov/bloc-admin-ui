import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'

import { RoleContext, type Role } from '../../../contexts/RoleContext'
import { useTranslation } from 'react-i18next'

type Props = {
  drawerWidth?: number
  toggleTheme?: () => void
  themeMode?: 'light' | 'dark'
}

const Topbar: React.FC<Props> = ({ drawerWidth = 240, toggleTheme, themeMode = 'dark' }) => {
  const { role, setRole } = React.useContext(RoleContext)
  const { t, i18n } = useTranslation()

  const [language, setLanguage] = React.useState<string>(i18n.language || 'en')

  React.useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('appLanguage') : null
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved)
      setLanguage(saved)
    }
  }, [i18n])

  const handleRoleChange = (e: SelectChangeEvent<string>) => {
    setRole(e.target.value as Role)
  }

  const handleLanguageChange = (e: SelectChangeEvent<string>) => {
    const lang = e.target.value
    setLanguage(lang)
    i18n.changeLanguage(lang)
    try {
      localStorage.setItem('appLanguage', lang)
    } catch (err) {
      // ignore
    }
  }

  return (
    <AppBar
      position="fixed"
      sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
    >
      <Toolbar>
        <FormControl variant="standard" sx={{ minWidth: 120 }}>
          <Select value={role} onChange={handleRoleChange} inputProps={{ 'aria-label': 'role-select' }}>
            <MenuItem value="Admin">{t('layout.topbar.role.admin')}</MenuItem>
            <MenuItem value="Tenant">{t('layout.topbar.role.tenant')}</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }} aria-label="toggle theme">
          {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

          <FormControl variant="standard" sx={{ minWidth: 96, mr: 1 }}>
            <Select value={language} onChange={handleLanguageChange} inputProps={{ 'aria-label': 'language-select' }}>
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="ro">RO</MenuItem>
            </Select>
          </FormControl>

          <Button color="inherit">{t('layout.topbar.logout')}</Button>
      </Toolbar>
    </AppBar>
  )
}

export default Topbar
