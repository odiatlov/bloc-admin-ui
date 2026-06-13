import React from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../contexts/RoleContext'
import AppDialog from './AppDialog'

type LogoutConfirmButtonProps = {
  fullWidth?: boolean
  sidebar?: boolean
}

const LogoutConfirmButton: React.FC<LogoutConfirmButtonProps> = ({ fullWidth = false, sidebar = false }) => {
  const { t } = useTranslation()
  const { logout } = React.useContext(RoleContext)
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)

  const confirmLogout = () => {
    logout()
    setOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <>
      <Button
        fullWidth={fullWidth}
        startIcon={<LogoutIcon />}
        color="inherit"
        onClick={() => setOpen(true)}
        sx={sidebar ? { justifyContent: 'flex-start' } : undefined}
      >
        {t('layout.topbar.logout')}
      </Button>
      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmLabel={t('auth.logout.confirm')}
        maxWidth="xs"
        onCancel={() => setOpen(false)}
        onConfirm={confirmLogout}
        open={open}
        title={t('auth.logout.title')}
      >
        <Typography>{t('auth.logout.body')}</Typography>
      </AppDialog>
    </>
  )
}

export default LogoutConfirmButton
