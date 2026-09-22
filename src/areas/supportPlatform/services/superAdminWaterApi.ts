import { apiGet } from '../../../services/apiClient'
import type { WaterConsumptionReportResponse, WaterConsumptionData } from '../../../types/waterReadings'

export type WaterAdministrator = { id: string, name: string }
export type IndexReading = { id: string, year: number, month: number, value: number, submittedAt: string, submittedBy: string | null }
export type MeterHistory = { id: string, name: string, utilityType: string, isActive: boolean, readings: IndexReading[] }
export type ApartmentMeterHistory = { apartment: WaterConsumptionData['apartment'], meters: MeterHistory[] }
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
  history: (apartmentId: string) => apiGet<ApartmentMeterHistory>(`/super-admin/water/apartments/${encodeURIComponent(apartmentId)}/meters`),
}
