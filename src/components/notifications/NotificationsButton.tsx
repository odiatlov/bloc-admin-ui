import React from 'react'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useTranslation } from 'react-i18next'
import type { NotificationResponse } from '../../types/notifications'
import NotificationsDrawer from './NotificationsDrawer'
import { useNotifications } from './useNotifications'

const NotificationsButton: React.FC = () => {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const {
    error,
    loading,
    markAllAsRead,
    markAsRead,
    notifications,
    refreshNotifications,
    unreadCount,
  } = useNotifications()

  const openDrawer = () => {
    setOpen(true)
    void refreshNotifications()
  }

  const handleNotificationClick = async (notification: NotificationResponse) => {
    await markAsRead(notification)
  }

  return (
    <>
      <Button
        color="inherit"
        fullWidth
        onClick={openDrawer}
        startIcon={(
          <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}>
            <NotificationsIcon />
          </Badge>
        )}
        sx={{ justifyContent: 'flex-start', mb: 1 }}
      >
        {t('sidebar.notifications')}
      </Button>
      <NotificationsDrawer
        error={error}
        loading={loading}
        notifications={notifications}
        onClose={() => setOpen(false)}
        onMarkAllAsRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
        onRetry={refreshNotifications}
        open={open}
      />
    </>
  )
}

export default NotificationsButton
