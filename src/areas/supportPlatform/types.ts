import type { ResidentAccountStatus } from '../../types/apartment'

export type SuperAdminMetricKey =
  | 'totalBlocks'
  | 'totalUsers'
  | 'totalAdmins'
  | 'totalResidents'
  | 'totalCensors'
  | 'pendingAdminInvites'
  | 'suspendedAdminAccounts'
  | 'blocksWithoutAdmin'

export type SuperAdminStats = Record<SuperAdminMetricKey, number>

export type AdminInviteStatus = 'active' | 'invited' | 'suspended' | 'past_due' | 'cancelled' | 'expired' | 'no_block'

export type PlatformAdminRow = {
  id: string
  name: string
  email: string
  assignedBlockId?: string
  assignedBlockName?: string
  status: AdminInviteStatus
  createdAt: string
  lastInviteSentAt?: string
  isActive: boolean
}

export type PlatformActivity = {
  id: string
  titleKey: string
  descriptionKey: string
  createdAt: string
}

export type PlatformBlockRow = {
  id: string
  name: string
  address: string
  activeAdmin: string
  censor: string
  apartmentsCount: number
  staircasesCount: number
  residentsCount: number
  createdAt: string
}

export type PlatformResidentRow = {
  id: string
  name: string
  email: string
  phone: string
  block: string
  apartment: string
  accountStatus: ResidentAccountStatus
  blockRole: 'Resident' | 'Admin' | 'Censor'
}

export type ExportType = 'all_data' | 'blocks' | 'residents' | 'apartments' | 'finance_summary'
export type ExportFormat = 'csv' | 'json'
export type ExportStatus = 'completed' | 'processing' | 'failed'

export type PlatformExportHistoryRow = {
  id: string
  exportType: ExportType
  requestedBy: string
  blockId?: string
  blockName?: string
  format: ExportFormat
  status: ExportStatus
  createdAt: string
}
