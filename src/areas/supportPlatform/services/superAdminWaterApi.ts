import { apiGet } from '../../../services/apiClient'
import type { ApartmentMeterHistory, WaterConsumptionReportResponse, WaterConsumptionData } from '../../../types/waterReadings'

export type WaterAdministrator = { id: string, name: string }
export type SuperAdminConsumptionReport = { blocks: WaterConsumptionReportResponse['blocks'], rows: WaterConsumptionData[] }

export const superAdminWaterApi = {
  administrators: () => apiGet<WaterAdministrator[]>('/super-admin/water/administrators'),
  consumption: (period: string, admin: string, block: string) => {
    const [year, month] = period.split('-')
    const query = new URLSearchParams({ year, month })
    if (admin === 'unassigned') query.set('unassigned', 'true')
    else if (admin !== 'all') query.set('adminAccountId', admin)
    if (block !== 'all') query.set('blockId', block)
    return apiGet<SuperAdminConsumptionReport>(`/super-admin/water/consumptions?${query}`)
  },
  history: (apartmentId: string, signal?: AbortSignal) => apiGet<ApartmentMeterHistory>(`/super-admin/water/apartments/${encodeURIComponent(apartmentId)}/meters`, signal),
}
