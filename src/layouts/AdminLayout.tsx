import React from 'react'
import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Toolbar from '@mui/material/Toolbar'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Sidebar from '../components/layout/sidebar/Sidebar'
import Topbar from '../components/layout/topbar/Topbar'

const drawerWidth = 240

type AdminLayoutProps = {
  toggleTheme?: () => void
  themeMode?: 'light' | 'dark'
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ toggleTheme, themeMode }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen((open) => !open)
  }

  const handleDrawerClose = () => {
    setMobileOpen(false)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Topbar
        drawerWidth={drawerWidth}
        toggleTheme={toggleTheme}
        themeMode={themeMode}
        isMobile={isMobile}
        onMenuClick={handleDrawerToggle}
      />

      <Sidebar drawerWidth={drawerWidth} mobileOpen={mobileOpen} onMobileClose={handleDrawerClose} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
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
