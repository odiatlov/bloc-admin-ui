import React from 'react'
import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Toolbar from '@mui/material/Toolbar'
import Sidebar from '../components/layout/sidebar/Sidebar'
import Topbar from '../components/layout/topbar/Topbar'

const drawerWidth = 240

type AdminLayoutProps = {
  toggleTheme?: () => void
  themeMode?: 'light' | 'dark'
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ toggleTheme, themeMode }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Topbar drawerWidth={drawerWidth} toggleTheme={toggleTheme} themeMode={themeMode} />

      <Sidebar drawerWidth={drawerWidth} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
          transition: (theme) => theme.transitions.create(['width', 'margin'], { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.leavingScreen }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}

export default AdminLayout
