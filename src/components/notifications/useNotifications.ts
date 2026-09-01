import React from 'react'
import { notificationsApi } from '../../services/notificationsApi'
import type { NotificationResponse } from '../../types/notifications'

export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState<NotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const refreshUnreadCount = React.useCallback(async () => {
    const count = await notificationsApi.getUnreadCount()
    setUnreadCount(count)
  }, [])

  const refreshNotifications = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [items, count] = await Promise.all([
        notificationsApi.getAll(),
        notificationsApi.getUnreadCount(),
      ])
      setNotifications(items)
      setUnreadCount(count)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Notifications could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = React.useCallback(async (notification: NotificationResponse) => {
    if (notification.isRead) return

    await notificationsApi.markAsRead(notification.id)
    setNotifications((items) => items.map((item) => (
      item.id === notification.id
        ? { ...item, isRead: true, readAt: new Date().toISOString() }
        : item
    )))
    setUnreadCount((count) => Math.max(count - 1, 0))
  }, [])

  const markAllAsRead = React.useCallback(async () => {
    await notificationsApi.markAllAsRead()
    const readAt = new Date().toISOString()
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true, readAt })))
    setUnreadCount(0)
  }, [])

  React.useEffect(() => {
    void refreshUnreadCount().catch(() => {
      setUnreadCount(0)
    })
  }, [refreshUnreadCount])

  return {
    error,
    loading,
    markAllAsRead,
    markAsRead,
    notifications,
    refreshNotifications,
    unreadCount,
  }
}
