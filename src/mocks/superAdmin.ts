import { administrators, buildingAdminAssignments } from './administration'
import { apartments, blocks, staircases } from './blocks'
import { residentApartments, residents } from './residents'
import type { ResidentAccountStatus } from '../types/apartment'

export type SuperAdminMetricKey =
  | 'totalBlocks'
  | 'totalAdmins'
  | 'totalResidents'
  | 'totalCensors'
  | 'pendingAdminInvites'
  | 'blocksWithoutAdmin'

export type SuperAdminStats = Record<SuperAdminMetricKey, number>

export type AdminInviteStatus = 'active' | 'invited' | 'no_block'

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

const activeAdminAssignments = buildingAdminAssignments.filter((assignment) => assignment.isActive)

const getAdminName = (adminId?: string) =>
  administrators.find((administrator) => administrator.id === adminId)?.name

const getBlockName = (blockId?: string) => {
  const block = blocks.find((item) => item.id === blockId)
  return block ? `Block ${block.name}` : undefined
}

const assignedAdminRows: PlatformAdminRow[] = activeAdminAssignments.map((assignment) => {
  const administrator = administrators.find((item) => item.id === assignment.adminId)
  const block = blocks.find((item) => item.id === assignment.blockId)

  return {
    id: assignment.id,
    name: administrator?.name ?? 'Unassigned administrator',
    email: administrator?.email ?? 'not-available@example.com',
    assignedBlockId: block?.id,
    assignedBlockName: block ? `Block ${block.name}` : undefined,
    status: 'active',
    createdAt: assignment.startDate,
    isActive: true,
  }
})

export const mockAdminInvites: PlatformAdminRow[] = [
  ...assignedAdminRows,
  {
    id: '50000000-0000-0000-0000-000000000001',
    name: 'Radu Matei',
    email: 'radu.matei@example.com',
    assignedBlockId: 'block-b',
    assignedBlockName: 'Block B',
    status: 'invited',
    createdAt: '2026-06-18',
    lastInviteSentAt: '2026-07-01',
    isActive: true,
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    name: 'Diana Ilie',
    email: 'diana.ilie@example.com',
    status: 'no_block',
    createdAt: '2026-06-25',
    lastInviteSentAt: '2026-06-25',
    isActive: true,
  },
]

export const mockSuperAdminStats: SuperAdminStats = {
  totalBlocks: blocks.length,
  totalAdmins: administrators.filter((administrator) => administrator.role === 'Admin').length,
  totalResidents: residents.length,
  totalCensors: 1,
  pendingAdminInvites: mockAdminInvites.filter((administrator) => administrator.status === 'invited').length,
  blocksWithoutAdmin: blocks.filter((block) => !activeAdminAssignments.some((assignment) => assignment.blockId === block.id)).length,
}

export const mockPlatformActivity: PlatformActivity[] = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    titleKey: 'superAdmin.dashboard.activity.inviteSent',
    descriptionKey: 'superAdmin.dashboard.activity.inviteSentDescription',
    createdAt: '2026-07-09',
  },
  {
    id: '60000000-0000-0000-0000-000000000002',
    titleKey: 'superAdmin.dashboard.activity.blockConfigured',
    descriptionKey: 'superAdmin.dashboard.activity.blockConfiguredDescription',
    createdAt: '2026-07-07',
  },
  {
    id: '60000000-0000-0000-0000-000000000003',
    titleKey: 'superAdmin.dashboard.activity.exportGenerated',
    descriptionKey: 'superAdmin.dashboard.activity.exportGeneratedDescription',
    createdAt: '2026-07-05',
  },
]

export const mockPlatformBlocks: PlatformBlockRow[] = blocks.map((block, index) => {
  const blockApartments = apartments.filter((apartment) => apartment.blockId === block.id)
  const blockApartmentIds = new Set(blockApartments.map((apartment) => apartment.id))
  const residentIds = new Set(
    residentApartments
      .filter((residentApartment) => blockApartmentIds.has(residentApartment.apartmentId))
      .map((residentApartment) => residentApartment.residentId),
  )

  return {
    id: block.id,
    name: `Block ${block.name}`,
    address: block.address ?? '-',
    activeAdmin: getAdminName(block.activeAdminId) ?? '-',
    censor: index === 0 ? 'Popescu G' : '-',
    apartmentsCount: blockApartments.length,
    staircasesCount: staircases.filter((staircase) => staircase.blockId === block.id).length,
    residentsCount: residentIds.size,
    createdAt: ['2025-01-01', '2026-02-01', '2025-05-01', '2026-05-01'][index] ?? '2026-01-01',
  }
})

export const mockPlatformUsers: PlatformResidentRow[] = residents.map((resident) => {
  const residentApartment = residentApartments.find((item) => item.residentId === resident.id)
  const apartment = apartments.find((item) => item.id === residentApartment?.apartmentId)
  const block = blocks.find((item) => item.id === apartment?.blockId)

  return {
    id: resident.id,
    name: resident.name,
    email: resident.email ?? '-',
    phone: resident.phone ?? '-',
    block: getBlockName(block?.id) ?? '-',
    apartment: apartment ? apartment.number : '-',
    accountStatus: resident.accountStatus,
    blockRole: resident.id === 'R-NEW-BLOCK' ? 'Censor' : 'Resident',
  }
})

export const mockExportHistory: PlatformExportHistoryRow[] = [
  {
    id: '70000000-0000-0000-0000-000000000001',
    exportType: 'residents',
    requestedBy: 'SuperAdmin',
    blockId: 'block-a',
    blockName: 'Block A',
    format: 'csv',
    status: 'completed',
    createdAt: '2026-07-09',
  },
  {
    id: '70000000-0000-0000-0000-000000000002',
    exportType: 'finance_summary',
    requestedBy: 'BlocAdmin Support Team',
    format: 'json',
    status: 'completed',
    createdAt: '2026-07-04',
  },
  {
    id: '70000000-0000-0000-0000-000000000003',
    exportType: 'blocks',
    requestedBy: 'SuperAdmin',
    blockId: 'block-c',
    blockName: 'Block C',
    format: 'csv',
    status: 'completed',
    createdAt: '2026-06-28',
  },
]
