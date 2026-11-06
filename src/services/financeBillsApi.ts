import { apiGet, apiPost } from './apiClient'
import type { ResidentBillSummary } from '../types/finance'

export type FinanceBillItem = { bill: ResidentBillSummary; residentName?: string | null }
export type FinanceBillList = { items: FinanceBillItem[]; totalCount: number; pageNumber: number; pageSize: number }

type BillScope = { blockId: string; staircaseId: string }
type Filters = BillScope & { year?: number; month?: number; search: string; requestsOnly: boolean; pageNumber: number }

const query = (params: Record<string, string | number | boolean | undefined>) =>
  new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => [key, String(value)]))

export const financeBillsApi = {
  list: (filters: Filters, signal?: AbortSignal) => apiGet<FinanceBillList>(`/finance/bills?${query(filters)}`, signal),
  periods: (scope: BillScope, signal?: AbortSignal) => apiGet<string[]>(`/finance/bills/periods?${query(scope)}`, signal),
  recordCash: (billId: string, receivedOn: string) => apiPost<{ receivedOn: string }, ResidentBillSummary>(
    `/finance/bills/${encodeURIComponent(billId)}/cash-payment`, { receivedOn }),
  remind: (billId: string) => apiPost<object, boolean>(`/finance/bills/${encodeURIComponent(billId)}/reminder`, {}),
}
