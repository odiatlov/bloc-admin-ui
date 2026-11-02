import type { CreatePersonRequest, PersonResponse, UpdatePersonProfileRequest, UpdatePersonRequest } from '../types/management'
import { apiDelete, apiGet, apiPatch, apiPost } from './apiClient'

export const personsApi = {
  getAll: () => apiGet<PersonResponse[]>('/persons'),
  getById: (id: string) => apiGet<PersonResponse>(`/persons/${id}`),
  create: (request: CreatePersonRequest) =>
    apiPost<CreatePersonRequest, PersonResponse>('/persons', request),
  update: (id: string, request: UpdatePersonRequest) =>
    apiPatch<UpdatePersonRequest, PersonResponse>(`/persons/${id}`, request),
  updateProfile: (id: string, request: UpdatePersonProfileRequest) =>
    apiPatch<UpdatePersonProfileRequest, PersonResponse>(`/persons/${id}/profile`, request),
  delete: (id: string) => apiDelete<string>(`/persons/${id}`),
  removeMany: (personIds: string[]) =>
    apiPost<{ personIds: string[] }, string[]>('/persons/remove', { personIds }),
  removeUnassigned: (personIds: string[]) =>
    apiPost<{ personIds: string[]; unassignedOnly: boolean }, string[]>('/persons/remove', { personIds, unassignedOnly: true }),
}
