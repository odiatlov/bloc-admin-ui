import { useCallback, useContext } from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { residentFinanceApi } from '../services/residentFinanceApi'
import { useFinanceRequest } from './useFinanceWorkspace'

function useResidentFinanceRequest<T>(scope: string, load: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const { role } = useContext(RoleContext)
  return useFinanceRequest(scope, load, enabled && role === 'Resident')
}

export const useResidentFinanceSummary = (enabled = true) => useResidentFinanceRequest('summary', residentFinanceApi.summary, enabled)
export const useResidentBillPeriods = () => useResidentFinanceRequest('bill-periods', residentFinanceApi.periods)
export const useResidentBills = (page: number, period: string, enabled = true) => {
  const load = useCallback((signal: AbortSignal) => residentFinanceApi.bills(page, period, signal), [page, period])
  return useResidentFinanceRequest(`bills:${period}:${page}`, load, enabled)
}
export const useResidentBill = (id: string | null) => {
  const load = useCallback((signal: AbortSignal) => residentFinanceApi.bill(id!, signal), [id])
  return useResidentFinanceRequest(`bill:${id}`, load, !!id)
}
