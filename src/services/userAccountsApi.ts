import { apiGet, apiPost } from './apiClient'

export type UserAccountResponse = {
  id: string
  displayName: string
  email: string
  status: string
}

export type CreateUserAccountRequest = {
  displayName: string
  email: string
}

export const userAccountsApi = {
  getAll: () => apiGet<UserAccountResponse[]>('/user-accounts'),
  create: (request: CreateUserAccountRequest) =>
    apiPost<CreateUserAccountRequest, UserAccountResponse>('/user-accounts', request),
}
