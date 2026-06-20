import React from 'react'
import {
  adminExpenses,
  administrators,
  allocationRules,
  apartments,
  blocks,
  buildingAdminAssignments,
  cashPayments,
  families,
  historicalDebts,
  invoices,
  mainMeterReadings,
  monthlyExpenses,
  payments,
  penalties,
  reportMonths,
  residents,
  residentApartments,
  staircases,
  utilityMonthlyInputs,
  waterReadings,
  type Apartment,
  type AnomalyLevel,
  type CashPayment,
  type CensorReview,
  type FinancialStatus,
  type Invoice,
  type InvoiceStatus,
  type PaymentMethod,
  type Resident,
  type ResidentApartment,
  type ResidentAccountStatus,
  type ReviewState,
  type VerificationStatus,
  type WaterMeterType,
  type WaterReading,
} from '../mocks/apartmentData'
import { RoleContext } from '../contexts/RoleContext'
import { filterApartmentsForAccount, filterBlocksForAccount } from '../application/accessScope'
import { calculateWaterBalance, generateMonthlyMaintenance } from '../utils/maintenanceEngine'
import { formatCurrency, formatFriendlyDateTime, formatMonth, formatNumber, formatPercent, formatSquareMeters } from '../utils/formatters'
import type { ApartmentSetupStatus, AuthRole, MockAccount } from '../types/apartment'

export { formatCurrency, formatFriendlyDateTime, formatMonth, formatNumber, formatPercent, formatSquareMeters }

export const getBlockLabel = (blockId: string) => blocks.find((block) => block.id === blockId)?.name ?? blockId

export const getApartmentResidents = (apartmentId: string, sourceResidents = residents, sourceLinks = residentApartments) =>
  sourceLinks
    .filter((link) => link.apartmentId === apartmentId && !link.ownershipEndDate)
    .map((link) => {
      const resident = sourceResidents.find((item) => item.id === link.residentId)
      return resident ? { ...resident, apartmentLink: link } : null
    })
    .filter((resident): resident is NonNullable<typeof resident> => Boolean(resident))

const getResidentsForApartments = (apartmentIds: string[]) => {
  const residentIds = new Set(residentApartments.filter((link) => apartmentIds.includes(link.apartmentId) && !link.ownershipEndDate).map((link) => link.residentId))
  return residents.filter((resident) => residentIds.has(resident.id))
}

export const getPrimaryOwner = (apartment: Apartment) =>
  residents.find((resident) => resident.id === apartment.primaryOwnerId) ?? getApartmentResidents(apartment.id)[0]

export const getStaircaseLabel = (staircaseId?: string) =>
  staircaseId ? staircases.find((staircase) => staircase.id === staircaseId)?.name : undefined

export const formatApartment = (apartment: Apartment) => {
  const owner = getPrimaryOwner(apartment)
  const staircase = getStaircaseLabel(apartment.staircaseId)
  return [
    owner?.name ?? (apartment.familyName || null),
    `Apt ${apartment.number}`,
    staircase ? `Sc ${staircase}` : null,
    `Bl ${getBlockLabel(apartment.blockId)}`,
  ].filter(Boolean).join(' - ')
}

const today = new Date('2026-05-10T00:00:00')
const toScope = (account: MockAccount, role: AuthRole) => ({ ...account, role })

const residentCountForApartment = (apartmentId: string) =>
  getApartmentResidents(apartmentId).filter((resident) => resident.status === 'active').length

const getBlockResidentCount = (blockId: string) =>
  apartments
    .filter((apartment) => apartment.blockId === blockId)
    .reduce((sum, apartment) => sum + residentCountForApartment(apartment.id), 0)

const maintenanceEngineInput = {
  apartments,
  debts: historicalDebts,
  expenses: monthlyExpenses,
  families,
  mainMeterReadings,
  penalties,
  residentApartments,
  residents,
  rules: allocationRules,
  waterReadings,
}

type WaterMeterSnapshot = {
  previousValue: number
  currentValue: number
  usageValue: number
}

export type WaterReadingRow = {
  id: string
  apartment: Apartment
  month: string
  meters: Partial<Record<WaterMeterType, WaterMeterSnapshot>>
  usageValue: number
}

