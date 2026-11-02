import type {
  ApartmentResidentResponse,
  CreateApartmentResidentRequest,
  UpdateApartmentResidentRequest,
} from '../types/management'
import { apiDelete, apiGet, apiPatch, apiPost } from './apiClient'

export const apartmentResidentsApi = {
  getByApartment: (apartmentId: string) =>
    apiGet<ApartmentResidentResponse[]>(`/apartments/${apartmentId}/persons`),
  create: (apartmentId: string, request: CreateApartmentResidentRequest) =>
    apiPost<CreateApartmentResidentRequest, ApartmentResidentResponse>(`/apartments/${apartmentId}/persons`, request),
  update: (apartmentId: string, linkId: string, request: UpdateApartmentResidentRequest) =>
    apiPatch<UpdateApartmentResidentRequest, ApartmentResidentResponse>(`/apartments/${apartmentId}/persons/${linkId}`, request),
  delete: (apartmentId: string, linkId: string) =>
    apiDelete<string>(`/apartments/${apartmentId}/persons/${linkId}`),
}
