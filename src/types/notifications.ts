export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success'

export type NotificationResponse = {
  id: string
  recipientType: string
  type: string
  severity: NotificationSeverity
  relatedYear?: number | null
  relatedMonth?: number | null
  title: string
  message: string
  context?: string | null
  isRead: boolean
  createdAt: string
  readAt?: string | null
  actionUrl?: string | null
}