const getWaterReadingRows = (sourceReadings: WaterReading[]) => {
  const rows = new Map<string, WaterReadingRow>()

  sourceReadings.forEach((reading) => {
    const apartment = apartments.find((item) => item.id === reading.apartmentId) ?? apartments[0]
    const key = `${reading.apartmentId}-${reading.month}`
    const existing = rows.get(key) ?? {
      id: key,
      apartment,
      month: reading.month,
      meters: {},
      usageValue: 0,
    }
    const usageValue = Math.max(reading.currentValue - reading.previousValue, 0)

    rows.set(key, {
      ...existing,
      meters: {
        ...existing.meters,
        [reading.waterType]: {
          previousValue: reading.previousValue,
          currentValue: reading.currentValue,
          usageValue,
        },
      },
      usageValue: existing.usageValue + usageValue,
    })
  })

  return Array.from(rows.values())
}

const getMaintenanceRun = (blockId: string, month: string) => generateMonthlyMaintenance(blockId, month, maintenanceEngineInput)

const getApartmentMaintenanceTotal = (apartmentId: string, month: string) => {
  const apartment = apartments.find((item) => item.id === apartmentId)
  if (!apartment) return null

  const run = getMaintenanceRun(apartment.blockId, month)
  return run.apartmentTotals.find((total) => total.apartmentId === apartmentId) ?? null
}

const getApartmentAllocationTotal = (apartmentId: string, month: string) => {
  const apartment = apartments.find((item) => item.id === apartmentId)
  if (!apartment) return 0

  const maintenanceTotal = getApartmentMaintenanceTotal(apartmentId, month)
  if (maintenanceTotal && maintenanceTotal.lines.length > 0) return maintenanceTotal.total

  const residentCount = residentCountForApartment(apartmentId)
  const blockResidentCount = getBlockResidentCount(apartment.blockId)
  if (residentCount === 0 || blockResidentCount === 0) return 0

  const blockUtilityTotal = utilityMonthlyInputs
    .filter((input) => input.blockId === apartment.blockId && input.month === month)
    .reduce((sum, input) => sum + input.amount, 0)
  const blockExpenseTotal = adminExpenses
    .filter((expense) => expense.blockId === apartment.blockId && expense.month === month)
    .reduce((sum, expense) => sum + expense.amount, 0)

  return ((blockUtilityTotal + blockExpenseTotal) * residentCount) / blockResidentCount
}

const getInvoiceTotal = (invoice: Invoice) => getApartmentAllocationTotal(invoice.apartmentId, invoice.month)

const getInvoicePaidAmount = (invoiceId: string, sourcePayments = payments) =>
  sourcePayments
    .filter((payment) => payment.invoiceId === invoiceId && payment.verificationStatus !== 'unverified')
    .reduce((sum, payment) => sum + payment.amount, 0)

const getInvoiceStatus = (invoice: Invoice, sourcePayments = payments): InvoiceStatus => {
  const totalAmount = getInvoiceTotal(invoice)
  const paidAmount = getInvoicePaidAmount(invoice.id, sourcePayments)
  if (paidAmount >= totalAmount) return 'paid'
  return new Date(invoice.dueDate) < today ? 'overdue' : 'unpaid'
}

const initialCensorReviews: CensorReview[] = [
  {
    id: 'REV-INV-0501',
    targetId: 'INV-2026-0501',
    targetType: 'invoice',
    state: 'pending',
    severity: 'warning',
    requestedBy: 'Admin',
    requestedAt: '2026-05-09T10:15:00',
    noteKey: 'censor.review.notes.invoiceBalance',
    history: [
      { id: 'REV-INV-0501-H1', at: '2026-05-09T10:15:00', actor: 'Admin', state: 'pending', noteKey: 'censor.review.history.submitted' },
    ],
  },
  {
    id: 'REV-MNT-A-202605',
    targetId: 'RUN-block-a-2026-05',
    targetType: 'maintenance',
    state: 'needs_changes',
    severity: 'warning',
    requestedBy: 'Admin',
    requestedAt: '2026-05-09T13:30:00',
    noteKey: 'censor.review.notes.maintenanceDraft',
    history: [
      { id: 'REV-MNT-A-202605-H1', at: '2026-05-09T13:30:00', actor: 'Admin', state: 'pending', noteKey: 'censor.review.history.submitted' },
      { id: 'REV-MNT-A-202605-H2', at: '2026-05-09T15:05:00', actor: 'Censor', state: 'needs_changes', noteKey: 'censor.review.history.requestedChanges' },
    ],
  },
  {
    id: 'REV-ANM-APT-B-41-202605',
    targetId: 'apt-b-41-2026-05',
    targetType: 'anomaly',
    state: 'pending',
    severity: 'critical',
    requestedBy: 'System',
    requestedAt: '2026-05-10T08:00:00',
    noteKey: 'censor.review.notes.consumptionSpike',
    history: [
      { id: 'REV-ANM-APT-B-41-202605-H1', at: '2026-05-10T08:00:00', actor: 'System', state: 'pending', noteKey: 'censor.review.history.flagged' },
    ],
  },
]

