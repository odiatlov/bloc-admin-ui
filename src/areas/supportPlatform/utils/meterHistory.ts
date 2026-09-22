import type { IndexReading } from '../services/superAdminWaterApi'

export const readingPeriod = (reading: Pick<IndexReading, 'year' | 'month'>) =>
  `${reading.year}-${String(reading.month).padStart(2, '0')}`

export const recordedMonths = (readings: IndexReading[]) => [...new Set(readings.map(readingPeriod))].sort()

export const indexAxisBounds = (values: number[]) => {
  if (!values.length) return { min: 0, max: 1 }
  const low = Math.min(...values)
  const high = Math.max(...values)
  const padding = Math.max((high - low) * 0.2, 0.05)
  const min = Math.max(0, Math.floor((low - padding) * 100) / 100)
  const max = Math.ceil((high + padding) * 100) / 100
  return { min, max }
}

export const fitHistoryRange = (months: string[], range?: { from: string, to: string }) => {
  if (!months.length) return { from: '', to: '' }
  return range && months.includes(range.from) && months.includes(range.to) && range.from <= range.to
    ? range : { from: months[0], to: months[months.length - 1] }
}

export const historySegments = (readings: IndexReading[]) => {
  const segments: IndexReading[][] = []
  for (const reading of [...readings].sort((a, b) => a.year - b.year || a.month - b.month)) {
    const previous = segments.at(-1)?.at(-1)
    if (!previous || reading.year * 12 + reading.month - (previous.year * 12 + previous.month) !== 1) segments.push([])
    segments[segments.length - 1].push(reading)
  }
  return segments
}

export const registrationDate = (value: string, locale: string) => {
  // SQL datetime2 stores SubmittedAt in UTC without a timezone suffix.
  const date = new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString(locale)
}
