import type {
  ApartmentResidentResponse,
  CreateApartmentResidentRequest,
  UpdateApartmentResidentRequest,
} from '../types/management'
import { apiDelete, apiGet, apiPatch, apiPost } from './apiClient'

export const apartmentResidentsApi = {
  getByApartment: (apartmentId: string) =>
    apiGet<ApartmentResidentResponse[]>(`/apartments/${apartmentId}/residents`),
  create: (apartmentId: string, request: CreateApartmentResidentRequest) =>
    apiPost<CreateApartmentResidentRequest, ApartmentResidentResponse>(`/apartments/${apartmentId}/residents`, request),
  update: (apartmentId: string, linkId: string, request: UpdateApartmentResidentRequest) =>
    apiPatch<UpdateApartmentResidentRequest, ApartmentResidentResponse>(`/apartments/${apartmentId}/residents/${linkId}`, request),
  delete: (apartmentId: string, linkId: string) =>
    apiDelete<string>(`/apartments/${apartmentId}/residents/${linkId}`),
}
