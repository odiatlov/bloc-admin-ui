import type { ComponentProps } from 'react'
import { RoleContext } from '../src/contexts/RoleContext'
import type { MaintenanceReport, ResidentBillDetail } from '../src/types/finance'

export const residentContext: ComponentProps<typeof RoleContext.Provider>['value'] = {
  role: 'Resident', account: { id: '00000000-0000-0000-0000-000000000001', userId: '00000000-0000-0000-0000-000000000001', residentId: '00000000-0000-0000-0000-000000000002',
    name: 'Resident fixture', email: 'resident@example.invalid', systemRole: 'None', roles: ['Resident'], blockRoles: ['Resident'], defaultRole: 'Resident', token: 'fixture-token', dataMode: 'backend-ready-empty' },
  accounts: [], accountsError: null, accountsLoading: false, token: 'fixture-token', isAuthenticated: true,
  refreshAccounts: async () => undefined, login: () => undefined, logout: () => undefined, setRole: () => undefined,
}

export const billDetail: ResidentBillDetail = {
  bill: { id: '00000000-0000-0000-0000-000000000010', apartmentId: '00000000-0000-0000-0000-000000000011', reference: 'BILL-202610-00000010', blockName: 'Fixture block', staircaseName: 'A', apartmentNumber: '12',
    year: 2026, month: 10, currency: 'RON', dueDate: '2026-11-20', publishedAt: '2026-10-29T10:00:00Z', originalAmount: 112, reportTotal: 212, carriedForwardArrears: 100, paidAmount: 0, remainingAmount: 112, status: 'unpaid' },
  breakdown: { revision: 2, row: {
    apartmentId: '00000000-0000-0000-0000-000000000011', number: '12', contactName: 'Resident fixture', declaredOccupants: 3,
    usableSqm: 50.25, heatingMode: 'Percentage', heatingPercentage: 20.1, heatingMp: 10.1,
    coldConsumption: 4, coldDifference: 1, billedColdConsumption: 5, hotConsumption: 2, hotDifference: 0.5, billedHotConsumption: 2.5,
    charges: [
      { chargeId: '00000000-0000-0000-0000-000000000020', name: 'Cold supply', basis: 'ColdConsumption', amount: 40, quantity: 5, denominator: 10, rate: 8, sourceAmount: 80, explanation: '' },
      { chargeId: '00000000-0000-0000-0000-000000000021', name: 'Hot supply', basis: 'HotConsumption', amount: 20, quantity: 2.5, denominator: 5, rate: 8, sourceAmount: 40, explanation: '' },
      { chargeId: '00000000-0000-0000-0000-000000000022', name: 'Heating', basis: 'HeatingMp', amount: 30, quantity: 10.1, denominator: 20.2, rate: 60 / 20.2, sourceAmount: 60, explanation: '' },
      { chargeId: '00000000-0000-0000-0000-000000000023', name: 'Garden repair', basis: 'Manual', amount: 10, quantity: 0, denominator: 0, rate: 0, sourceAmount: 10, explanation: 'Agreed repair contribution' },
      { chargeId: '00000000-0000-0000-0000-000000000024', name: 'Rubbish', basis: 'People', amount: 15, quantity: 3, denominator: 8, rate: 5, sourceAmount: 40, explanation: '' },
    ], adjustmentDetails: [
      { id: '00000000-0000-0000-0000-000000000030', apartmentId: '00000000-0000-0000-0000-000000000011', kind: 'Arrears', name: 'Previous month debt', amount: 100, reason: 'Already on the September bill' },
      { id: '00000000-0000-0000-0000-000000000031', apartmentId: '00000000-0000-0000-0000-000000000011', kind: 'Penalty', name: 'Late payment', amount: 5, reason: 'Recorded late payment adjustment' },
      { id: '00000000-0000-0000-0000-000000000032', apartmentId: '00000000-0000-0000-0000-000000000011', kind: 'Credit', name: 'Credit correction', amount: -10, reason: 'Supplier corrected the prior invoice' },
      { id: '00000000-0000-0000-0000-000000000033', apartmentId: '00000000-0000-0000-0000-000000000011', kind: 'Other', name: 'Other correction', amount: 2, reason: 'Documented correction' },
    ], currentCharges: 115, arrears: 100, adjustments: -3, totalDue: 212,
  }, chargeContexts: [
    { chargeId: '00000000-0000-0000-0000-000000000020', amountMode: 'Pool', scope: 'Staircase', utilityType: 'ColdWater' },
    { chargeId: '00000000-0000-0000-0000-000000000021', amountMode: 'Pool', scope: 'Block', utilityType: 'HotWater' },
    { chargeId: '00000000-0000-0000-0000-000000000022', amountMode: 'Pool', scope: 'Block' },
    { chargeId: '00000000-0000-0000-0000-000000000023', amountMode: 'Manual', scope: 'Apartments' },
    { chargeId: '00000000-0000-0000-0000-000000000024', amountMode: 'Rate', scope: 'Block' },
  ] },
}

export const maintenanceReport: MaintenanceReport = {
  id: '00000000-0000-0000-0000-000000000050', blockId: '00000000-0000-0000-0000-000000000051', blockName: 'Fixture block', year: 2026, month: 10, revision: 2,
  status: 'Draft', generatedAt: '2026-10-29T10:00:00Z', totalDue: 212, inputVersion: 'saved-input', configurationVersion: 1, currency: 'RON',
  columns: billDetail.breakdown.row.charges.map((line, order) => ({ id: line.chargeId, name: line.name, order })),
  sheets: [{ staircaseId: '00000000-0000-0000-0000-000000000052', name: 'A', rows: [billDetail.breakdown.row], chargeTotals: {}, currentCharges: 115, totalArrears: 100, totalAdjustments: -3, totalDue: 212 }],
  reconciliation: [], supplyGroups: [], totalCurrentCharges: 115, totalArrears: 100, totalAdjustments: -3,
}
