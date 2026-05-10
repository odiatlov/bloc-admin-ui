import React from 'react'
import {
  buildingBlocks,
  cashPayments,
  consumptionSummaries,
  invoices,
  payments,
  reportMonths,
  residents,
  waterReadings,
  type CashPayment,
  type FinancialStatus,
  type Invoice,
  type PaymentMethod,
  type VerificationStatus,
} from '../mocks/apartmentData'

const currencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' })

export const formatCurrency = (value: number) => currencyFormatter.format(value)

export const formatApartment = (apartment: { block: string; floor: number; number: string }) =>
  `${apartment.block}-${apartment.number}`

const firstResidentId = residents[0]?.id ?? ''

export const useResidents = () => {
  const [blockFilter, setBlockFilter] = React.useState('all')
  const [financialStatusFilter, setFinancialStatusFilter] = React.useState<FinancialStatus | 'all'>('all')
  const [selectedResidentId, setSelectedResidentId] = React.useState<string | null>(null)

  const filteredResidents = React.useMemo(
    () =>
      residents.filter((resident) => {
        const matchesBlock = blockFilter === 'all' || resident.apartment.block === blockFilter
        const matchesFinancial = financialStatusFilter === 'all' || resident.financialStatus === financialStatusFilter
        return matchesBlock && matchesFinancial
      }),
    [blockFilter, financialStatusFilter],
  )

  const groupedResidents = React.useMemo(
    () =>
      filteredResidents.reduce<Record<string, typeof residents>>((acc, resident) => {
        acc[resident.apartment.block] = [...(acc[resident.apartment.block] ?? []), resident]
        return acc
      }, {}),
    [filteredResidents],
  )

  const selectedResident = residents.find((resident) => resident.id === selectedResidentId) ?? null
  const selectedInvoices = invoices.filter((invoice) => invoice.residentId === selectedResident?.id)
  const selectedPayments = payments.filter((payment) => payment.residentId === selectedResident?.id)
  const selectedReadings = waterReadings.filter((reading) => reading.residentId === selectedResident?.id)

  return {
    blocks: buildingBlocks,
    blockFilter,
    financialStatusFilter,
    groupedResidents,
    selectedInvoices,
    selectedPayments,
    selectedReadings,
    selectedResident,
    setBlockFilter,
    setFinancialStatusFilter,
    setSelectedResidentId,
  }
}

export const useFinance = () => {
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<PaymentMethod | 'all'>('all')
  const [cashEntries, setCashEntries] = React.useState<CashPayment[]>(cashPayments)

  const enrichedInvoices = React.useMemo(
    () =>
      invoices.map((invoice) => ({
        ...invoice,
        resident: residents.find((resident) => resident.id === invoice.residentId),
      })),
    [],
  )

  const enrichedPayments = React.useMemo(
    () =>
      payments
        .filter((payment) => paymentMethodFilter === 'all' || payment.method === paymentMethodFilter)
        .map((payment) => ({
          ...payment,
          resident: residents.find((resident) => resident.id === payment.residentId),
          invoice: invoices.find((invoice) => invoice.id === payment.invoiceId),
        })),
    [paymentMethodFilter],
  )

  const enrichedCashEntries = React.useMemo(
    () =>
      cashEntries.map((payment) => ({
        ...payment,
        resident: residents.find((resident) => resident.id === payment.residentId),
      })),
    [cashEntries],
  )

  const setCashStatus = (id: string, status: VerificationStatus) => {
    setCashEntries((entries) => entries.map((entry) => (entry.id === id ? { ...entry, status } : entry)))
  }

  const registerCashPayment = (invoice: Invoice) => {
    const nextEntry: CashPayment = {
      id: `CASH-${Date.now()}`,
      residentId: invoice.residentId,
      amount: invoice.totalAmount,
      registeredBy: 'Admin',
      status: 'unverified',
      timestamp: new Date().toISOString(),
      notesKey: 'finance.cash.notes.manual',
    }

    setCashEntries((entries) => [nextEntry, ...entries])
  }

  return {
    cashAwaitingVerification: cashEntries.filter((entry) => entry.status === 'unverified').length,
    cashEntries: enrichedCashEntries,
    invoices: enrichedInvoices,
    monthlyRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
    paymentMethodFilter,
    payments: enrichedPayments,
    registerCashPayment,
    setCashStatus,
    setPaymentMethodFilter,
    unpaidInvoices: invoices.filter((invoice) => invoice.status !== 'paid').length,
  }
}

export const useConsumption = () => {
  const [blockFilter, setBlockFilter] = React.useState('all')

  const readings = React.useMemo(
    () =>
      waterReadings
        .filter((reading) => blockFilter === 'all' || reading.apartment.block === blockFilter)
        .map((reading) => ({
          ...reading,
          usageValue: reading.currentValue - reading.previousValue,
        })),
    [blockFilter],
  )

  const summaries = React.useMemo(
    () => consumptionSummaries.filter((summary) => blockFilter === 'all' || summary.apartment.block === blockFilter),
    [blockFilter],
  )

  return {
    blockFilter,
    blocks: buildingBlocks,
    readings,
    summaries,
    setBlockFilter,
  }
}

export const useReports = () => {
  const [month, setMonth] = React.useState(reportMonths[0])
  const [block, setBlock] = React.useState('all')

  const filteredInvoices = invoices.filter((invoice) => invoice.month === month)
  const filteredReadings = consumptionSummaries.filter(
    (summary) => summary.month === month && (block === 'all' || summary.apartment.block === block),
  )

  return {
    block,
    blocks: buildingBlocks,
    month,
    months: reportMonths,
    preview: {
      invoiceCount: filteredInvoices.length,
      revenue: filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      waterUsage: filteredReadings.reduce((sum, summary) => sum + summary.usageValue, 0),
    },
    setBlock,
    setMonth,
  }
}

export const useResidentPortal = () => {
  const resident = residents.find((item) => item.id === firstResidentId) ?? residents[0]
  const residentInvoices = invoices.filter((invoice) => invoice.residentId === resident?.id)
  const residentPayments = payments.filter((payment) => payment.residentId === resident?.id)
  const residentReadings = waterReadings.filter((reading) => reading.residentId === resident?.id)
  const currentBalance = residentInvoices
    .filter((invoice) => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

  return {
    currentBalance,
    lastPayment: residentPayments[0],
    resident,
    residentInvoices,
    residentPayments,
    residentReadings,
  }
}
