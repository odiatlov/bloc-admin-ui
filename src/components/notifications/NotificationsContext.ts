import React from 'react'

type NotificationsContextValue = {
  unreadCount: number
  openNotifications: () => void
  enabled: boolean
}

export const NotificationsContext = React.createContext<NotificationsContextValue | null>(null)