const getApartmentFinancialStatus = (apartmentId: string): FinancialStatus => {
  const apartmentInvoices = invoices.filter((invoice) => invoice.apartmentId === apartmentId)
  if (apartmentInvoices.some((invoice) => getInvoiceStatus(invoice) === 'overdue')) return 'overdue'
  if (apartmentInvoices.some((invoice) => getInvoiceStatus(invoice) === 'unpaid')) return 'due'
  return 'current'
}

const getApartmentDebtBalance = (apartmentId: string) =>
  invoices
    .filter((invoice) => invoice.apartmentId === apartmentId)
    .reduce((sum, invoice) => sum + Math.max(getInvoiceTotal(invoice) - getInvoicePaidAmount(invoice.id), 0), 0)

const enrichApartment = (apartment: Apartment) => {
  const apartmentResidents = getApartmentResidents(apartment.id)
  return {
    ...apartment,
    block: blocks.find((block) => block.id === apartment.blockId),
    staircase: apartment.staircaseId ? staircases.find((staircase) => staircase.id === apartment.staircaseId) : undefined,
    primaryOwner: getPrimaryOwner(apartment),
    residents: apartmentResidents,
    residentCount: apartmentResidents.filter((resident) => resident.status === 'active').length,
    setupStatus: apartment.setupStatus ?? 'configured',
    familyLabel: formatApartment(apartment),
    debtBalance: getApartmentDebtBalance(apartment.id),
    financialStatus: getApartmentFinancialStatus(apartment.id),
  }
}

const getApartmentSetupStatus = (apartment: Apartment): ApartmentSetupStatus => apartment.setupStatus ?? 'configured'

const buildApartmentLabel = (apartment: Apartment, sourceResidents: Resident[]) => {
  const primaryOwner = apartment.primaryOwnerId ? sourceResidents.find((resident) => resident.id === apartment.primaryOwnerId) : undefined
  return [
    primaryOwner?.name ?? (apartment.familyName || null),
    `Apt ${apartment.number}`,
    apartment.staircaseId ? `Sc ${getStaircaseLabel(apartment.staircaseId)}` : null,
    `Bl ${getBlockLabel(apartment.blockId)}`,
  ].filter(Boolean).join(' - ')
}

const enrichApartmentWithResidents = (apartment: Apartment, sourceResidents: Resident[], sourceLinks: ResidentApartment[]) => {
  const apartmentResidents = getApartmentResidents(apartment.id, sourceResidents, sourceLinks)
  return {
    ...apartment,
    block: blocks.find((block) => block.id === apartment.blockId),
    staircase: apartment.staircaseId ? staircases.find((staircase) => staircase.id === apartment.staircaseId) : undefined,
    primaryOwner: (apartment.primaryOwnerId ? sourceResidents.find((resident) => resident.id === apartment.primaryOwnerId) : undefined) ?? apartmentResidents[0],
    residents: apartmentResidents,
    residentCount: apartmentResidents.filter((resident) => resident.status === 'active').length,
    setupStatus: getApartmentSetupStatus(apartment),
    familyLabel: buildApartmentLabel(apartment, sourceResidents),
    debtBalance: getApartmentDebtBalance(apartment.id),
    financialStatus: getApartmentFinancialStatus(apartment.id),
  }
}

const enrichInvoice = (invoice: Invoice) => {
  const apartment = apartments.find((item) => item.id === invoice.apartmentId)
  const maintenanceTotal = getApartmentMaintenanceTotal(invoice.apartmentId, invoice.month)
  return {
    ...invoice,
    apartment,
    familyLabel: apartment ? formatApartment(apartment) : '',
    maintenanceTotal,
    residents: apartment ? getApartmentResidents(apartment.id) : [],
    totalAmount: getInvoiceTotal(invoice),
    paidAmount: getInvoicePaidAmount(invoice.id),
    status: getInvoiceStatus(invoice),
  }
}

export const getBlockNavigationItems = () => blocks

export const getBlockStaircases = (blockId: string) => staircases.filter((staircase) => staircase.blockId === blockId)

