import React from 'react'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import OpacityIcon from '@mui/icons-material/Opacity'
import AssessmentIcon from '@mui/icons-material/Assessment'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import ApartmentIcon from '@mui/icons-material/Apartment'
import StairsIcon from '@mui/icons-material/Stairs'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import { NavLink } from 'react-router-dom'
import { RoleContext } from '../../../contexts/RoleContext'
import { useTranslation } from 'react-i18next'
import { rolePermissions } from '../../../mocks/roles'
import LogoutConfirmButton from '../../shared/LogoutConfirmButton'

type Props = {
  drawerWidth: number
  mobileOpen?: boolean
  onMobileClose?: () => void
}

type SidebarContentProps = {
  onNavigate?: () => void
  onClose?: () => void
  showCloseButton?: boolean
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onNavigate, onClose, showCloseButton = false }) => {
  const { role } = React.useContext(RoleContext)
  const { t } = useTranslation()

  const navItems = role === 'Resident'
    ? [
        { label: t('sidebar.dashboard'), to: '/admin/dashboard', icon: <DashboardIcon />, permission: 'dashboard' as const },
        { label: t('sidebar.myBills'), to: '/admin/finance', icon: <MonetizationOnIcon />, permission: 'finance' as const },
        { label: t('sidebar.waterIndex'), to: '/admin/consumption', icon: <OpacityIcon />, permission: 'consumption' as const },
        { label: t('sidebar.settings'), to: '/admin/settings', icon: <SettingsIcon />, permission: 'settings' as const },
      ]
    : role === 'Censor'
      ? [
          { label: t('sidebar.dashboard'), to: '/admin/dashboard', icon: <DashboardIcon />, permission: 'dashboard' as const },
          { label: t('sidebar.reviews'), to: '/admin/finance', icon: <FactCheckIcon />, permission: 'finance' as const },
          { label: t('sidebar.consumption'), to: '/admin/consumption', icon: <OpacityIcon />, permission: 'consumption' as const },
          { label: t('sidebar.reports'), to: '/admin/reports', icon: <AssessmentIcon />, permission: 'reports' as const },
        ]
    : [
        { label: t('sidebar.dashboard'), to: '/admin/dashboard', icon: <DashboardIcon />, permission: 'dashboard' as const },
        { label: t('sidebar.blocks'), to: '/admin/blocks', icon: <HomeWorkIcon />, permission: 'blocks' as const },
        { label: t('sidebar.staircases'), to: '/admin/staircases', icon: <StairsIcon />, permission: 'blocks' as const },
        { label: t('sidebar.apartments'), to: '/admin/apartments', icon: <ApartmentIcon />, permission: 'blocks' as const },
        { label: t('sidebar.residents'), to: '/admin/residents', icon: <PeopleIcon />, permission: 'residents' as const },
        { label: t('sidebar.finance'), to: '/admin/finance', icon: <MonetizationOnIcon />, permission: 'finance' as const },
        { label: t('sidebar.consumption'), to: '/admin/consumption', icon: <OpacityIcon />, permission: 'consumption' as const },
        { label: t('sidebar.reports'), to: '/admin/reports', icon: <AssessmentIcon />, permission: 'reports' as const },
        { label: t('sidebar.settings'), to: '/admin/settings', icon: <SettingsIcon />, permission: 'settings' as const },
      ]

  const allowed = rolePermissions[role] || []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        {showCloseButton && (
          <IconButton edge="start" onClick={onClose} aria-label={t('sidebar.close')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{t('app.title')}</Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {navItems
            .filter((it) => allowed.includes(it.permission))
            .map((item) => (
              <ListItemButton key={item.to} component={NavLink} to={item.to} onClick={onNavigate}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <LogoutConfirmButton fullWidth sidebar />
      </Box>
    </Box>
  )
}

const Sidebar: React.FC<Props> = ({ drawerWidth, mobileOpen = false, onMobileClose }) => {
  return (
    <>
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <SidebarContent onNavigate={onMobileClose} onClose={onMobileClose} showCloseButton />
      </Drawer>

      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <SidebarContent />
      </Drawer>
    </>
  )
}

export default Sidebar
