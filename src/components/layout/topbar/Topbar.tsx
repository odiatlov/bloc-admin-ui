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

type Props = {
  drawerWidth?: number
  toggleTheme?: () => void
  themeMode?: 'light' | 'dark'
}

const Topbar: React.FC<Props> = ({ drawerWidth = 240, toggleTheme, themeMode = 'dark' }) => {
  const { role, setRole } = React.useContext(RoleContext)

  const handleRoleChange = (e: SelectChangeEvent<string>) => {
    setRole(e.target.value as Role)
  }

  return (
    <AppBar
      position="fixed"
      sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
    >
      <Toolbar>
        <FormControl variant="standard" sx={{ minWidth: 120 }}>
          <Select value={role} onChange={handleRoleChange} inputProps={{ 'aria-label': 'role-select' }}>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Tenant">Tenant</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }} aria-label="toggle theme">
          {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        <Button color="inherit">Logout</Button>
      </Toolbar>
    </AppBar>
  )
}

export default Topbar