export const useBlocksOverview = () => {
  const { account, role } = React.useContext(RoleContext)
  const [search, setSearch] = React.useState('')
  const scopedBlocks = React.useMemo(() => filterBlocksForAccount(blocks, toScope(account, role), buildingAdminAssignments, residentApartments, apartments), [account, role])
  const scopedApartments = React.useMemo(() => filterApartmentsForAccount(apartments, toScope(account, role), buildingAdminAssignments, residentApartments), [account, role])

  const blockOverviews = React.useMemo(
    () =>
      scopedBlocks.map((block) => {
        const blockApartments = scopedApartments.filter((apartment) => apartment.blockId === block.id)
        const blockResidents = getResidentsForApartments(blockApartments.map((apartment) => apartment.id))
        const blockInvoices = invoices.map(enrichInvoice).filter((invoice) => invoice.apartment?.blockId === block.id)
        const blockPayments = payments.filter((payment) => blockInvoices.some((invoice) => invoice.id === payment.invoiceId))
        const staircaseCount = block.hasStaircases ? staircases.filter((staircase) => staircase.blockId === block.id).length : 0
        const activeAssignment = buildingAdminAssignments.find((assignment) => assignment.blockId === block.id && assignment.isActive)

        return {
          block,
          activeAdmin: administrators.find((admin) => admin.id === activeAssignment?.adminId),
          assignmentHistory: buildingAdminAssignments.filter((assignment) => assignment.blockId === block.id),
          apartmentCount: blockApartments.length,
          residentCount: blockResidents.length,
          staircaseCount,
          totalInvoices: blockInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
          totalPayments: blockPayments.reduce((sum, payment) => sum + payment.amount, 0),
          unpaidBalance: blockInvoices.reduce((sum, invoice) => sum + Math.max(invoice.totalAmount - invoice.paidAmount, 0), 0),
        }
      }),
    [scopedApartments, scopedBlocks],
  )

  const filteredBlocks = React.useMemo(
    () => blockOverviews.filter((overview) => overview.block.name.toLowerCase().includes(search.trim().toLowerCase())),
    [blockOverviews, search],
  )

  return {
    blockOverviews: filteredBlocks,
    search,
    setSearch,
  }
}

export const useResidents = () => {
  const { account, role } = React.useContext(RoleContext)
  const [blockFilter, setBlockFilter] = React.useState('all')
  const [financialStatusFilter, setFinancialStatusFilter] = React.useState<FinancialStatus | 'all'>('all')
  const [selectedApartmentId, setSelectedApartmentId] = React.useState<string | null>(null)
  const [residentRecords, setResidentRecords] = React.useState<Resident[]>(residents)
  const [residentApartmentRecords, setResidentApartmentRecords] = React.useState<ResidentApartment[]>(residentApartments)

  const scopedApartments = React.useMemo(() => filterApartmentsForAccount(apartments, toScope(account, role), buildingAdminAssignments, residentApartmentRecords), [account, role, residentApartmentRecords])
  const scopedBlocks = React.useMemo(() => filterBlocksForAccount(blocks, toScope(account, role), buildingAdminAssignments, residentApartmentRecords, apartments), [account, role, residentApartmentRecords])
  const enrichedApartments = React.useMemo(() => scopedApartments.map((apartment) => enrichApartmentWithResidents(apartment, residentRecords, residentApartmentRecords)), [residentApartmentRecords, residentRecords, scopedApartments])

  const filteredApartments = React.useMemo(
    () =>
      enrichedApartments.filter((apartment) => {
        const matchesBlock = blockFilter === 'all' || apartment.blockId === blockFilter
        const matchesFinancial = financialStatusFilter === 'all' || apartment.financialStatus === financialStatusFilter
        return matchesBlock && matchesFinancial
      }),
    [blockFilter, enrichedApartments, financialStatusFilter],
  )

  const groupedApartments = React.useMemo(
    () =>
      filteredApartments.reduce<Record<string, typeof enrichedApartments>>((acc, apartment) => {
        acc[apartment.blockId] = [...(acc[apartment.blockId] ?? []), apartment]
        return acc
      }, {}),
    [filteredApartments],
  )

  const selectedApartment = enrichedApartments.find((apartment) => apartment.id === selectedApartmentId) ?? null
  const selectedInvoices = invoices.filter((invoice) => invoice.apartmentId === selectedApartment?.id).map(enrichInvoice)
  const selectedPayments = payments.filter((payment) => payment.apartmentId === selectedApartment?.id)
  const selectedReadings = getWaterReadingRows(waterReadings
    .filter((reading) => reading.apartmentId === selectedApartment?.id)
  )

  const scopedApartmentIds = new Set(scopedApartments.map((apartment) => apartment.id))
  const residentSummaries = residentRecords.map((resident) => {
    const activeLinks = residentApartmentRecords.filter((link) => link.residentId === resident.id && !link.ownershipEndDate && scopedApartmentIds.has(link.apartmentId))
    return {
      ...resident,
      apartments: activeLinks
        .map((link) => scopedApartments.find((apartment) => apartment.id === link.apartmentId))
        .filter((apartment): apartment is Apartment => Boolean(apartment)),
      activeLinks,
    }
  }).filter((resident) => resident.apartments.length > 0 || role === 'Admin')

  const addResident = (input: { name: string; email?: string; phone?: string; apartmentId?: string; accountStatus: ResidentAccountStatus }) => {
    const nextResident: Resident = {
      id: `R-MANUAL-${Date.now()}`,
      name: input.name,
      status: 'active',
      accountStatus: input.accountStatus,
      email: input.email || undefined,
      phone: input.phone || undefined,
    }

    setResidentRecords((items) => [nextResident, ...items])
    const apartmentId = input.apartmentId
    if (apartmentId) {
      setResidentApartmentRecords((links) => [{
        id: `RA-${nextResident.id}-${apartmentId}`,
        residentId: nextResident.id,
        apartmentId,
        ownershipType: 'tenant',
        ownershipStartDate: today.toISOString().slice(0, 10),
        isPrimaryResidence: true,
      }, ...links])
    }
  }

  const assignResidentToApartment = (residentId: string, apartmentId: string) => {
    const alreadyAssigned = residentApartmentRecords.some((link) => link.residentId === residentId && link.apartmentId === apartmentId && !link.ownershipEndDate)
    if (alreadyAssigned) return

    setResidentApartmentRecords((links) => [{
      id: `RA-${residentId}-${apartmentId}-${Date.now()}`,
      residentId,
      apartmentId,
      ownershipType: 'tenant',
      ownershipStartDate: today.toISOString().slice(0, 10),
      isPrimaryResidence: false,
    }, ...links])
  }

  const unassignResidentFromApartment = (residentId: string, apartmentId: string) => {
    setResidentApartmentRecords((links) => links.map((link) => (
      link.residentId === residentId && link.apartmentId === apartmentId && !link.ownershipEndDate
        ? { ...link, ownershipEndDate: today.toISOString().slice(0, 10), isPrimaryResidence: false }
        : link
    )))
  }

  return {
    addResident,
    assignResidentToApartment,
    blocks: scopedBlocks,
    blockFilter,
    financialStatusFilter,
    groupedApartments,
    residents: residentSummaries,
    selectedApartment,
    selectedInvoices,
    selectedPayments,
    selectedReadings,
    scopedApartments: enrichedApartments,
    setBlockFilter,
    setFinancialStatusFilter,
    setSelectedApartmentId,
    unassignResidentFromApartment,
  }
}

