import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useTranslation } from 'react-i18next'
import { useNotifications } from './useNotifications'

export default function NotificationsButton() {
  const { t } = useTranslation()
  const { unreadCount, openNotifications, enabled } = useNotifications()
  return <Button
    color="inherit"
    fullWidth
    onClick={openNotifications}
    disabled={!enabled}
    startIcon={<Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}><NotificationsIcon /></Badge>}
    sx={{ justifyContent: 'flex-start', mb: 1 }}
  >
    {t('sidebar.notifications')}
  </Button>
}
