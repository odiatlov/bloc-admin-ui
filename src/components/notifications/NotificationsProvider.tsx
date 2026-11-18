import React from 'react'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../contexts/RoleContext'
import { notificationsApi } from '../../services/notificationsApi'
import type { NotificationSource } from '../../types/notifications'
import { NotificationsContext } from './NotificationsContext'
import NotificationsDrawer from './NotificationsDrawer'
import { useNotificationState } from './useNotificationState'

type ScopeProps = React.PropsWithChildren<{
  source: NotificationSource | null
  platform: boolean
  enabled: boolean
}>

const NotificationsScope: React.FC<ScopeProps> = ({ children, source, platform, enabled }) => {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const { error, loading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount } = useNotificationState(source)
  const openNotifications = () => {
    if (!enabled) return
    setOpen(true)
    void refreshNotifications()
  }

  return <>
    <NotificationsContext.Provider value={{ unreadCount, openNotifications, enabled }}>
      {children}
    </NotificationsContext.Provider>
    <NotificationsDrawer
      open={open}
      onClose={() => setOpen(false)}
      error={error}
      loading={loading}
      notifications={notifications}
      onMarkAllAsRead={markAllAsRead}
      onNotificationClick={markAsRead}
      onRetry={refreshNotifications}
      canRefresh={source !== null}
      emptyHelperText={platform ? t('superAdmin.notifications.emptyHelp') : undefined}
    />
  </>
}

export default function NotificationsProvider({ children }: React.PropsWithChildren) {
  const { account, token, isAuthenticated, accountsLoading, accountsError } = React.useContext(RoleContext)
  // Audience follows the server-confirmed actor, not the selected view role.
  const platform = account.systemRole === 'SuperAdmin'
  const enabled = isAuthenticated && !accountsLoading && !accountsError
  // A future platform source plugs in here. It must never reuse the regular-user API.
  const source = enabled && !platform ? notificationsApi : null
  return <NotificationsScope key={JSON.stringify([account.id, token, platform])} source={source} platform={platform} enabled={enabled}>
    {children}
  </NotificationsScope>
}
