export type ResidentStatus = 'active' | 'inactive'
export type FinancialStatus = 'current' | 'due' | 'overdue'
export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue'
export type PaymentMethod = 'cash' | 'bank'
export type VerificationStatus = 'unverified' | 'verified' | 'deposited'
export type AnomalyLevel = 'normal' | 'warning' | 'critical'

export type Apartment = {
  block: string
  floor: number
  number: string
}

export type Resident = {
  id: string
  name: string
  apartment: Apartment
  status: ResidentStatus
  financialStatus: FinancialStatus
  debtBalance: number
  email: string
}

export type Invoice = {
  id: string
  residentId: string
  month: string
  totalAmount: number
  status: InvoiceStatus
  dueDate: string
}

export type Payment = {
  id: string
  invoiceId: string
  residentId: string
  amount: number
  method: PaymentMethod
  timestamp: string
  verificationStatus: VerificationStatus
}

export type CashPayment = {
  id: string
  residentId: string
  amount: number
  registeredBy: string
  status: VerificationStatus
  timestamp: string
  notesKey: string
}

export type WaterReading = {
  id: string
  residentId: string
  apartment: Apartment
  month: string
  previousValue: number
  currentValue: number
}

export type ConsumptionSummary = {
  apartment: Apartment
  month: string
  usageValue: number
  anomaly: AnomalyLevel
}

export const residents: Resident[] = [
  {
    id: 'R-1001',
    name: 'Ana Popescu',
    apartment: { block: 'A', floor: 1, number: '12' },
    status: 'active',
    financialStatus: 'overdue',
    debtBalance: 725,
    email: 'ana.popescu@example.com',
  },
  {
    id: 'R-1002',
    name: 'Mihai Ionescu',
    apartment: { block: 'A', floor: 2, number: '18' },
    status: 'active',
    financialStatus: 'current',
    debtBalance: 0,
    email: 'mihai.ionescu@example.com',
  },
  {
    id: 'R-1003',
    name: 'Elena Marinescu',
    apartment: { block: 'B', floor: 4, number: '41' },
    status: 'active',
    financialStatus: 'due',
    debtBalance: 186,
    email: 'elena.marinescu@example.com',
  },
  {
    id: 'R-1004',
    name: 'Victor Stan',
    apartment: { block: 'C', floor: 7, number: '72' },
    status: 'inactive',
    financialStatus: 'current',
    debtBalance: 0,
    email: 'victor.stan@example.com',
  },
]

export const invoices: Invoice[] = [
  { id: 'INV-2026-0501', residentId: 'R-1001', month: '2026-05', totalAmount: 425, status: 'overdue', dueDate: '2026-05-05' },
  { id: 'INV-2026-0502', residentId: 'R-1002', month: '2026-05', totalAmount: 210, status: 'paid', dueDate: '2026-05-05' },
  { id: 'INV-2026-0503', residentId: 'R-1003', month: '2026-05', totalAmount: 186, status: 'unpaid', dueDate: '2026-05-15' },
  { id: 'INV-2026-0401', residentId: 'R-1001', month: '2026-04', totalAmount: 300, status: 'unpaid', dueDate: '2026-04-05' },
  { id: 'INV-2026-0402', residentId: 'R-1002', month: '2026-04', totalAmount: 198, status: 'paid', dueDate: '2026-04-05' },
]

export const payments: Payment[] = [
  { id: 'PAY-9001', invoiceId: 'INV-2026-0502', residentId: 'R-1002', amount: 210, method: 'bank', timestamp: '2026-05-03T09:15:00', verificationStatus: 'deposited' },
  { id: 'PAY-9002', invoiceId: 'INV-2026-0402', residentId: 'R-1002', amount: 198, method: 'cash', timestamp: '2026-04-02T17:35:00', verificationStatus: 'deposited' },
  { id: 'PAY-9003', invoiceId: 'INV-2026-0401', residentId: 'R-1001', amount: 100, method: 'cash', timestamp: '2026-05-08T12:20:00', verificationStatus: 'unverified' },
]

export const cashPayments: CashPayment[] = [
  {
    id: 'CASH-3001',
    residentId: 'R-1001',
    amount: 100,
    registeredBy: 'Admin',
    status: 'unverified',
    timestamp: '2026-05-08T12:20:00',
    notesKey: 'finance.cash.notes.partial',
  },
  {
    id: 'CASH-3002',
    residentId: 'R-1003',
    amount: 186,
    registeredBy: 'Admin',
    status: 'verified',
    timestamp: '2026-05-07T16:45:00',
    notesKey: 'finance.cash.notes.receipt',
  },
  {
    id: 'CASH-3003',
    residentId: 'R-1002',
    amount: 198,
    registeredBy: 'Admin',
    status: 'deposited',
    timestamp: '2026-04-02T17:35:00',
    notesKey: 'finance.cash.notes.deposited',
  },
]

export const waterReadings: WaterReading[] = [
  { id: 'WR-7001', residentId: 'R-1001', apartment: { block: 'A', floor: 1, number: '12' }, month: '2026-05', previousValue: 1280, currentValue: 1298 },
  { id: 'WR-7002', residentId: 'R-1002', apartment: { block: 'A', floor: 2, number: '18' }, month: '2026-05', previousValue: 860, currentValue: 869 },
  { id: 'WR-7003', residentId: 'R-1003', apartment: { block: 'B', floor: 4, number: '41' }, month: '2026-05', previousValue: 1530, currentValue: 1572 },
  { id: 'WR-7004', residentId: 'R-1001', apartment: { block: 'A', floor: 1, number: '12' }, month: '2026-04', previousValue: 1265, currentValue: 1280 },
]

export const consumptionSummaries: ConsumptionSummary[] = waterReadings.map((reading) => {
  const usageValue = reading.currentValue - reading.previousValue
  const anomaly: AnomalyLevel = usageValue > 35 ? 'critical' : usageValue > 20 ? 'warning' : 'normal'

  return {
    apartment: reading.apartment,
    month: reading.month,
    usageValue,
    anomaly,
  }
})

export const reportMonths = ['2026-05', '2026-04', '2026-03']
export const buildingBlocks = ['A', 'B', 'C']
