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

export type CreateBlockRequest = {
  name: string
  apartmentCount: number
  residentCount: number
  hasStaircases: boolean
  staircaseCount: number
  address?: string
}

export type UpdateBlockRequest = CreateBlockRequest
