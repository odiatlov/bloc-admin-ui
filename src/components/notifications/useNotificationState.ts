import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFinanceActionScope } from '../../hooks/useFinanceWorkspace'
import type { NotificationResponse, NotificationSource } from '../../types/notifications'

// One instance per authenticated identity. A null source keeps the platform UI disconnected.
export const useNotificationState = (source: NotificationSource | null) => {
  const active = useFinanceActionScope()
  const location = useLocation()
  const { t } = useTranslation()
  const [notifications, setNotifications] = React.useState<NotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const listRequest = React.useRef(0)
  const countRequest = React.useRef(0)
  const countFlight = React.useRef<Promise<number> | null>(null)
  const listFlight = React.useRef<Promise<void> | null>(null)

  const readUnreadCount = React.useCallback(() => {
    if (!source) throw new Error('No notification source is configured')
    if (countFlight.current) return countFlight.current
    const pending = source.getUnreadCount()
    countFlight.current = pending
    void pending.finally(() => { if (countFlight.current === pending) countFlight.current = null }).catch(() => {})
    return pending
  }, [source])

  const refreshUnreadCount = React.useCallback(async () => {
    if (!source) return
    const request = ++countRequest.current
    try {
      const count = await readUnreadCount()
      if (active.current && request === countRequest.current) setUnreadCount(count)
    } catch (nextError) {
      if (active.current && request === countRequest.current) throw nextError
    }
  }, [active, readUnreadCount, source])

  const refreshNotifications = React.useCallback((): Promise<void> => {
    if (!source) return Promise.resolve()
    if (listFlight.current) return listFlight.current
    const request = ++listRequest.current
    const countVersion = ++countRequest.current
    setLoading(true)
    setError(null)
    const pending = Promise.all([source.getAll(), readUnreadCount()])
      .then(([items, count]) => {
        if (active.current && request === listRequest.current) setNotifications(items)
        if (active.current && countVersion === countRequest.current) setUnreadCount(count)
      })
      .catch((nextError: unknown) => {
        if (active.current && request === listRequest.current)
          setError(nextError instanceof Error ? nextError.message : t('financeReview.notifications.failed'))
      })
      .finally(() => {
        if (active.current && request === listRequest.current) setLoading(false)
        if (listFlight.current === pending) listFlight.current = null
      })
    listFlight.current = pending
    return pending
  }, [active, readUnreadCount, source, t])

  const markAsRead = React.useCallback(async (notification: NotificationResponse) => {
    if (!source || notification.isRead) return
    try { await source.markAsRead(notification.id) }
    catch (nextError) { if (active.current) setError(t('financeReview.notifications.failed')); throw nextError }
    if (!active.current) return
    ++listRequest.current; ++countRequest.current
    countFlight.current = null; listFlight.current = null
    setLoading(false)
    setNotifications(items => items.map(item => item.id === notification.id
      ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
    setUnreadCount(count => Math.max(count - 1, 0))
    void refreshUnreadCount().catch(() => { if (active.current) setError(t('financeReview.notifications.failed')) })
  }, [active, refreshUnreadCount, source, t])

  const markAllAsRead = React.useCallback(async () => {
    if (!source) return
    try { await source.markAllAsRead() }
    catch { if (active.current) setError(t('financeReview.notifications.failed')); return }
    if (!active.current) return
    ++listRequest.current; ++countRequest.current
    countFlight.current = null; listFlight.current = null
    setLoading(false)
    const readAt = new Date().toISOString()
    setNotifications(items => items.map(item => ({ ...item, isRead: true, readAt })))
    setUnreadCount(0)
    void refreshUnreadCount().catch(() => { if (active.current) setError(t('financeReview.notifications.failed')) })
  }, [active, refreshUnreadCount, source, t])

  React.useEffect(() => {
    if (!source) return
    let current = true
    // Coalesce StrictMode's initial effect replay before issuing the first request.
    queueMicrotask(() => {
      if (current) void refreshUnreadCount().catch(() => { if (active.current) setError(t('financeReview.notifications.failed')) })
    })
    return () => { current = false }
  }, [active, location.key, refreshUnreadCount, source, t])

  React.useEffect(() => {
    if (!source) return
    const refresh = () => { if (document.visibilityState !== 'hidden') void refreshNotifications() }
    window.addEventListener('focus', refresh)
    window.addEventListener('finance-review-changed', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('finance-review-changed', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refreshNotifications, source])

  return { error, loading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount }
}
