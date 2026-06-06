import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const mainRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  const handleDrawerToggle = () => {
    setMobileOpen((open) => !open)
  }

  const handleDrawerClose = () => {
    setMobileOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
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
        ref={mainRef}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
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
