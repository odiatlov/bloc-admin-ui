import React from 'react'
import {
  adminExpenses,
  allocationRules,
  apartments,
  blocks,
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
  type ReviewState,
  type VerificationStatus,
} from '../mocks/apartmentData'
import { calculateWaterBalance, generateMonthlyMaintenance } from '../utils/maintenanceEngine'

const currencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'RON' })

export const formatCurrency = (value: number) => currencyFormatter.format(value)

export const getBlockLabel = (blockId: string) => blocks.find((block) => block.id === blockId)?.name ?? blockId

export const getApartmentResidents = (apartmentId: string) =>
  residents.filter((resident) => resident.apartmentId === apartmentId)

export const getPrimaryOwner = (apartment: Apartment) =>
  residents.find((resident) => resident.id === apartment.primaryOwnerId) ?? getApartmentResidents(apartment.id)[0]

export const getStaircaseLabel = (staircaseId?: string) =>
  staircaseId ? staircases.find((staircase) => staircase.id === staircaseId)?.name : undefined

export const formatApartment = (apartment: Apartment) => {
  const owner = getPrimaryOwner(apartment)
  const staircase = getStaircaseLabel(apartment.staircaseId)
  return [
    owner?.name ?? apartment.familyName,
    `Apt ${apartment.number}`,
    staircase ? `Sc ${staircase}` : null,
    `Bl ${getBlockLabel(apartment.blockId)}`,
  ].filter(Boolean).join(' - ')
}

const today = new Date('2026-05-10T00:00:00')
const firstResidentId = residents[0]?.id ?? ''

const residentCountForApartment = (apartmentId: string) =>
  residents.filter((resident) => resident.apartmentId === apartmentId && resident.status === 'active').length

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
  residents,
  rules: allocationRules,
  waterReadings,
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
    familyLabel: formatApartment(apartment),
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
  const [search, setSearch] = React.useState('')

  const blockOverviews = React.useMemo(
    () =>
      blocks.map((block) => {
        const blockApartments = apartments.filter((apartment) => apartment.blockId === block.id)
        const blockResidents = residents.filter((resident) => blockApartments.some((apartment) => apartment.id === resident.apartmentId))
        const blockInvoices = invoices.map(enrichInvoice).filter((invoice) => invoice.apartment?.blockId === block.id)
        const blockPayments = payments.filter((payment) => blockInvoices.some((invoice) => invoice.id === payment.invoiceId))
        const staircaseCount = block.hasStaircases ? staircases.filter((staircase) => staircase.blockId === block.id).length : 0

        return {
          block,
          apartmentCount: blockApartments.length,
          residentCount: blockResidents.length,
          staircaseCount,
          totalInvoices: blockInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
          totalPayments: blockPayments.reduce((sum, payment) => sum + payment.amount, 0),
          unpaidBalance: blockInvoices.reduce((sum, invoice) => sum + Math.max(invoice.totalAmount - invoice.paidAmount, 0), 0),
        }
      }),
    [],
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
  const [blockFilter, setBlockFilter] = React.useState('all')
  const [financialStatusFilter, setFinancialStatusFilter] = React.useState<FinancialStatus | 'all'>('all')
  const [selectedApartmentId, setSelectedApartmentId] = React.useState<string | null>(null)

  const enrichedApartments = React.useMemo(() => apartments.map(enrichApartment), [])

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
  const selectedReadings = waterReadings
    .filter((reading) => reading.apartmentId === selectedApartment?.id)
    .map((reading) => ({ ...reading, apartment: apartments.find((apartment) => apartment.id === reading.apartmentId) ?? apartments[0] }))

  return {
    blocks,
    blockFilter,
    financialStatusFilter,
    groupedApartments,
    selectedApartment,
    selectedInvoices,
    selectedPayments,
    selectedReadings,
    setBlockFilter,
    setFinancialStatusFilter,
    setSelectedApartmentId,
  }
}

