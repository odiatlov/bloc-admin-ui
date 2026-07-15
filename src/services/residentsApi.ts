import type { CreateResidentRequest, ResidentResponse, UpdateResidentProfileRequest, UpdateResidentRequest } from '../types/management'
import { apiDelete, apiGet, apiPatch, apiPost } from './apiClient'

export const residentsApi = {
  getAll: () => apiGet<ResidentResponse[]>('/residents'),
  getById: (id: string) => apiGet<ResidentResponse>(`/residents/${id}`),
  create: (request: CreateResidentRequest) =>
    apiPost<CreateResidentRequest, ResidentResponse>('/residents', request),
  update: (id: string, request: UpdateResidentRequest) =>
    apiPatch<UpdateResidentRequest, ResidentResponse>(`/residents/${id}`, request),
  updateProfile: (id: string, request: UpdateResidentProfileRequest) =>
    apiPatch<UpdateResidentProfileRequest, ResidentResponse>(`/residents/${id}/profile`, request),
  delete: (id: string) => apiDelete<string>(`/residents/${id}`),
}