export const useFinance = () => {
  const { account, role } = React.useContext(RoleContext)
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<PaymentMethod | 'all'>('all')
  const [cashEntries, setCashEntries] = React.useState<CashPayment[]>(cashPayments)
  const scopedApartmentIds = React.useMemo(
    () => new Set(filterApartmentsForAccount(apartments, toScope(account, role), buildingAdminAssignments, residentApartments).map((apartment) => apartment.id)),
    [account, role],
  )

  const enrichedInvoices = React.useMemo(() => invoices.filter((invoice) => scopedApartmentIds.has(invoice.apartmentId)).map(enrichInvoice), [scopedApartmentIds])

  const enrichedPayments = React.useMemo(
    () =>
      payments
        .filter((payment) => scopedApartmentIds.has(payment.apartmentId))
        .filter((payment) => paymentMethodFilter === 'all' || payment.method === paymentMethodFilter)
        .map((payment) => {
          const apartment = apartments.find((item) => item.id === payment.apartmentId)
          return {
            ...payment,
            apartment,
            familyLabel: apartment ? formatApartment(apartment) : '',
            invoice: invoices.find((invoice) => invoice.id === payment.invoiceId),
          }
        }),
    [paymentMethodFilter, scopedApartmentIds],
  )

  const enrichedCashEntries = React.useMemo(
    () =>
      cashEntries.filter((payment) => scopedApartmentIds.has(payment.apartmentId)).map((payment) => {
        const apartment = apartments.find((item) => item.id === payment.apartmentId)
        return {
          ...payment,
          apartment,
          familyLabel: apartment ? formatApartment(apartment) : '',
        }
      }),
    [cashEntries, scopedApartmentIds],
  )

  const setCashStatus = (id: string, status: VerificationStatus) => {
    setCashEntries((entries) => entries.map((entry) => (entry.id === id ? { ...entry, status } : entry)))
  }

  const registerCashPayment = (invoice: Invoice & { totalAmount: number }) => {
    const nextEntry: CashPayment = {
      id: `CASH-${Date.now()}`,
      apartmentId: invoice.apartmentId,
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      registeredBy: 'Admin',
      status: 'unverified',
      timestamp: new Date().toISOString(),
      notesKey: 'finance.cash.notes.manual',
    }

    setCashEntries((entries) => [nextEntry, ...entries])
  }

  const monthlyRevenue = payments
    .filter((payment) => scopedApartmentIds.has(payment.apartmentId))
    .filter((payment) => payment.verificationStatus !== 'unverified')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const scopedBlocks = filterBlocksForAccount(blocks, toScope(account, role), buildingAdminAssignments, residentApartments, apartments)
  const maintenanceRuns = scopedBlocks.map((block) => getMaintenanceRun(block.id, reportMonths[0]))
  const isEmptyDataAccount = account.dataMode === 'mock-empty-ui' || account.dataMode === 'backend-ready-empty' || account.dataMode === 'mock-configured-block'

  return {
    cashAwaitingVerification: (isEmptyDataAccount ? enrichedCashEntries : cashEntries).filter((entry) => entry.status === 'unverified').length,
    cashEntries: enrichedCashEntries,
    invoices: enrichedInvoices,
    monthlyRevenue,
    maintenanceRuns,
    paymentMethodFilter,
    payments: enrichedPayments,
    registerCashPayment,
    setCashStatus,
    setPaymentMethodFilter,
    unpaidInvoices: enrichedInvoices.filter((invoice) => invoice.status !== 'paid').length,
  }
}

