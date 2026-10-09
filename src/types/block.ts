export type BlockOverviewDto = {
  id: string
  name: string
  displayName: string
  administratorName: string | null
  adminAccountId: string | null
  hasStaircases: boolean
  address: string | null
  createdAt: string
  apartmentCount: number
  residentCount: number
  staircaseCount: number
  totalInvoicesAmount: number
  totalPaymentsAmount: number
  unpaidBalance: number
}

export type BlockOverview = BlockOverviewDto

export type BlockDeletionSummary = {
  blockName: string
  staircaseCount: number
  apartmentCount: number
  waterMeterCount: number
  waterReadingCount: number
}

export type DeleteBlockRequest = {
  deleteWaterHistory: boolean
  expectedSummary: BlockDeletionSummary
}

export type CreateBlockRequest = {
  name: string
  apartmentCount: number
  residentCount: number
  hasStaircases: boolean
  staircaseCount: number
  address?: string
}

export type UpdateBlockRequest = CreateBlockRequest

export type SetupApartment = {
  number: string
  floor: number | null
  usableSqm: number | null
  setupStatus: 'configured' | 'unconfigured'
  hasBoiler: boolean
}

export type BlockSetupRequest = {
  requestId: string
  name: string
  address?: string
  hasStaircases: boolean
  staircases: { name: string; apartments: SetupApartment[] }[]
  apartments: SetupApartment[]
}

export type AssignBlockCensorRequest = {
  residentId: string
}

export type BlockRoleAssignmentResponse = {
  blockId: string
  residentId: string
  userId: string
  role: 'Censor'
}
