import React from 'react'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import { NavLink } from 'react-router-dom'
import { RoleContext } from '../../../contexts/RoleContext'
import { rolePermissions } from '../../../mocks/roles'

type Props = {
  drawerWidth: number
}

const Sidebar: React.FC<Props> = ({ drawerWidth }) => {
  const { role } = React.useContext(RoleContext)

  const navItems = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <DashboardIcon />, permission: 'dashboard' as const },
    { label: 'Tenants', to: '/admin/tenants', icon: <PeopleIcon />, permission: 'tenants' as const },
    { label: 'Settings', to: '/admin/settings', icon: <SettingsIcon />, permission: 'settings' as const },
  ]

  const allowed = rolePermissions[role] || []

  return (
    <Drawer variant="permanent" anchor="left" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
      <Toolbar>
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Bloc Admin</Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems
          .filter((it) => allowed.includes(it.permission))
          .map((item) => (
            <ListItemButton key={item.to} component={NavLink} to={item.to}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
      </List>
    </Drawer>
  )
}

export default Sidebar
