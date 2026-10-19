import { ApiError, apiGet, apiPost, apiPut } from './apiClient'
import type { FinanceBlock, FinanceConfiguration, FinanceExportFormat, FinancePeriodData, FinanceReportSummary, FinanceWorkspace, MaintenanceReport } from '../types/finance'

const blockPath = (blockId: string) => `/finance/blocks/${encodeURIComponent(blockId)}`
export const financeApi = {
  blocks: (signal?: AbortSignal) => apiGet<FinanceBlock[]>('/finance/blocks', signal),
  workspace: (blockId: string, year: number, month: number, signal?: AbortSignal) => apiGet<FinanceWorkspace>(`${blockPath(blockId)}/workspace?year=${year}&month=${month}`, signal),
  saveConfiguration: (blockId: string, expectedVersion: number, configuration: FinanceConfiguration) => apiPut<{ expectedVersion: number; configuration: FinanceConfiguration }, { version: number; configuration: FinanceConfiguration }>(`${blockPath(blockId)}/configuration`, { expectedVersion, configuration }),
  savePeriod: (blockId: string, year: number, month: number, expectedVersion: number, data: FinancePeriodData) => apiPut<{ expectedVersion: number; data: FinancePeriodData }, { version: number; data: FinancePeriodData }>(`${blockPath(blockId)}/periods/${year}/${month}`, { expectedVersion, data }),
  generate: (blockId: string, year: number, month: number, requestId: string, expectedInputVersion: string) => apiPost<{ requestId: string; expectedInputVersion: string }, MaintenanceReport>(`${blockPath(blockId)}/periods/${year}/${month}/generate`, { requestId, expectedInputVersion }),
  reports: (params: { blockId?: string; year?: number; month?: number; includeHistory?: boolean; pageNumber?: number }, signal?: AbortSignal) => {
    const query = new URLSearchParams({ pageSize: '10' })
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)) })
    return apiGet<{ items: FinanceReportSummary[]; totalCount: number; pageNumber: number; pageSize: number }>(`/finance/reports?${query}`, signal)
  },
  report: (id: string, signal?: AbortSignal) => apiGet<MaintenanceReport>(`/finance/reports/${encodeURIComponent(id)}`, signal),
  export: async (id: string, language: string, format: FinanceExportFormat = 'detailed') => {
    const token = localStorage.getItem('mockJwt')
    const query = new URLSearchParams({ language, format })
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api'}/finance/reports/${encodeURIComponent(id)}/export?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!response.ok || !response.headers.get('Content-Type')?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      const payload = await response.json().catch(() => null)
      throw new ApiError(payload?.message ?? 'Excel export failed', response.status)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    const disposition = response.headers.get('Content-Disposition') ?? ''
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    anchor.download = encoded ? decodeURIComponent(encoded) : disposition.match(/filename="?([^";]+)/i)?.[1] ?? `maintenance-${format}-${id}.xlsx`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}
