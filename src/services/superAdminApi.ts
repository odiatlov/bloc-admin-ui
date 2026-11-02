import { apiGet, apiPost } from './apiClient'
import { withPlatformDeletionSession } from './developmentPlatformSession'
import type { BlockOverviewDto, BlockSetupRequest, BlockSetupResponse, CreateBlockRequest } from '../types/block'
import type { PersonResponse } from '../types/management'
import type { AdminUserDeletionPreview, AdminUserDeletionResult, DeleteAdminUserRequest, DeletionOperationStatus } from '../areas/supportPlatform/types/adminUserDeletion'

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

export type SuperAdminBlockApartmentFiltersResponse = {
  blockId: string
  blockName: string
  hasStaircases: boolean
  staircases: { id: string; name: string }[]
  floors: { staircaseId: string | null; floor: number | null }[]
}

export type CreateSuperAdminAdminAccountRequest = {
  ownerName: string
  ownerEmail: string
  blockId?: string | null
}

export type SuperAdminPersonResponse = {
  userId?: string
  personId?: string
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

const postPlatformCommand = <TResponse, TRequest = DeleteAdminUserRequest>(path: string, request: TRequest) =>
  withPlatformDeletionSession(async (options) => {
    const session = await apiGet<{ antiforgeryToken: string }>('/super-admin/deletion-session', undefined, options)
    return apiPost<TRequest, TResponse>(path, request,
      { ...options, headers: { ...options.headers, 'X-CSRF-TOKEN': session.antiforgeryToken } })
  })

export const superAdminApi = {
  getAdminPersons: (adminId: string) => withPlatformDeletionSession(options =>
    apiGet<PersonResponse[]>(`/super-admin/admin-accounts/${adminId}/persons`, undefined, options)),
  createBlockForAdmin: (adminId: string, requestId: string, block: CreateBlockRequest) =>
    postPlatformCommand<BlockOverviewDto, { requestId: string; block: CreateBlockRequest }>(`/super-admin/admin-accounts/${adminId}/blocks`, { requestId, block }),
  createBlockSetupForAdmin: (adminId: string, request: BlockSetupRequest) =>
    postPlatformCommand<BlockSetupResponse, BlockSetupRequest>(`/super-admin/admin-accounts/${adminId}/blocks/setup`, request),
  createPersonForAdmin: (adminId: string, request: SuperAdminPersonCreateRequest) =>
    postPlatformCommand<PersonResponse, SuperAdminPersonCreateRequest>(`/super-admin/admin-accounts/${adminId}/persons`, request),
  deleteUnlinkedPerson: (personId: string) =>
    postPlatformCommand<string, Record<string, never>>(`/super-admin/persons/${personId}/delete-unlinked-profile`, {}),
  getDeletionPreview: (userId: string, signal?: AbortSignal, userOnly = false) =>
    withPlatformDeletionSession((options) => apiGet<AdminUserDeletionPreview>(`/super-admin/users/${userId}/deletion-preview${userOnly ? '?userOnly=true' : ''}`, signal, options)),
  deleteUserAndManagedData: (userId: string, request: DeleteAdminUserRequest) =>
    postPlatformCommand<AdminUserDeletionResult>(`/super-admin/users/${userId}/delete-managed-data`, request),
  getDeletionOperation: (operationId: string) =>
    withPlatformDeletionSession((options) => apiGet<DeletionOperationStatus>(`/super-admin/deletion-operations/${operationId}`, undefined, options)),
  resolveDeletionOperation: (userId: string, request: DeleteAdminUserRequest) =>
    postPlatformCommand<DeletionOperationStatus>(`/super-admin/users/${userId}/resolve-deletion`, request),
  getUserFilters: (signal?: AbortSignal) => apiGet<SuperAdminUserFiltersResponse>('/super-admin/users/filters', signal),
  getDashboard: () => apiGet<SuperAdminDashboardResponse>('/super-admin/dashboard'),
  getAdminAccounts: () => apiGet<SuperAdminAdminAccountResponse[]>('/super-admin/admin-accounts'),
  createAdminAccount: (request: CreateSuperAdminAdminAccountRequest) =>
    apiPost<CreateSuperAdminAdminAccountRequest, SuperAdminAdminAccountResponse>('/super-admin/admin-accounts', request),
  getBlocks: () => apiGet<SuperAdminBlockResponse[]>('/super-admin/blocks'),
  getBlockApartmentFilters: (blockId: string, signal?: AbortSignal) =>
    apiGet<SuperAdminBlockApartmentFiltersResponse>(`/super-admin/blocks/${blockId}/apartments/filters`, signal),
  getPersons: () => apiGet<SuperAdminPersonResponse[]>('/super-admin/persons'),
  getAdminInvitations: () => apiGet<SuperAdminInvitationResponse[]>('/super-admin/admin-invitations'),
}

export type UserBlockAssociation = { blockId: string; blockName: string }
export type SuperAdminPersonCreateRequest = {
  requestId: string; existingPersonId?: string
  firstName: string; lastName: string; phone?: string; email?: string; invitePerson: boolean
}
export type UserRoleAssociation = UserBlockAssociation & {
  roleId: string; role: string; status: string; createdAt: string
  endedAt?: string | null; suspendedAt?: string | null; suspensionReason?: string | null
}
export type UserAdminAssociation = {
  adminAccountId: string; displayName: string; status: string; subscriptionStatus: string
  blocks: UserBlockAssociation[]
}
export type UserApartmentAssociation = UserBlockAssociation & {
  apartmentId: string; apartmentNumber: string; staircaseName?: string | null; livesHere: boolean
}
export type SuperAdminUserResponse = {
  userId: string; displayName: string; email: string; status: string; createdAt: string
  personId?: string | null; personName?: string | null; personStatus?: string | null
  personEmail?: string | null; phone?: string | null
  roles: UserRoleAssociation[]; adminAccounts: UserAdminAssociation[]
  personBlocks: UserBlockAssociation[]; apartments: UserApartmentAssociation[]
}
export type SuperAdminUserFiltersResponse = { blocks: UserBlockAssociation[]; statuses: string[] }
