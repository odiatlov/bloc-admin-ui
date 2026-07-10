import { apiGet } from './apiClient'
import type { MockAccount } from '../types/apartment'

export const mockLoginApi = {
  getAccounts: () => apiGet<MockAccount[]>('/mock-login/accounts'),
}