export const useFinance = () => {
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<PaymentMethod | 'all'>('all')
  const [cashEntries, setCashEntries] = React.useState<CashPayment[]>(cashPayments)

  const enrichedInvoices = React.useMemo(() => invoices.map(enrichInvoice), [])

  const enrichedPayments = React.useMemo(
    () =>
      payments
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
    [paymentMethodFilter],
  )

  const enrichedCashEntries = React.useMemo(
    () =>
      cashEntries.map((payment) => {
        const apartment = apartments.find((item) => item.id === payment.apartmentId)
        return {
          ...payment,
          apartment,
          familyLabel: apartment ? formatApartment(apartment) : '',
        }
      }),
    [cashEntries],
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
    .filter((payment) => payment.verificationStatus !== 'unverified')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const maintenanceRuns = blocks.map((block) => getMaintenanceRun(block.id, reportMonths[0]))

  return {
    cashAwaitingVerification: cashEntries.filter((entry) => entry.status === 'unverified').length,
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
  const [blockFilter, setBlockFilter] = React.useState('all')

  const readings = React.useMemo(
    () =>
      waterReadings
        .map((reading) => ({
          ...reading,
          apartment: apartments.find((apartment) => apartment.id === reading.apartmentId) ?? apartments[0],
          usageValue: reading.currentValue - reading.previousValue,
        }))
        .filter((reading) => blockFilter === 'all' || reading.apartment.blockId === blockFilter),
    [blockFilter],
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
      blocks.map((block) => ({
        block,
        month: reportMonths[0],
        ...calculateWaterBalance(block.id, reportMonths[0], maintenanceEngineInput),
      })),
    [],
  )

  return {
    blockFilter,
    blocks,
    readings,
    summaries,
    setBlockFilter,
    waterBalances,
  }
}

export const useReports = () => {
  const [month, setMonth] = React.useState(reportMonths[0])
  const [block, setBlock] = React.useState('all')

  const filteredInvoices = invoices
    .map(enrichInvoice)
    .filter((invoice) => invoice.month === month && (block === 'all' || invoice.apartment?.blockId === block))
  const filteredReadings = waterReadings
    .map((reading) => ({
      ...reading,
      apartment: apartments.find((apartment) => apartment.id === reading.apartmentId) ?? apartments[0],
      usageValue: reading.currentValue - reading.previousValue,
    }))
    .filter((reading) => reading.month === month && (block === 'all' || reading.apartment.blockId === block))

  return {
    block,
    blocks,
    month,
    months: reportMonths,
    preview: {
      invoiceCount: filteredInvoices.length,
      revenue: filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      waterUsage: filteredReadings.reduce((sum, reading) => sum + reading.usageValue, 0),
    },
    setBlock,
    setMonth,
  }
}

export const useCensorReviews = () => {
  const [reviewItems, setReviewItems] = React.useState<CensorReview[]>(initialCensorReviews)

  const enrichedInvoices = React.useMemo(() => invoices.map(enrichInvoice), [])
  const maintenanceRuns = React.useMemo(() => blocks.map((block) => getMaintenanceRun(block.id, reportMonths[0])), [])
  const anomalySummaries = React.useMemo(
    () =>
      waterReadings
        .map((reading) => {
          const apartment = apartments.find((item) => item.id === reading.apartmentId) ?? apartments[0]
          const usageValue = reading.currentValue - reading.previousValue
          const anomaly: AnomalyLevel = usageValue > 35 ? 'critical' : usageValue > 20 ? 'warning' : 'normal'
          return { apartment, id: `${apartment.id}-${reading.month}`, month: reading.month, usageValue, anomaly }
        })
        .filter((summary) => summary.anomaly !== 'normal'),
    [],
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

  const invoiceReviews = reviewItems
    .filter((review) => review.targetType === 'invoice')
    .map((review) => ({ review, invoice: enrichedInvoices.find((invoice) => invoice.id === review.targetId) }))
    .filter((item): item is { review: CensorReview; invoice: (typeof enrichedInvoices)[number] } => Boolean(item.invoice))

  const maintenanceReviews = reviewItems
    .filter((review) => review.targetType === 'maintenance')
    .map((review) => ({ review, run: maintenanceRuns.find((run) => run.id === review.targetId) }))
    .filter((item): item is { review: CensorReview; run: (typeof maintenanceRuns)[number] } => Boolean(item.run))

  const anomalyReviews = reviewItems
    .filter((review) => review.targetType === 'anomaly')
    .map((review) => ({ review, anomaly: anomalySummaries.find((summary) => summary.id === review.targetId) }))
    .filter((item): item is { review: CensorReview; anomaly: (typeof anomalySummaries)[number] } => Boolean(item.anomaly))

  return {
    anomalyReviews,
    invoiceReviews,
    maintenanceReviews,
    pendingCount: reviewItems.filter((review) => review.state === 'pending').length,
    rejectedCount: reviewItems.filter((review) => review.state === 'rejected' || review.state === 'needs_changes').length,
    reviewItems,
    setReviewState,
  }
}

export const useBlockContext = (blockId?: string, month = reportMonths[0]) => {
  const block = blocks.find((item) => item.id === blockId) ?? null
  const blockApartments = apartments.filter((apartment) => apartment.blockId === block?.id).map(enrichApartment)
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
  const resident = residents.find((item) => item.id === firstResidentId) ?? residents[0]
  const apartment = apartments.find((item) => item.id === resident?.apartmentId) ?? apartments[0]
  const residentInvoices = invoices.filter((invoice) => invoice.apartmentId === apartment.id).map(enrichInvoice)
  const residentPayments = payments.filter((payment) => payment.apartmentId === apartment.id)
  const residentReadings = waterReadings
    .filter((reading) => reading.apartmentId === apartment.id)
    .map((reading) => ({
      ...reading,
      apartment,
      usageValue: reading.currentValue - reading.previousValue,
    }))
  const currentBalance = residentInvoices.reduce((sum, invoice) => sum + Math.max(invoice.totalAmount - invoice.paidAmount, 0), 0)

  return {
    apartment,
    currentBalance,
    familyLabel: formatApartment(apartment),
    lastPayment: residentPayments[0],
    resident,
    residentInvoices,
    residentPayments,
    residentReadings,
  }
}
