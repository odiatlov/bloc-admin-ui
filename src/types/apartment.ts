export type ResidentStatus = 'active' | 'inactive'
export type ResidentRole = 'owner' | 'tenant' | 'family_member'
export type FinancialStatus = 'current' | 'due' | 'overdue'
export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue'
export type PaymentMethod = 'cash' | 'bank'
export type VerificationStatus = 'unverified' | 'verified' | 'deposited'
export type AnomalyLevel = 'normal' | 'warning' | 'critical'
export type UtilityCategory = 'gas' | 'electricity' | 'garbage' | 'water' | 'heating'

export type AllocationType =
  | 'per_person'
  | 'per_apartment'
  | 'by_surface'
  | 'by_heating_area'
  | 'individual_meter'
  | 'equal_split'
  | 'custom'

export type AllocationScopeType = 'building' | 'staircase' | 'apartment' | 'apartment_group'
export type MaintenanceMonthStatus = 'draft' | 'published'
export type ExpenseKind = 'utility' | 'administrative' | 'manual' | 'penalty' | 'historical_debt'
export type CostScopeLevel = 'block' | 'staircase'

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
  usableSurface: number
  heatingArea: number
  indivisibleShare: number
  heatingSystem: 'district' | 'private'
}

export type Family = {
  id: string
  apartmentId: string
  name: string
  declaredPersons: number
}

export type Resident = {
  id: string
  apartmentId: string
  name: string
  status: ResidentStatus
  email: string
  role: ResidentRole
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

export type ExpenseCategory = {
  id: string
  labelKey: string
  defaultAllocationType: AllocationType
  kind: ExpenseKind
}

export type AllocationScope = {
  type: AllocationScopeType
  blockId: string
  staircaseId?: string
  apartmentIds?: string[]
}

export type AllocationRule = {
  id: string
  categoryId: string
  allocationType: AllocationType
  scope: AllocationScope
  customShares?: Record<string, number>
  includePrivateHeatingApartments?: boolean
}

export type MonthlyExpense = {
  id: string
  blockId: string
  month: string
  categoryId: string
  labelKey: string
  amount: number
  ruleId: string
  source: ExpenseKind
}

export type CustomCostConfiguration = {
  id: string
  blockId: string
  staircaseId?: string
  labelKey: string
  amount: number
  allocationType: AllocationType
  scopeLevel: CostScopeLevel
  isActive: boolean
  isRecurringMonthly: boolean
  effectiveFrom: string
  notesKey?: string
}

export type HistoricalDebt = {
  id: string
  apartmentId: string
  month: string
  principal: number
  descriptionKey: string
}

export type Penalty = {
  id: string
  apartmentId: string
  month: string
  amount: number
  reasonKey: string
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

export type MainMeterReading = {
  id: string
  blockId: string
  month: string
  utility: 'water' | 'heating'
  previousValue: number
  currentValue: number
}

export type AllocationExplanation = {
  expenseId: string
  categoryId: string
  labelKey: string
  allocationType: AllocationType
  amount: number
  basis: number
  totalBasis: number
  textKey: string
  values: Record<string, string | number>
}

export type ApartmentMaintenanceTotal = {
  apartmentId: string
  month: string
  lines: AllocationExplanation[]
  debts: HistoricalDebt[]
  penalties: Penalty[]
  total: number
}

export type MonthlyMaintenanceRun = {
  id: string
  blockId: string
  month: string
  status: MaintenanceMonthStatus
  generatedAt: string
  publishedAt?: string
  apartmentTotals: ApartmentMaintenanceTotal[]
}
