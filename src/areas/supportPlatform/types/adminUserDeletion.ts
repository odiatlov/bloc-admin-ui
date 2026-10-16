export type DeletionCounts = {
  adminAccounts: number; blocks: number; staircases: number; apartments: number
  meters: number; readings: number; settings: number; memberships: number; assignments: number
  roles: number; managementLinks: number; residentProfiles: number; preservedResidentProfiles: number
  preservedUserAccounts: number; deletedInvitations: number; detachedInvitations: number
  deletedNotifications: number; detachedNotifications: number; detachedReadings: number
  detachedCreatorReferences: number; detachedResidentLogins: number
}
export type AdminUserDeletionPreview = {
  userId: string; email: string
  adminAccounts: { id: string; name: string }[]; blocks: { id: string; name: string }[]
  residents: { id: string; name: string; preserved: boolean; reasons: string[] }[]
  survivingBlockRoleEffects: { blockId: string; blockName: string; role: string }[]
  counts: DeletionCounts; expiresAt: string; confirmationToken: string; antiforgeryToken: string
  developmentSession: boolean
}
export type DeleteAdminUserRequest = {
  operationId: string; confirmationToken: string; confirmationEmail: string
  acknowledgePermanentDeletion: boolean; deleteWaterHistory: boolean
}
export type AdminUserDeletionResult = { operationId: string; userId: string; completedAt: string; counts: DeletionCounts }
export type DeletionOperationStatus = { status: 'unknown' | 'completed' | 'cancelled'; result: AdminUserDeletionResult | null }