export const useConsumption = () => {
  const { account, role } = React.useContext(RoleContext)
  const [blockFilter, setBlockFilter] = React.useState('all')
  const scopedApartments = React.useMemo(() => filterApartmentsForAccount(apartments, toScope(account, role), buildingAdminAssignments, residentApartments), [account, role])
  const scopedBlocks = React.useMemo(() => filterBlocksForAccount(blocks, toScope(account, role), buildingAdminAssignments, residentApartments, apartments), [account, role])
  const scopedApartmentIds = React.useMemo(() => new Set(scopedApartments.map((apartment) => apartment.id)), [scopedApartments])

  const readings = React.useMemo(
    () =>
      getWaterReadingRows(waterReadings
        .filter((reading) => scopedApartmentIds.has(reading.apartmentId))
      )
        .filter((reading) => blockFilter === 'all' || reading.apartment.blockId === blockFilter),
    [blockFilter, scopedApartmentIds],
  )

  const summaries = React.useMemo(
    () =>
      readings.map((reading) => {
        const anomaly = reading.usageValue > 35 ? 'critical' : reading.usageValue > 20 ? 'warning' : 'normal'
        return { apartment: reading.apartment, month: reading.month, usageValue: reading.usageValue, anomaly }
      }),
    [readings],
  )
  const waterBalances = React.useMemo(
    () =>
      scopedBlocks.map((block) => ({
        block,
        month: reportMonths[0],
        ...calculateWaterBalance(block.id, reportMonths[0], maintenanceEngineInput),
      })),
    [scopedBlocks],
  )

  return {
    blockFilter,
    blocks: scopedBlocks,
    readings,
    summaries,
    setBlockFilter,
    waterBalances,
  }
}

export const useReports = () => {
  const { account, role } = React.useContext(RoleContext)
  const [month, setMonth] = React.useState(reportMonths[0])
  const [block, setBlock] = React.useState('all')
  const scopedApartments = React.useMemo(() => filterApartmentsForAccount(apartments, toScope(account, role), buildingAdminAssignments, residentApartments), [account, role])
  const scopedBlocks = React.useMemo(() => filterBlocksForAccount(blocks, toScope(account, role), buildingAdminAssignments, residentApartments, apartments), [account, role])
  const scopedApartmentIds = React.useMemo(() => new Set(scopedApartments.map((apartment) => apartment.id)), [scopedApartments])

  const filteredInvoices = invoices
    .filter((invoice) => scopedApartmentIds.has(invoice.apartmentId))
    .map(enrichInvoice)
    .filter((invoice) => invoice.month === month && (block === 'all' || invoice.apartment?.blockId === block))
  const filteredReadings = waterReadings
    .map((reading) => ({
      ...reading,
      apartment: apartments.find((apartment) => apartment.id === reading.apartmentId) ?? apartments[0],
      usageValue: reading.currentValue - reading.previousValue,
    }))
    .filter((reading) => scopedApartmentIds.has(reading.apartmentId) && reading.month === month && (block === 'all' || reading.apartment.blockId === block))
  const reportApartments = scopedApartments.filter((apartment) => block === 'all' || apartment.blockId === block)
  const reportRuns = (block === 'all' ? scopedBlocks : scopedBlocks.filter((item) => item.id === block)).map((item) => getMaintenanceRun(item.id, month))

  return {
    block,
    blocks: scopedBlocks,
    month,
    months: reportMonths,
    preview: {
      invoiceCount: filteredInvoices.length,
      revenue: filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      surfaceTotal: reportApartments.reduce((sum, apartment) => sum + apartment.usableSurface, 0),
      boilerTax: reportRuns.reduce(
        (sum, run) => sum + run.apartmentTotals.reduce((runSum, total) => runSum + total.lines.filter((line) => line.categoryId === 'boiler_tax').reduce((lineSum, line) => lineSum + line.amount, 0), 0),
        0,
      ),
      waterUsage: filteredReadings.reduce((sum, reading) => sum + reading.usageValue, 0),
    },
    setBlock,
    setMonth,
  }
}

