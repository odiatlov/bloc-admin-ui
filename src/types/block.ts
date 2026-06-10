export type BlockRecord = {
  id: string
  name: string
  address?: string
  createdAt: string
  activeAdminName?: string
  apartmentCount: number
  residentCount: number
  staircaseCount: number
  totalInvoices: number
  totalPayments: number
  unpaidBalance: number
}
