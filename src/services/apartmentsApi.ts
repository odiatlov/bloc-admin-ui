import type { ApartmentResponse, CreateApartmentRequest, UpdateApartmentRequest } from '../types/management'
import { apiGet, apiPatch, apiPost } from './apiClient'

export const apartmentsApi = {
  getAll: () => apiGet<ApartmentResponse[]>('/apartments'),
  getByBlock: (blockId: string) => apiGet<ApartmentResponse[]>(`/blocks/${blockId}/apartments`),
  getByStaircase: (staircaseId: string) => apiGet<ApartmentResponse[]>(`/staircases/${staircaseId}/apartments`),
  create: (request: CreateApartmentRequest) =>
    apiPost<CreateApartmentRequest, ApartmentResponse>('/apartments', request),
  update: (id: string, request: UpdateApartmentRequest) =>
    apiPatch<UpdateApartmentRequest, ApartmentResponse>(`/apartments/${id}`, request),
}
