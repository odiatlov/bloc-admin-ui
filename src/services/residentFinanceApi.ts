import { apiGet, apiPost } from './apiClient'
import type { ResidentBillDetail, ResidentBillList, ResidentBillSummary, ResidentFinanceSummary } from '../types/finance'

export const residentFinanceApi = {
  requestCash: (id: string) => apiPost<object, ResidentBillSummary>(`/resident-finance/bills/${encodeURIComponent(id)}/cash-request`, {}),
  summary: (signal?: AbortSignal) => apiGet<ResidentFinanceSummary>('/resident-finance/summary', signal),
  bills: (page: number, signal?: AbortSignal) => apiGet<ResidentBillList>(`/resident-finance/bills?pageNumber=${page}&pageSize=10`, signal),
  bill: (id: string, signal?: AbortSignal) => apiGet<ResidentBillDetail>(`/resident-finance/bills/${encodeURIComponent(id)}`, signal),
}
