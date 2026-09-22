export type ApartmentWaterMeterResponse = {
  id: string
  apartmentId: string
  utilityType: string
  locationType: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateApartmentWaterMeterRequest = {
  utilityType: string
  locationType: string
  name: string
}

export type UpdateApartmentWaterMeterRequest = CreateApartmentWaterMeterRequest & {
  isActive: boolean
}

export type ApartmentWaterConfigurationZone = {
  locationType: string
  name: string
  coldWaterCount: number
  hotWaterCount: number
}

export type ApartmentWaterConfigurationResponse = {
  apartmentId: string
  hasBoiler: boolean
  coldWaterTotal: number
  hotWaterTotal: number
  zones: ApartmentWaterConfigurationZone[]
  meters: ApartmentWaterMeterResponse[]
}

export type UpdateApartmentWaterConfigurationRequest = {
  hasBoiler: boolean
  zones: ApartmentWaterConfigurationZone[]
}

export type WaterMeterReadingResponse = {
  id: string
  apartmentWaterMeterId: string
  apartmentId: string
  blockId: string
  year: number
  month: number
  value: number
  readingDate: string
  submittedAt: string
  submittedByType: string
  submittedByUserId: string | null
  submittedByAdminAccountId: string | null
  note: string | null
  meterUtilityType: string
  meterLocationType: string
  meterName: string
  apartmentNumber: string
  blockName: string
  staircaseName: string | null
}

export type CreateWaterMeterReadingRequest = {
  apartmentWaterMeterId: string
  year: number
  month: number
  value: number
  readingDate?: string | null
  residentId?: string | null
  note?: string | null
}

export type BlockWaterReadingSettingsResponse = {
  id: string
  blockId: string
  firstSubmissionDate: string | null
  monthlyDueDay: number
  isEnabled: boolean
  updatedAt: string
}

export type UpdateBlockWaterReadingSettingsRequest = {
  firstSubmissionDate?: string | null
  monthlyDueDay: number
  isEnabled: boolean
}

export type ResidentWaterMeterRow = {
  id: string
  meterId: string
  apartmentId: string
  apartmentNumber: string
  blockId: string
  blockName: string
  staircaseName: string | null
  utilityType: string
  locationType: string
  meterName: string
  year: number
  month: number
  value: number | null
  submittedAt: string | null
}

export type WaterConsumptionData = {
  hasMeters: boolean
  id: string
  apartment: { id: string, blockId: string, blockName: string, staircaseName: string | null, number: string }
  meters: Array<{
    id: string, name: string, utilityType: string, isActive: boolean,
    previous: number | null, current: number | null, usage: number | null,
  }>
  usage: number | null
  status: 'complete' | 'incomplete' | 'invalid' | 'noMeters'
}

export type WaterConsumptionRow = WaterConsumptionData & { canRemind: boolean, reminderSent: boolean }

export type WaterConsumptionReportResponse = {
  blocks: Array<{ id: string, name: string, firstReadingPeriod: number | null, firstSubmissionPeriod: number | null }>
  rows: WaterConsumptionRow[]
}
