import type { CreateStaircaseRequest, StaircaseResponse, UpdateStaircaseRequest } from '../types/management'
import { apiGet, apiPatch, apiPost } from './apiClient'

export const staircasesApi = {
  getAll: () => apiGet<StaircaseResponse[]>('/staircases'),
  getByBlock: (blockId: string) => apiGet<StaircaseResponse[]>(`/blocks/${blockId}/staircases`),
  create: (request: CreateStaircaseRequest) =>
    apiPost<CreateStaircaseRequest, StaircaseResponse>('/staircases', request),
  update: (id: string, request: UpdateStaircaseRequest) =>
    apiPatch<UpdateStaircaseRequest, StaircaseResponse>(`/staircases/${id}`, request),
}