export const useCensorReviews = () => {
  const { account, role } = React.useContext(RoleContext)
  const [reviewItems, setReviewItems] = React.useState<CensorReview[]>(initialCensorReviews)
  const isEmptyDataCensor = role === 'Censor' && (account.dataMode === 'mock-empty-ui' || account.dataMode === 'backend-ready-empty')
  const scopedReviewItems: CensorReview[] = isEmptyDataCensor ? [] : reviewItems
  const scopedApartments = React.useMemo(() => filterApartmentsForAccount(apartments, toScope(account, role), buildingAdminAssignments, residentApartments), [account, role])
  const scopedBlocks = React.useMemo(() => filterBlocksForAccount(blocks, toScope(account, role), buildingAdminAssignments, residentApartments, apartments), [account, role])
  const scopedApartmentIds = React.useMemo(() => new Set(scopedApartments.map((apartment) => apartment.id)), [scopedApartments])

  const enrichedInvoices = React.useMemo(() => invoices.filter((invoice) => scopedApartmentIds.has(invoice.apartmentId)).map(enrichInvoice), [scopedApartmentIds])
  const maintenanceRuns = React.useMemo(() => scopedBlocks.map((block) => getMaintenanceRun(block.id, reportMonths[0])), [scopedBlocks])
  const anomalySummaries = React.useMemo(
    () =>
      getWaterReadingRows(waterReadings
        .filter((reading) => scopedApartmentIds.has(reading.apartmentId))
      )
        .map((reading) => {
          const anomaly: AnomalyLevel = reading.usageValue > 35 ? 'critical' : reading.usageValue > 20 ? 'warning' : 'normal'
          return { apartment: reading.apartment, id: reading.id, month: reading.month, usageValue: reading.usageValue, anomaly }
        })
        .filter((summary) => summary.anomaly !== 'normal'),
    [scopedApartmentIds],
  )

  const setReviewState = (reviewId: string, state: ReviewState) => {
    setReviewItems((items) =>
      items.map((item) =>
        item.id === reviewId
          ? {
              ...item,
              state,
              history: [
                {
                  id: `${reviewId}-${Date.now()}`,
                  actor: 'Censor',
                  at: new Date().toISOString(),
                  state,
                  noteKey: `censor.review.history.${state}`,
                },
                ...item.history,
              ],
            }
          : item,
      ),
    )
  }

  const invoiceReviews = scopedReviewItems
    .filter((review) => review.targetType === 'invoice')
    .map((review) => ({ review, invoice: enrichedInvoices.find((invoice) => invoice.id === review.targetId) }))
    .filter((item): item is { review: CensorReview; invoice: (typeof enrichedInvoices)[number] } => Boolean(item.invoice))

  const maintenanceReviews = scopedReviewItems
    .filter((review) => review.targetType === 'maintenance')
    .map((review) => ({ review, run: maintenanceRuns.find((run) => run.id === review.targetId) }))
    .filter((item): item is { review: CensorReview; run: (typeof maintenanceRuns)[number] } => Boolean(item.run))

  const anomalyReviews = scopedReviewItems
    .filter((review) => review.targetType === 'anomaly')
    .map((review) => ({ review, anomaly: anomalySummaries.find((summary) => summary.id === review.targetId) }))
    .filter((item): item is { review: CensorReview; anomaly: (typeof anomalySummaries)[number] } => Boolean(item.anomaly))

  return {
    anomalyReviews,
    invoiceReviews,
    maintenanceReviews,
    pendingCount: scopedReviewItems.filter((review) => review.state === 'pending').length,
    rejectedCount: scopedReviewItems.filter((review) => review.state === 'rejected' || review.state === 'needs_changes').length,
    reviewItems: scopedReviewItems,
    setReviewState,
  }
}

