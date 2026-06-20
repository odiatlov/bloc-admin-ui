const currencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'RON' })
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
const percentFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, style: 'percent' })
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

const normalizeNumber = (value: number | null | undefined) => (
  typeof value === 'number' && Number.isFinite(value) ? value : 0
)

export const formatCurrency = (value: number | null | undefined) => currencyFormatter.format(normalizeNumber(value))

export const formatNumber = (value: number | null | undefined) => numberFormatter.format(normalizeNumber(value))

export const formatSquareMeters = (value: number | null | undefined) => `${formatNumber(value)} m²`

export const formatPercent = (value: number | null | undefined) => percentFormatter.format(normalizeNumber(value) / 100)

export const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split('-')
  if (!year || !monthNumber) return month

  const date = new Date(Number(year), Number(monthNumber) - 1, 1)
  return Number.isNaN(date.getTime()) ? month : monthFormatter.format(date)
}

export const formatFriendlyDateTime = (
  value: string | Date,
  options: { atLabel?: string; now?: Date; todayLabel?: string } = {},
) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const now = options.now ?? new Date('2026-05-10T12:00:00')
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  return `${isToday ? options.todayLabel ?? 'Today' : shortDateFormatter.format(date)} ${options.atLabel ?? 'at'} ${timeFormatter.format(date)}`
}
