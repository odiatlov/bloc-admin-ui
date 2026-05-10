export type ResidentStatus = 'active' | 'inactive'
export type FinancialStatus = 'current' | 'due' | 'overdue'
export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue'
export type PaymentMethod = 'cash' | 'bank'
export type VerificationStatus = 'unverified' | 'verified' | 'deposited'
export type AnomalyLevel = 'normal' | 'warning' | 'critical'
export type UtilityCategory = 'gas' | 'electricity' | 'garbage' | 'water' | 'heating'

export type Block = {
  id: string
  name: string
  hasStaircases: boolean
}

export type Staircase = {
  id: string
  blockId: string
  name: string
}

export type Apartment = {
  id: string
  blockId: string
  staircaseId?: string
  floor: number
  number: string
  familyName: string
  primaryOwnerId: string
}

export type Resident = {
  id: string
  apartmentId: string
  name: string
  status: ResidentStatus
  email: string
}

export type Invoice = {
  id: string
  apartmentId: string
  month: string
  dueDate: string
}

export type Payment = {
  id: string
  invoiceId: string
  apartmentId: string
  amount: number
  method: PaymentMethod
  timestamp: string
  verificationStatus: VerificationStatus
}

export type CashPayment = {
  id: string
  apartmentId: string
  invoiceId?: string
  amount: number
  registeredBy: string
  status: VerificationStatus
  timestamp: string
  notesKey: string
}

export type UtilityMonthlyInput = {
  id: string
  blockId: string
  month: string
  category: UtilityCategory
  amount: number
}

export type AdminExpense = {
  id: string
  blockId: string
  month: string
  labelKey: string
  amount: number
}

export type UtilityAllocationResult = {
  apartmentId: string
  category: UtilityCategory
  amount: number
}

export type WaterReading = {
  id: string
  residentId: string
  apartmentId: string
  month: string
  previousValue: number
  currentValue: number
}

export type HeatingReading = {
  id: string
  residentId: string
  apartmentId: string
  month: string
  previousValue: number
  currentValue: number
}

export const blocks: Block[] = [
  { id: 'block-a', name: 'A', hasStaircases: true },
  { id: 'block-b', name: 'B', hasStaircases: false },
  { id: 'block-c', name: 'C', hasStaircases: true },
]

export const staircases: Staircase[] = [
  { id: 'stair-a-1', blockId: 'block-a', name: '1' },
  { id: 'stair-a-2', blockId: 'block-a', name: '2' },
  { id: 'stair-c-1', blockId: 'block-c', name: '1' },
  { id: 'stair-c-2', blockId: 'block-c', name: '2' },
]

export const apartments: Apartment[] = [
  { id: 'apt-a-12', blockId: 'block-a', staircaseId: 'stair-a-1', floor: 1, number: '12', familyName: 'Popescu', primaryOwnerId: 'R-1001' },
  { id: 'apt-a-18', blockId: 'block-a', staircaseId: 'stair-a-2', floor: 2, number: '18', familyName: 'Ionescu', primaryOwnerId: 'R-1003' },
  { id: 'apt-b-41', blockId: 'block-b', floor: 4, number: '41', familyName: 'Marinescu', primaryOwnerId: 'R-1005' },
  { id: 'apt-c-72', blockId: 'block-c', staircaseId: 'stair-c-2', floor: 7, number: '72', familyName: 'Stan', primaryOwnerId: 'R-1006' },
]

export const residents: Resident[] = [
  { id: 'R-1001', name: 'Ana Popescu', apartmentId: 'apt-a-12', status: 'active', email: 'ana.popescu@example.com' },
  { id: 'R-1002', name: 'Ion Popescu', apartmentId: 'apt-a-12', status: 'active', email: 'ion.popescu@example.com' },
  { id: 'R-1003', name: 'Mihai Ionescu', apartmentId: 'apt-a-18', status: 'active', email: 'mihai.ionescu@example.com' },
  { id: 'R-1004', name: 'Maria Ionescu', apartmentId: 'apt-a-18', status: 'active', email: 'maria.ionescu@example.com' },
  { id: 'R-1005', name: 'Elena Marinescu', apartmentId: 'apt-b-41', status: 'active', email: 'elena.marinescu@example.com' },
  { id: 'R-1006', name: 'Victor Stan', apartmentId: 'apt-c-72', status: 'inactive', email: 'victor.stan@example.com' },
]

export const invoices: Invoice[] = [
  { id: 'INV-2026-0501', apartmentId: 'apt-a-12', month: '2026-05', dueDate: '2026-05-05' },
  { id: 'INV-2026-0502', apartmentId: 'apt-a-18', month: '2026-05', dueDate: '2026-05-05' },
  { id: 'INV-2026-0503', apartmentId: 'apt-b-41', month: '2026-05', dueDate: '2026-05-15' },
  { id: 'INV-2026-0401', apartmentId: 'apt-a-12', month: '2026-04', dueDate: '2026-04-05' },
  { id: 'INV-2026-0402', apartmentId: 'apt-a-18', month: '2026-04', dueDate: '2026-04-05' },
]

