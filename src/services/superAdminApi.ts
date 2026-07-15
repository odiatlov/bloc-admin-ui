import { apiGet, apiPost } from './apiClient'

export type SuperAdminDashboardResponse = {
  totalBlocks: number
  totalUsers: number
  totalAdmins: number
  totalResidents: number
  totalCensors: number
  pendingAdminInvites: number
  suspendedAdminAccounts: number
  blocksWithoutAdmin: number
}

export type SuperAdminAdminAccountResponse = {
  adminAccountId: string
  ownerUserId: string
  ownerName: string
  ownerEmail: string
  status: string
  subscriptionStatus: string
  assignedBlocks: string[]
  createdAt: string
  suspendedAt?: string
  deletionScheduledAt?: string
}

export type SuperAdminBlockResponse = {
  blockId: string
  blockName: string
  address: string
  adminAccountId?: string
  adminAccountName?: string
  censorName?: string
  apartmentCount: number
  staircaseCount: number
  residentCount: number
  createdAt: string
  adminAccountStatus?: string
  subscriptionStatus?: string
}

export type CreateSuperAdminAdminAccountRequest = {
  ownerName: string
  ownerEmail: string
  blockId?: string | null
}

export type SuperAdminResidentResponse = {
  userId?: string
  residentId?: string
  displayName: string
  email: string
  phone?: string
  blockName?: string
  apartmentNumber?: string
  role: 'Resident' | 'Admin' | 'Censor'
  accountStatus: string
  membershipStatus: string
}

export type SuperAdminInvitationResponse = {
  invitationId: string
  inviteeName: string
  email: string
  status: string
  blockName?: string
  adminAccountName?: string
  createdAt: string
  lastSentAt?: string
  acceptedAt?: string
}

export const superAdminApi = {
  getDashboard: () => apiGet<SuperAdminDashboardResponse>('/super-admin/dashboard'),
  getAdminAccounts: () => apiGet<SuperAdminAdminAccountResponse[]>('/super-admin/admin-accounts'),
  createAdminAccount: (request: CreateSuperAdminAdminAccountRequest) =>
    apiPost<CreateSuperAdminAdminAccountRequest, SuperAdminAdminAccountResponse>('/super-admin/admin-accounts', request),
  getBlocks: () => apiGet<SuperAdminBlockResponse[]>('/super-admin/blocks'),
  getResidents: () => apiGet<SuperAdminResidentResponse[]>('/super-admin/residents'),
  getAdminInvitations: () => apiGet<SuperAdminInvitationResponse[]>('/super-admin/admin-invitations'),
}
