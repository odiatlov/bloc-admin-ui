import React from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { residentsApi } from '../services/residentsApi'
import { waterReadingsApi } from '../services/waterReadingsApi'
import type { ResidentApartmentSummary, ResidentResponse } from '../types/management'
import type { ApartmentWaterMeterResponse, BlockWaterReadingSettingsResponse, ResidentWaterMeterRow } from '../types/waterReadings'

const getCurrentPeriod = () => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

const toPeriodKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`

const buildConfiguredPeriods = (settings: BlockWaterReadingSettingsResponse[]) => {
  const current = getCurrentPeriod()
  const currentDate = new Date(current.year, current.month - 1, 1)
  const periods: Array<{ blockId: string, year: number, month: number }> = []

  settings
    .filter((item) => item.isEnabled && item.firstSubmissionDate)
    .forEach((item) => {
      const firstSubmissionDate = new Date(item.firstSubmissionDate as string)
      const periodDate = new Date(firstSubmissionDate.getFullYear(), firstSubmissionDate.getMonth() - 1, 1)

      while (periodDate <= currentDate) {
        periods.push({
          blockId: item.blockId,
          year: periodDate.getFullYear(),
          month: periodDate.getMonth() + 1,
        })
        periodDate.setMonth(periodDate.getMonth() + 1)
      }
    })

  return periods
}

export const formatResidentApartmentLabel = (apartment: ResidentApartmentSummary) => [
  apartment.blockName ? `Block ${apartment.blockName}` : null,
  apartment.staircaseName ? `Staircase ${apartment.staircaseName}` : null,
  `Apartment ${apartment.apartmentNumber}`,
].filter(Boolean).join(', ')

export const useResidentWaterIndex = () => {
  const { account } = React.useContext(RoleContext)
  const [{ year, month }, setPeriod] = React.useState(getCurrentPeriod)
  const [resident, setResident] = React.useState<ResidentResponse | null>(null)
  const [meters, setMeters] = React.useState<ApartmentWaterMeterResponse[]>([])
  const [rows, setRows] = React.useState<ResidentWaterMeterRow[]>([])
  const [hasConfiguredSubmissionDate, setHasConfiguredSubmissionDate] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!account.residentId) {
      setResident(null)
      setMeters([])
      setRows([])
      setHasConfiguredSubmissionDate(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextResident = await residentsApi.getById(account.residentId)
      const apartmentIds = new Set(nextResident.apartments.map((apartment) => apartment.apartmentId))
      const blockIds = Array.from(new Set(nextResident.apartments.map((apartment) => apartment.blockId)))
      const settings = await Promise.all(blockIds.map((blockId) => waterReadingsApi.getBlockSettings(blockId)))
      const configuredPeriods = buildConfiguredPeriods(settings)
      const configuredBlockIds = new Set(configuredPeriods.map((period) => period.blockId))
      const nextMeters = (await Promise.all(
        nextResident.apartments.map((apartment) => waterReadingsApi.getMetersByApartment(apartment.apartmentId)),
      )).flat().filter((meter) => meter.isActive)
      const readings = (await Promise.all(
        configuredPeriods.map((period) => waterReadingsApi.getReadingsByBlock(period.blockId, period.year, period.month)),
      )).flat().filter((reading) => apartmentIds.has(reading.apartmentId))
      const readingsByMeterPeriod = new Map(readings.map((reading) => [
        `${reading.apartmentWaterMeterId}-${toPeriodKey(reading.year, reading.month)}`,
        reading,
      ]))

      setResident(nextResident)
      setHasConfiguredSubmissionDate(configuredPeriods.length > 0)
      setMeters(nextMeters.filter((meter) => {
        const apartment = nextResident.apartments.find((item) => item.apartmentId === meter.apartmentId)
        return apartment ? configuredBlockIds.has(apartment.blockId) : false
      }))
      setRows(configuredPeriods.flatMap((period) => nextMeters
        .filter((meter) => {
          const apartment = nextResident.apartments.find((item) => item.apartmentId === meter.apartmentId)
          return apartment?.blockId === period.blockId
        })
        .map((meter) => {
          const apartment = nextResident.apartments.find((item) => item.apartmentId === meter.apartmentId)
          const reading = readingsByMeterPeriod.get(`${meter.id}-${toPeriodKey(period.year, period.month)}`)

          return {
            id: `${meter.id}-${period.year}-${period.month}`,
            meterId: meter.id,
            apartmentId: meter.apartmentId,
            apartmentNumber: apartment?.apartmentNumber ?? '',
            blockId: apartment?.blockId ?? '',
            blockName: apartment?.blockName ?? '',
            staircaseName: apartment?.staircaseName ?? null,
            utilityType: meter.utilityType,
            locationType: meter.locationType,
            meterName: meter.name,
            year: period.year,
            month: period.month,
            value: reading?.value ?? null,
            submittedAt: reading?.submittedAt ?? null,
          }
        })))
    } catch (nextError) {
      setResident(null)
      setMeters([])
      setRows([])
      setHasConfiguredSubmissionDate(false)
      setError(nextError instanceof Error ? nextError.message : 'Water index data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [account.residentId])

  const submitReading = React.useCallback(async (
    meterId: string,
    value: number,
    period: { year: number, month: number } = { year, month },
  ) => {
    setSubmitting(true)
    try {
      await waterReadingsApi.createReading({
        apartmentWaterMeterId: meterId,
        month: period.month,
        value,
        year: period.year,
      })
      await load()
    } finally {
      setSubmitting(false)
    }
  }, [load, month, year])

  const submitReadings = React.useCallback(async (
    readings: Array<{ meterId: string, value: number }>,
    period: { year: number, month: number } = { year, month },
  ) => {
    setSubmitting(true)
    try {
      for (const reading of readings) {
        await waterReadingsApi.createReading({
          apartmentWaterMeterId: reading.meterId,
          month: period.month,
          value: reading.value,
          year: period.year,
        })
      }
      await load()
    } finally {
      setSubmitting(false)
    }
  }, [load, month, year])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [load])

  return {
    apartments: resident?.apartments ?? [],
    error,
    hasConfiguredSubmissionDate,
    loading,
    meters,
    month,
    refresh: load,
    resident,
    rows,
    setPeriod,
    submitReading,
    submitReadings,
    submitting,
    year,
  }
}
