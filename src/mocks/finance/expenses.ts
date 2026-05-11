import type { AdminExpense, AllocationRule, ExpenseCategory, HistoricalDebt, MonthlyExpense, Penalty } from '../../types/apartment'

export const adminExpenses: AdminExpense[] = [
  { id: 'EXP-A-2026-05-MAINTENANCE', blockId: 'block-a', month: '2026-05', labelKey: 'finance.expenses.maintenance', amount: 120 },
  { id: 'EXP-A-2026-05-ADMIN', blockId: 'block-a', month: '2026-05', labelKey: 'finance.expenses.administrative', amount: 80 },
  { id: 'EXP-B-2026-05-MAINTENANCE', blockId: 'block-b', month: '2026-05', labelKey: 'finance.expenses.maintenance', amount: 32 },
  { id: 'EXP-A-2026-04-MAINTENANCE', blockId: 'block-a', month: '2026-04', labelKey: 'finance.expenses.maintenance', amount: 96 },
]

export const expenseCategories: ExpenseCategory[] = [
  { id: 'garbage', labelKey: 'finance.expenses.garbage', defaultAllocationType: 'per_person', kind: 'utility' },
  { id: 'administration', labelKey: 'finance.expenses.administrative', defaultAllocationType: 'per_apartment', kind: 'administrative' },
  { id: 'heating', labelKey: 'finance.expenses.heating', defaultAllocationType: 'by_heating_area', kind: 'utility' },
  { id: 'cold_water', labelKey: 'finance.expenses.coldWater', defaultAllocationType: 'individual_meter', kind: 'utility' },
  { id: 'staircase_electricity', labelKey: 'finance.expenses.staircaseElectricity', defaultAllocationType: 'equal_split', kind: 'utility' },
  { id: 'surface_repairs', labelKey: 'finance.expenses.surfaceRepairs', defaultAllocationType: 'by_surface', kind: 'manual' },
  { id: 'staircase_cleaning', labelKey: 'finance.expenses.staircaseCleaning', defaultAllocationType: 'equal_split', kind: 'manual' },
  { id: 'gardening', labelKey: 'finance.expenses.gardening', defaultAllocationType: 'custom', kind: 'manual' },
]

export const allocationRules: AllocationRule[] = [
  { id: 'RULE-GARBAGE-A', categoryId: 'garbage', allocationType: 'per_person', scope: { type: 'building', blockId: 'block-a' } },
  { id: 'RULE-ADMIN-A', categoryId: 'administration', allocationType: 'per_apartment', scope: { type: 'building', blockId: 'block-a' } },
  { id: 'RULE-HEATING-A', categoryId: 'heating', allocationType: 'by_heating_area', scope: { type: 'building', blockId: 'block-a' }, includePrivateHeatingApartments: false },
  { id: 'RULE-WATER-A', categoryId: 'cold_water', allocationType: 'individual_meter', scope: { type: 'building', blockId: 'block-a' } },
  { id: 'RULE-STAIR-A-1-LIGHT', categoryId: 'staircase_electricity', allocationType: 'equal_split', scope: { type: 'staircase', blockId: 'block-a', staircaseId: 'stair-a-1' } },
  { id: 'RULE-STAIR-A-2-LIGHT', categoryId: 'staircase_electricity', allocationType: 'equal_split', scope: { type: 'staircase', blockId: 'block-a', staircaseId: 'stair-a-2' } },
  { id: 'RULE-CLEAN-A-1', categoryId: 'staircase_cleaning', allocationType: 'equal_split', scope: { type: 'staircase', blockId: 'block-a', staircaseId: 'stair-a-1' } },
  { id: 'RULE-GARDEN-A-GROUP', categoryId: 'gardening', allocationType: 'custom', scope: { type: 'apartment_group', blockId: 'block-a', apartmentIds: ['apt-a-12', 'apt-a-18'] }, customShares: { 'apt-a-12': 0.4, 'apt-a-18': 0.6 } },
  { id: 'RULE-ADMIN-B', categoryId: 'administration', allocationType: 'per_apartment', scope: { type: 'building', blockId: 'block-b' } },
]

export const monthlyExpenses: MonthlyExpense[] = [
  { id: 'MEXP-A-2026-05-GARBAGE', blockId: 'block-a', month: '2026-05', categoryId: 'garbage', labelKey: 'finance.expenses.garbage', amount: 101.12, ruleId: 'RULE-GARBAGE-A', source: 'utility' },
  { id: 'MEXP-A-2026-05-ADMIN', blockId: 'block-a', month: '2026-05', categoryId: 'administration', labelKey: 'finance.expenses.administrative', amount: 80, ruleId: 'RULE-ADMIN-A', source: 'administrative' },
  { id: 'MEXP-A-2026-05-HEATING', blockId: 'block-a', month: '2026-05', categoryId: 'heating', labelKey: 'finance.expenses.heating', amount: 270, ruleId: 'RULE-HEATING-A', source: 'utility' },
  { id: 'MEXP-A-2026-05-WATER', blockId: 'block-a', month: '2026-05', categoryId: 'cold_water', labelKey: 'finance.expenses.coldWater', amount: 160, ruleId: 'RULE-WATER-A', source: 'utility' },
  { id: 'MEXP-A-2026-05-STAIR-1-LIGHT', blockId: 'block-a', month: '2026-05', categoryId: 'staircase_electricity', labelKey: 'finance.expenses.staircaseElectricity', amount: 42, ruleId: 'RULE-STAIR-A-1-LIGHT', source: 'utility' },
  { id: 'MEXP-A-2026-05-STAIR-2-LIGHT', blockId: 'block-a', month: '2026-05', categoryId: 'staircase_electricity', labelKey: 'finance.expenses.staircaseElectricity', amount: 48, ruleId: 'RULE-STAIR-A-2-LIGHT', source: 'utility' },
  { id: 'MEXP-A-2026-05-CLEAN-1', blockId: 'block-a', month: '2026-05', categoryId: 'staircase_cleaning', labelKey: 'finance.expenses.staircaseCleaning', amount: 120, ruleId: 'RULE-CLEAN-A-1', source: 'manual' },
  { id: 'MEXP-A-2026-05-GARDEN', blockId: 'block-a', month: '2026-05', categoryId: 'gardening', labelKey: 'finance.expenses.gardening', amount: 75, ruleId: 'RULE-GARDEN-A-GROUP', source: 'manual' },
  { id: 'MEXP-B-2026-05-ADMIN', blockId: 'block-b', month: '2026-05', categoryId: 'administration', labelKey: 'finance.expenses.administrative', amount: 32, ruleId: 'RULE-ADMIN-B', source: 'administrative' },
]

export const historicalDebts: HistoricalDebt[] = [
  { id: 'DEBT-A-12-2026-04', apartmentId: 'apt-a-12', month: '2026-05', principal: 72.4, descriptionKey: 'finance.debts.previousBalance' },
]

export const penalties: Penalty[] = [
  { id: 'PEN-A-12-2026-05', apartmentId: 'apt-a-12', month: '2026-05', amount: 8.5, reasonKey: 'finance.penalties.latePayment' },
]
