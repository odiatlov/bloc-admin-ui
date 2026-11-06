import { apiGet, apiPost } from './apiClient'
import type { ResidentBillDetail, ResidentBillList, ResidentBillSummary, ResidentFinanceSummary } from '../types/finance'

export const residentFinanceApi = {
  requestCash: (id: string) => apiPost<object, ResidentBillSummary>(`/resident-finance/bills/${encodeURIComponent(id)}/cash-request`, {}),
  summary: (signal?: AbortSignal) => apiGet<ResidentFinanceSummary>('/resident-finance/summary', signal),
  periods: (signal?: AbortSignal) => apiGet<string[]>('/resident-finance/bills/periods', signal),
  bills: (page: number, period: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ pageNumber: String(page), pageSize: '10' })
    if (period) {
      const [year, month] = period.split('-')
      query.set('year', year)
      query.set('month', month)
    }
    return apiGet<ResidentBillList>(`/resident-finance/bills?${query}`, signal)
  },
  bill: (id: string, signal?: AbortSignal) => apiGet<ResidentBillDetail>(`/resident-finance/bills/${encodeURIComponent(id)}`, signal),
}
