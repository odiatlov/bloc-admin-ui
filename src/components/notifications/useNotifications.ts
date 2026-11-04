import React from 'react'
import { notificationsApi } from '../../services/notificationsApi'
import type { NotificationResponse } from '../../types/notifications'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFinanceActionScope } from '../../hooks/useFinanceWorkspace'

export const useNotifications = () => {
  const active = useFinanceActionScope()
  const location = useLocation()
  const { t } = useTranslation()
  const [notifications, setNotifications] = React.useState<NotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const listRequest = React.useRef(0)
  const countRequest = React.useRef(0)

  const refreshUnreadCount = React.useCallback(async () => {
    const request = ++countRequest.current
    try {
      const count = await notificationsApi.getUnreadCount()
      if (active.current && request === countRequest.current) setUnreadCount(count)
    } catch (nextError) {
      if (active.current && request === countRequest.current) throw nextError
    }
  }, [active])

  const refreshNotifications = React.useCallback(async () => {
    const request = ++listRequest.current
    const countVersion = ++countRequest.current
    setLoading(true)
    setError(null)

    try {
      const [items, count] = await Promise.all([
        notificationsApi.getAll(),
        notificationsApi.getUnreadCount(),
      ])
      if (active.current && request === listRequest.current) setNotifications(items)
      if (active.current && countVersion === countRequest.current) setUnreadCount(count)
    } catch (nextError) {
      if (active.current && request === listRequest.current) setError(nextError instanceof Error ? nextError.message : t('financeReview.notifications.failed'))
    } finally {
      if (active.current && request === listRequest.current) setLoading(false)
    }
  }, [active, t])

  const markAsRead = React.useCallback(async (notification: NotificationResponse) => {
    if (notification.isRead) return

    try { await notificationsApi.markAsRead(notification.id) }
    catch (nextError) { if (active.current) setError(t('financeReview.notifications.failed')); throw nextError }
    if (!active.current) return
    ++listRequest.current; ++countRequest.current; setLoading(false)
    setNotifications((items) => items.map((item) => (
      item.id === notification.id
        ? { ...item, isRead: true, readAt: new Date().toISOString() }
        : item
    )))
    setUnreadCount((count) => Math.max(count - 1, 0))
    void refreshUnreadCount().catch(() => { if (active.current) setError(t('financeReview.notifications.failed')) })
  }, [active, refreshUnreadCount, t])

  const markAllAsRead = React.useCallback(async () => {
    try { await notificationsApi.markAllAsRead() }
    catch { if (active.current) setError(t('financeReview.notifications.failed')); return }
    if (!active.current) return
    ++listRequest.current; ++countRequest.current; setLoading(false)
    const readAt = new Date().toISOString()
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true, readAt })))
    setUnreadCount(0)
    void refreshUnreadCount().catch(() => { if (active.current) setError(t('financeReview.notifications.failed')) })
  }, [active, refreshUnreadCount, t])

  React.useEffect(() => {
    void refreshUnreadCount().catch(() => {
      if (active.current) setError(t('financeReview.notifications.failed'))
    })
  }, [active, location.key, refreshUnreadCount, t])

  React.useEffect(() => {
    const refresh = () => { if (document.visibilityState !== 'hidden') void refreshNotifications() }
    window.addEventListener('focus', refresh)
    window.addEventListener('finance-review-changed', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('finance-review-changed', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refreshNotifications])

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
