export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success'

export type NotificationResponse = {
  id: string
  recipientType: string
  type: string
  severity: NotificationSeverity
  title: string
  message: string
  context?: string | null
  isRead: boolean
  createdAt: string
  readAt?: string | null
  actionUrl?: string | null
}
