import React from 'react'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import { NavLink } from 'react-router-dom'

type Props = {
  drawerWidth: number
}

const Sidebar: React.FC<Props> = ({ drawerWidth }) => {
  const navItems = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: 'Users', to: '/admin/users', icon: <PeopleIcon /> },
    { label: 'Settings', to: '/admin/settings', icon: <SettingsIcon /> },
  ]

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar sx={{ px: 2 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Bloc Admin</div>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{ '&.active': { backgroundColor: 'action.selected' } }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  )
}

export default Sidebar
