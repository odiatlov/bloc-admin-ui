import React from 'react'
import { NotificationsContext } from './NotificationsContext'

export const useNotifications = () => {
  const context = React.useContext(NotificationsContext)
  if (!context) throw new Error('NotificationsButton requires NotificationsProvider')
  return context
}
