import type { CreateResidentRequest, ResidentResponse, UpdateResidentRequest } from '../types/management'
import { apiDelete, apiGet, apiPatch, apiPost } from './apiClient'

export const residentsApi = {
  getAll: () => apiGet<ResidentResponse[]>('/residents'),
  getById: (id: string) => apiGet<ResidentResponse>(`/residents/${id}`),
  create: (request: CreateResidentRequest) =>
    apiPost<CreateResidentRequest, ResidentResponse>('/residents', request),
  update: (id: string, request: UpdateResidentRequest) =>
    apiPatch<UpdateResidentRequest, ResidentResponse>(`/residents/${id}`, request),
  delete: (id: string) => apiDelete<string>(`/residents/${id}`),
}
