import type {
  AllocationExplanation,
  AllocationRule,
  Apartment,
  ApartmentMaintenanceTotal,
  Family,
  HistoricalDebt,
  MainMeterReading,
  MonthlyExpense,
  MonthlyMaintenanceRun,
  Penalty,
  Resident,
  ResidentApartment,
  WaterReading,
} from '../types/apartment'

type MaintenanceEngineInput = {
  apartments: Apartment[]
  residents: Resident[]
  families: Family[]
  rules: AllocationRule[]
  expenses: MonthlyExpense[]
  debts: HistoricalDebt[]
  penalties: Penalty[]
  residentApartments: ResidentApartment[]
  waterReadings: WaterReading[]
  mainMeterReadings: MainMeterReading[]
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

const readingUsage = (reading: WaterReading | MainMeterReading) => Math.max(reading.currentValue - reading.previousValue, 0)

const getDeclaredPersons = (apartment: Apartment, families: Family[], residents: Resident[], residentApartments: ResidentApartment[]) => {
  const hasAssignedResident = residentApartments.some((link) => link.apartmentId === apartment.id && !link.ownershipEndDate)
  if (!hasAssignedResident) return 0
  if (apartment.residentCount > 0) return apartment.residentCount

  const declaredPersons = families.find((family) => family.apartmentId === apartment.id)?.declaredPersons
  if (declaredPersons !== undefined) return declaredPersons
  const activeResidentIds = new Set(residents.filter((resident) => resident.status === 'active').map((resident) => resident.id))
  return residentApartments.filter((link) => link.apartmentId === apartment.id && activeResidentIds.has(link.residentId) && !link.ownershipEndDate).length
}

const getScopedApartments = (rule: AllocationRule, apartments: Apartment[]) => {
  const byBlock = apartments.filter((apartment) => apartment.blockId === rule.scope.blockId)

  if (rule.scope.type === 'staircase') {
    return byBlock.filter((apartment) => apartment.staircaseId === rule.scope.staircaseId)
  }

  if (rule.scope.type === 'apartment') {
    return byBlock.filter((apartment) => rule.scope.apartmentIds?.[0] === apartment.id)
  }

  if (rule.scope.type === 'apartment_group') {
    return byBlock.filter((apartment) => rule.scope.apartmentIds?.includes(apartment.id))
  }

  return byBlock
}

const getWaterLossByBlock = (blockId: string, month: string, readings: WaterReading[], mainMeters: MainMeterReading[], apartments: Apartment[]) => {
  const apartmentIds = apartments.filter((apartment) => apartment.blockId === blockId).map((apartment) => apartment.id)
  const apartmentUsage = sum(readings.filter((reading) => reading.month === month && apartmentIds.includes(reading.apartmentId)).map(readingUsage))
  const mainUsage = sum(mainMeters.filter((reading) => reading.blockId === blockId && reading.month === month && reading.utility === 'water').map(readingUsage))

  return {
    apartmentUsage,
    mainUsage,
    difference: Math.max(mainUsage - apartmentUsage, 0),
  }
}

const getBasis = (
  apartment: Apartment,
  rule: AllocationRule,
  month: string,
  families: Family[],
  residents: Resident[],
  residentApartments: ResidentApartment[],
  waterReadings: WaterReading[],
) => {
  if (rule.allocationType === 'per_person') return getDeclaredPersons(apartment, families, residents, residentApartments)
  if (rule.allocationType === 'per_apartment' || rule.allocationType === 'equal_split') return 1
  if (rule.allocationType === 'by_surface') return apartment.usableSurface
  if (rule.allocationType === 'by_heating_area') {
    if (apartment.heatingType === 'individual' || apartment.heatingType === 'gas_boiler') return 0
    return apartment.heatedSurface
  }
  if (rule.allocationType === 'individual_meter') {
    return sum(waterReadings.filter((reading) => reading.apartmentId === apartment.id && reading.month === month).map(readingUsage))
  }
  if (rule.allocationType === 'custom') return rule.customShares?.[apartment.id] ?? 0
  return 0
}

const buildExplanation = (
  expense: MonthlyExpense,
  rule: AllocationRule,
  amount: number,
  basis: number,
  totalBasis: number,
  apartment: Apartment,
): AllocationExplanation => ({
  expenseId: expense.id,
  categoryId: expense.categoryId,
  labelKey: expense.labelKey,
  allocationType: rule.allocationType,
  amount: roundMoney(amount),
  basis,
  totalBasis,
  textKey: `maintenance.explain.${rule.allocationType}`,
  values: {
    amount: roundMoney(amount),
    apartment: apartment.number,
    basis: roundMoney(basis),
    totalBasis: roundMoney(totalBasis),
  },
})

export const allocateExpense = (
  expense: MonthlyExpense,
  rule: AllocationRule,
  input: Pick<MaintenanceEngineInput, 'apartments' | 'families' | 'residentApartments' | 'residents' | 'waterReadings'>,
) => {
  const scopedApartments = getScopedApartments(rule, input.apartments)
  const weightedApartments = scopedApartments.map((apartment) => ({
    apartment,
    basis: getBasis(apartment, rule, expense.month, input.families, input.residents, input.residentApartments, input.waterReadings),
  }))
  const totalBasis = sum(weightedApartments.map((entry) => entry.basis))

  if (totalBasis <= 0) return []

  return weightedApartments
    .filter((entry) => entry.basis > 0)
    .map((entry) => buildExplanation(expense, rule, (expense.amount * entry.basis) / totalBasis, entry.basis, totalBasis, entry.apartment))
}

export const generateMonthlyMaintenance = (blockId: string, month: string, input: MaintenanceEngineInput): MonthlyMaintenanceRun => {
  const blockApartments = input.apartments.filter((apartment) => apartment.blockId === blockId)
  const expenses = input.expenses.filter((expense) => expense.blockId === blockId && expense.month === month)
  const lines = expenses.flatMap((expense) => {
    const rule = input.rules.find((candidate) => candidate.id === expense.ruleId)
    return rule ? allocateExpense(expense, rule, input) : []
  })
  const boilerTaxLines = blockApartments.flatMap((apartment) => {
    if (!apartment.boilerTaxEnabled) return []
    const taxableLines = lines.filter((line) => line.values.apartment === apartment.number && line.allocationType !== 'individual_meter')
    const taxableAmount = sum(taxableLines.map((line) => line.amount))
    if (taxableAmount <= 0) return []
    const amount = roundMoney((taxableAmount * apartment.boilerTaxPercentage) / 100)
    return [{
      expenseId: `BOILER-TAX-${apartment.id}-${month}`,
      categoryId: 'boiler_tax',
      labelKey: 'finance.expenses.boilerTax',
      allocationType: 'by_heating_area' as const,
      amount,
      basis: apartment.heatedSurface,
      totalBasis: sum(blockApartments.filter((item) => item.boilerTaxEnabled).map((item) => item.heatedSurface)),
      textKey: 'maintenance.explain.boiler_tax',
      values: {
        amount,
        apartment: apartment.number,
        basis: apartment.heatedSurface,
        percentage: apartment.boilerTaxPercentage,
        taxableAmount,
        totalBasis: sum(blockApartments.filter((item) => item.boilerTaxEnabled).map((item) => item.heatedSurface)),
      },
    }]
  })
  const allLines = [...lines, ...boilerTaxLines]

  const apartmentTotals: ApartmentMaintenanceTotal[] = blockApartments.map((apartment) => {
    const apartmentLines = allLines.filter((line) => line.values.apartment === apartment.number)
    const debts = input.debts.filter((debt) => debt.apartmentId === apartment.id && debt.month === month)
    const penalties = input.penalties.filter((penalty) => penalty.apartmentId === apartment.id && penalty.month === month)
    const total = sum(apartmentLines.map((line) => line.amount)) + sum(debts.map((debt) => debt.principal)) + sum(penalties.map((penalty) => penalty.amount))

    return {
      apartmentId: apartment.id,
      month,
      lines: apartmentLines,
      debts,
      penalties,
      total: roundMoney(total),
    }
  })

  return {
    id: `RUN-${blockId}-${month}`,
    blockId,
    month,
    status: month === '2026-05' ? 'draft' : 'published',
    generatedAt: `${month}-01T08:00:00`,
    publishedAt: month === '2026-05' ? undefined : `${month}-03T10:00:00`,
    apartmentTotals,
  }
}

export const calculateWaterBalance = (blockId: string, month: string, input: Pick<MaintenanceEngineInput, 'apartments' | 'waterReadings' | 'mainMeterReadings'>) =>
  getWaterLossByBlock(blockId, month, input.waterReadings, input.mainMeterReadings, input.apartments)
