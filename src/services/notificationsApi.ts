import type { NotificationResponse } from '../types/notifications'
import { apiGet, apiPut } from './apiClient'

export const notificationsApi = {
  getAll: () => apiGet<NotificationResponse[]>('/notifications'),
  getUnreadCount: () => apiGet<number>('/notifications/unread-count'),
  markAsRead: (id: string) => apiPut<Record<string, never>, string>(`/notifications/${id}/read`, {}),
  markAllAsRead: () => apiPut<Record<string, never>, boolean>('/notifications/read-all', {}),
}