export const useBlockContext = (blockId?: string, month = reportMonths[0]) => {
  const { account, role } = React.useContext(RoleContext)
  const scopedBlocks = React.useMemo(() => filterBlocksForAccount(blocks, toScope(account, role), buildingAdminAssignments, residentApartments, apartments), [account, role])
  const scopedApartments = React.useMemo(() => filterApartmentsForAccount(apartments, toScope(account, role), buildingAdminAssignments, residentApartments), [account, role])
  const block = scopedBlocks.find((item) => item.id === blockId) ?? null
  const blockApartments = scopedApartments.filter((apartment) => apartment.blockId === block?.id).map(enrichApartment)
  const blockInvoices = invoices
    .map(enrichInvoice)
    .filter((invoice) => invoice.month === month && invoice.apartment?.blockId === block?.id)
  const blockPayments = payments.filter((payment) => blockInvoices.some((invoice) => invoice.id === payment.invoiceId))
  const blockStaircases = block ? getBlockStaircases(block.id) : []

  const staircaseTotals = blockStaircases.map((staircase) => {
    const staircaseInvoices = blockInvoices.filter((invoice) => invoice.apartment?.staircaseId === staircase.id)
    const staircasePayments = blockPayments.filter((payment) => staircaseInvoices.some((invoice) => invoice.id === payment.invoiceId))
    return {
      staircase,
      invoiceTotal: staircaseInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      paymentTotal: staircasePayments.reduce((sum, payment) => sum + payment.amount, 0),
      cashTotal: staircasePayments.filter((payment) => payment.method === 'cash').reduce((sum, payment) => sum + payment.amount, 0),
      bankTotal: staircasePayments.filter((payment) => payment.method === 'bank').reduce((sum, payment) => sum + payment.amount, 0),
      apartmentCount: blockApartments.filter((apartment) => apartment.staircaseId === staircase.id).length,
    }
  })

  return {
    apartmentCount: blockApartments.length,
    block,
    blockApartments,
    blockInvoices,
    blockPayments,
    residentCount: blockApartments.reduce((sum, apartment) => sum + apartment.residentCount, 0),
    staircaseTotals,
    totalInvoices: blockInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    totalPayments: blockPayments.reduce((sum, payment) => sum + payment.amount, 0),
  }
}

export const useResidentPortal = () => {
  const { account, role } = React.useContext(RoleContext)
  const resident = residents.find((item) => item.id === account.residentId) ?? residents[0]
  const residentApartmentLinks = residentApartments.filter((link) => link.residentId === resident?.id && !link.ownershipEndDate)
  const residentApartmentIds = new Set(residentApartmentLinks.map((link) => link.apartmentId))
  const residentApartmentsList = apartments
    .filter((item) => residentApartmentIds.has(item.id))
    .map((apartment) => {
      const block = blocks.find((item) => item.id === apartment.blockId)
      const activeAssignment = buildingAdminAssignments.find((assignment) => assignment.blockId === apartment.blockId && assignment.isActive)
      return {
        ...enrichApartment(apartment),
        residentApartment: residentApartmentLinks.find((link) => link.apartmentId === apartment.id),
        activeAdmin: administrators.find((admin) => admin.id === activeAssignment?.adminId),
        block,
      }
    })
  const apartment = residentApartmentsList.find((item) => item.residentApartment?.isPrimaryResidence) ?? residentApartmentsList[0] ?? enrichApartment(apartments[0])
  const residentInvoices = invoices.filter((invoice) => residentApartmentIds.has(invoice.apartmentId)).map(enrichInvoice)
  const residentPayments = payments.filter((payment) => residentApartmentIds.has(payment.apartmentId))
  const residentReadings = getWaterReadingRows(waterReadings
    .filter((reading) => residentApartmentIds.has(reading.apartmentId))
  )
  const currentBalance = residentInvoices.reduce((sum, invoice) => sum + Math.max(invoice.totalAmount - invoice.paidAmount, 0), 0)
  const apartmentsByBlock = residentApartmentsList.reduce<Record<string, typeof residentApartmentsList>>((acc, item) => {
    acc[item.blockId] = [...(acc[item.blockId] ?? []), item]
    return acc
  }, {})

  return {
    apartment,
    apartments: residentApartmentsList,
    apartmentsByBlock,
    currentBalance,
    familyLabel: formatApartment(apartment),
    lastPayment: residentPayments[0],
    resident,
    residentInvoices,
    residentPayments,
    residentReadings,
    role,
  }
}
