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

const getDeclaredPersons = (apartmentId: string, families: Family[], residents: Resident[], residentApartments: ResidentApartment[]) => {
  const declaredPersons = families.find((family) => family.apartmentId === apartmentId)?.declaredPersons
  if (declaredPersons !== undefined) return declaredPersons
  const activeResidentIds = new Set(residents.filter((resident) => resident.status === 'active').map((resident) => resident.id))
  return residentApartments.filter((link) => link.apartmentId === apartmentId && activeResidentIds.has(link.residentId) && !link.ownershipEndDate).length
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
  if (rule.allocationType === 'per_person') return getDeclaredPersons(apartment.id, families, residents, residentApartments)
  if (rule.allocationType === 'per_apartment' || rule.allocationType === 'equal_split') return 1
  if (rule.allocationType === 'by_surface') return apartment.usableSurface
  if (rule.allocationType === 'by_heating_area') {
    if (apartment.heatingType === 'individual' || apartment.heatingType === 'gas_boiler') return 0
    return apartment.heatedSurface
  }
  if (rule.allocationType === 'individual_meter') {
    return sum(waterReadings.filter((reading) => reading.apartmentId === apartment.id && reading.month === month).map(readingUsage))
  }
  if (rule.allocationType === 'by_cold_water_consumption') {
    return sum(waterReadings.filter((reading) => reading.apartmentId === apartment.id && reading.month === month && reading.waterType === 'cold').map(readingUsage))
  }
  if (rule.allocationType === 'by_hot_water_consumption') {
    return sum(waterReadings.filter((reading) => reading.apartmentId === apartment.id && reading.month === month && reading.waterType === 'hot').map(readingUsage))
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
): AllocationExplanation => {
  const usesUnitPrice = Boolean(expense.unitPrice && (rule.allocationType === 'by_cold_water_consumption' || rule.allocationType === 'by_hot_water_consumption'))
  const lineAmount = roundMoney(usesUnitPrice && expense.unitPrice ? basis * expense.unitPrice : amount)
  const allocationPercentage = totalBasis > 0 ? roundMoney((basis / totalBasis) * 100) : 0
  const unitKey = `maintenance.invoiceLines.units.${rule.allocationType}`
  const unitPriceInputKeyByCategory: Record<string, string> = {
    cold_water: 'maintenance.invoiceLines.inputs.coldWaterTariff',
    cold_water_for_hot_water: 'maintenance.invoiceLines.inputs.coldWaterForHotWaterUnitPrice',
    hot_water: 'maintenance.invoiceLines.inputs.hotWaterTariff',
    hot_water_preparation: 'maintenance.invoiceLines.inputs.hotWaterPreparationTariff',
  }
  const ratioInputs = [
    {
      labelKey: 'maintenance.invoiceLines.inputs.expenseTotal',
      value: roundMoney(expense.amount),
      valueType: 'currency' as const,
    },
    {
      labelKey: `maintenance.invoiceLines.inputs.${rule.allocationType}.basis`,
      value: roundMoney(basis),
      unitKey,
    },
    {
      labelKey: `maintenance.invoiceLines.inputs.${rule.allocationType}.totalBasis`,
      value: roundMoney(totalBasis),
      unitKey,
    },
    {
      labelKey: 'maintenance.invoiceLines.inputs.allocationPercentage',
      value: allocationPercentage,
      unitKey: 'maintenance.invoiceLines.units.percent',
    },
  ]
  const directInputs = [
    {
      labelKey: `maintenance.invoiceLines.inputs.${rule.allocationType}.basis`,
      value: roundMoney(basis),
      unitKey,
    },
    {
      labelKey: unitPriceInputKeyByCategory[expense.categoryId] ?? 'maintenance.invoiceLines.inputs.unitPrice',
      value: roundMoney(expense.unitPrice ?? 0),
      valueType: 'currency' as const,
      unitKey: 'maintenance.invoiceLines.units.perCubicMeter',
    },
  ]

  return {
    expenseId: expense.id,
    categoryId: expense.categoryId,
    labelKey: expense.labelKey,
    allocationType: rule.allocationType,
    amount: lineAmount,
    basis,
    totalBasis,
    textKey: usesUnitPrice ? `maintenance.explain.${rule.allocationType}_unit_price` : `maintenance.explain.${rule.allocationType}`,
    explanationKey: expense.explanationKey ?? `maintenance.invoiceLines.explanation.${expense.categoryId}`,
    formulaKey: expense.formulaKey ?? (usesUnitPrice ? `maintenance.invoiceLines.formula.${rule.allocationType}_unit_price` : `maintenance.invoiceLines.formula.${rule.allocationType}`),
    calculationInputs: usesUnitPrice ? directInputs : ratioInputs,
    allocationBasis: {
      labelKey: `maintenance.invoiceLines.basis.${rule.allocationType}`,
      value: roundMoney(basis),
      totalValue: usesUnitPrice ? roundMoney(basis) : roundMoney(totalBasis),
      unitKey,
    },
    values: {
      amount: lineAmount,
      apartment: apartment.number,
      basis: roundMoney(basis),
      totalBasis: roundMoney(totalBasis),
      expenseTotal: roundMoney(expense.amount),
      allocationPercentage,
      unitPrice: expense.unitPrice ? roundMoney(expense.unitPrice) : '',
    },
  }
}

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
      explanationKey: 'maintenance.invoiceLines.explanation.boiler_tax',
      formulaKey: 'maintenance.invoiceLines.formula.boiler_tax',
      calculationInputs: [
        { labelKey: 'maintenance.invoiceLines.inputs.taxableAmount', value: taxableAmount, valueType: 'currency' as const },
        { labelKey: 'maintenance.invoiceLines.inputs.percentage', value: apartment.boilerTaxPercentage, unitKey: 'maintenance.invoiceLines.units.percent' },
      ],
      allocationBasis: {
        labelKey: 'maintenance.invoiceLines.basis.by_heating_area',
        value: apartment.heatedSurface,
        totalValue: sum(blockApartments.filter((item) => item.boilerTaxEnabled).map((item) => item.heatedSurface)),
        unitKey: 'maintenance.invoiceLines.units.by_heating_area',
      },
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
