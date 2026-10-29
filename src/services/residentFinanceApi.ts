import { apiGet } from './apiClient'
import type { ResidentBillDetail, ResidentBillList, ResidentFinanceSummary } from '../types/finance'

export const residentFinanceApi = {
  summary: (signal?: AbortSignal) => apiGet<ResidentFinanceSummary>('/resident-finance/summary', signal),
  bills: (page: number, signal?: AbortSignal) => apiGet<ResidentBillList>(`/resident-finance/bills?pageNumber=${page}&pageSize=10`, signal),
  bill: (id: string, signal?: AbortSignal) => apiGet<ResidentBillDetail>(`/resident-finance/bills/${encodeURIComponent(id)}`, signal),
}
