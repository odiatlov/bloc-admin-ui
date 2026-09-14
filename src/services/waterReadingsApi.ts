import type {
  ApartmentWaterMeterResponse,
  ApartmentWaterConfigurationResponse,
  CreateApartmentWaterMeterRequest,
  CreateWaterMeterReadingRequest,
  BlockWaterReadingSettingsResponse,
  UpdateApartmentWaterConfigurationRequest,
  UpdateApartmentWaterMeterRequest,
  UpdateBlockWaterReadingSettingsRequest,
  WaterMeterReadingResponse,
} from '../types/waterReadings'
import { apiDelete, apiGet, apiPost, apiPut } from './apiClient'

export const waterReadingsApi = {
  getMetersByApartment: (apartmentId: string) =>
    apiGet<ApartmentWaterMeterResponse[]>(`/apartments/${apartmentId}/water-meters`),
  getApartmentConfiguration: (apartmentId: string) =>
    apiGet<ApartmentWaterConfigurationResponse>(`/apartments/${apartmentId}/water-meters/configuration`),
  updateApartmentConfiguration: (apartmentId: string, request: UpdateApartmentWaterConfigurationRequest) =>
    apiPut<UpdateApartmentWaterConfigurationRequest, ApartmentWaterConfigurationResponse>(`/apartments/${apartmentId}/water-meters/configuration`, request),
  createMeter: (apartmentId: string, request: CreateApartmentWaterMeterRequest) =>
    apiPost<CreateApartmentWaterMeterRequest, ApartmentWaterMeterResponse>(`/apartments/${apartmentId}/water-meters`, request),
  updateMeter: (meterId: string, request: UpdateApartmentWaterMeterRequest) =>
    apiPut<UpdateApartmentWaterMeterRequest, ApartmentWaterMeterResponse>(`/water-meters/${meterId}`, request),
  deactivateMeter: (meterId: string) => apiDelete<string>(`/water-meters/${meterId}`),
  getBlockSettings: (blockId: string) =>
    apiGet<BlockWaterReadingSettingsResponse>(`/blocks/${blockId}/water-reading-settings`),
  updateBlockSettings: (blockId: string, request: UpdateBlockWaterReadingSettingsRequest) =>
    apiPut<UpdateBlockWaterReadingSettingsRequest, BlockWaterReadingSettingsResponse>(`/blocks/${blockId}/water-reading-settings`, request),
  getReadingsByBlock: (blockId: string, year: number, month: number) =>
    apiGet<WaterMeterReadingResponse[]>(`/blocks/${blockId}/water-readings?year=${year}&month=${month}`),
  createReading: (request: CreateWaterMeterReadingRequest) =>
    apiPost<CreateWaterMeterReadingRequest, WaterMeterReadingResponse>('/water-readings', request),
}
