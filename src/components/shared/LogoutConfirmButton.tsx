import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../contexts/RoleContext'

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
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('auth.logout.title')}</DialogTitle>
        <DialogContent>
          <Typography>{t('auth.logout.body')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="primary" onClick={confirmLogout}>
            {t('auth.logout.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default LogoutConfirmButton
