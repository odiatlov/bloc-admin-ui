export type BlockOverview = {
  id: string
  name: string
  displayName: string
  administratorName: string | null
  apartmentCount: number
  residentCount: number
  staircaseCount: number
  totalInvoicesAmount: number
  totalPaymentsAmount: number
  unpaidBalance: number
}