export const payments: Payment[] = [
  { id: 'PAY-9001', invoiceId: 'INV-2026-0502', apartmentId: 'apt-a-18', amount: 210, method: 'bank', timestamp: '2026-05-03T09:15:00', verificationStatus: 'deposited' },
  { id: 'PAY-9002', invoiceId: 'INV-2026-0402', apartmentId: 'apt-a-18', amount: 198, method: 'cash', timestamp: '2026-04-02T17:35:00', verificationStatus: 'deposited' },
  { id: 'PAY-9003', invoiceId: 'INV-2026-0401', apartmentId: 'apt-a-12', amount: 100, method: 'cash', timestamp: '2026-05-08T12:20:00', verificationStatus: 'unverified' },
]

export const cashPayments: CashPayment[] = [
  { id: 'CASH-3001', apartmentId: 'apt-a-12', invoiceId: 'INV-2026-0401', amount: 100, registeredBy: 'Admin', status: 'unverified', timestamp: '2026-05-08T12:20:00', notesKey: 'finance.cash.notes.partial' },
  { id: 'CASH-3002', apartmentId: 'apt-b-41', invoiceId: 'INV-2026-0503', amount: 186, registeredBy: 'Admin', status: 'verified', timestamp: '2026-05-07T16:45:00', notesKey: 'finance.cash.notes.receipt' },
  { id: 'CASH-3003', apartmentId: 'apt-a-18', invoiceId: 'INV-2026-0402', amount: 198, registeredBy: 'Admin', status: 'deposited', timestamp: '2026-04-02T17:35:00', notesKey: 'finance.cash.notes.deposited' },
]

export const utilityMonthlyInputs: UtilityMonthlyInput[] = [
  { id: 'UMI-A-2026-05-GAS', blockId: 'block-a', month: '2026-05', category: 'gas', amount: 260 },
  { id: 'UMI-A-2026-05-ELECTRICITY', blockId: 'block-a', month: '2026-05', category: 'electricity', amount: 90 },
  { id: 'UMI-A-2026-05-GARBAGE', blockId: 'block-a', month: '2026-05', category: 'garbage', amount: 70 },
  { id: 'UMI-A-2026-05-WATER', blockId: 'block-a', month: '2026-05', category: 'water', amount: 160 },
  { id: 'UMI-A-2026-05-HEATING', blockId: 'block-a', month: '2026-05', category: 'heating', amount: 270 },
  { id: 'UMI-B-2026-05-GAS', blockId: 'block-b', month: '2026-05', category: 'gas', amount: 72 },
  { id: 'UMI-B-2026-05-ELECTRICITY', blockId: 'block-b', month: '2026-05', category: 'electricity', amount: 34 },
  { id: 'UMI-B-2026-05-GARBAGE', blockId: 'block-b', month: '2026-05', category: 'garbage', amount: 28 },
  { id: 'UMI-B-2026-05-WATER', blockId: 'block-b', month: '2026-05', category: 'water', amount: 42 },
  { id: 'UMI-B-2026-05-HEATING', blockId: 'block-b', month: '2026-05', category: 'heating', amount: 44 },
  { id: 'UMI-A-2026-04-GAS', blockId: 'block-a', month: '2026-04', category: 'gas', amount: 240 },
  { id: 'UMI-A-2026-04-ELECTRICITY', blockId: 'block-a', month: '2026-04', category: 'electricity', amount: 84 },
  { id: 'UMI-A-2026-04-GARBAGE', blockId: 'block-a', month: '2026-04', category: 'garbage', amount: 72 },
  { id: 'UMI-A-2026-04-WATER', blockId: 'block-a', month: '2026-04', category: 'water', amount: 148 },
  { id: 'UMI-A-2026-04-HEATING', blockId: 'block-a', month: '2026-04', category: 'heating', amount: 250 },
]

export const adminExpenses: AdminExpense[] = [
  { id: 'EXP-A-2026-05-MAINTENANCE', blockId: 'block-a', month: '2026-05', labelKey: 'finance.expenses.maintenance', amount: 120 },
  { id: 'EXP-A-2026-05-ADMIN', blockId: 'block-a', month: '2026-05', labelKey: 'finance.expenses.administrative', amount: 80 },
  { id: 'EXP-B-2026-05-MAINTENANCE', blockId: 'block-b', month: '2026-05', labelKey: 'finance.expenses.maintenance', amount: 32 },
  { id: 'EXP-A-2026-04-MAINTENANCE', blockId: 'block-a', month: '2026-04', labelKey: 'finance.expenses.maintenance', amount: 96 },
]

export const waterReadings: WaterReading[] = [
  { id: 'WR-7001', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-05', previousValue: 1280, currentValue: 1298 },
  { id: 'WR-7002', residentId: 'R-1002', apartmentId: 'apt-a-18', month: '2026-05', previousValue: 860, currentValue: 869 },
  { id: 'WR-7003', residentId: 'R-1003', apartmentId: 'apt-b-41', month: '2026-05', previousValue: 1530, currentValue: 1572 },
  { id: 'WR-7004', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-04', previousValue: 1265, currentValue: 1280 },
]

export const heatingReadings: HeatingReading[] = [
  { id: 'HR-8001', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-05', previousValue: 420, currentValue: 436 },
  { id: 'HR-8002', residentId: 'R-1002', apartmentId: 'apt-a-18', month: '2026-05', previousValue: 510, currentValue: 522 },
]

export const reportMonths = ['2026-05', '2026-04', '2026-03']
export const buildingBlocks = blocks.map((block) => block.name)
