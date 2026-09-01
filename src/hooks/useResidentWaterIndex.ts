import React from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { residentsApi } from '../services/residentsApi'
import { waterReadingsApi } from '../services/waterReadingsApi'
import type { ResidentApartmentSummary, ResidentResponse } from '../types/management'
import type { ApartmentWaterMeterResponse, ResidentWaterMeterRow } from '../types/waterReadings'

const getCurrentPeriod = () => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
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
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!account.residentId) {
      setResident(null)
      setMeters([])
      setRows([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextResident = await residentsApi.getById(account.residentId)
      const apartmentIds = new Set(nextResident.apartments.map((apartment) => apartment.apartmentId))
      const blockIds = Array.from(new Set(nextResident.apartments.map((apartment) => apartment.blockId)))
      const nextMeters = (await Promise.all(
        nextResident.apartments.map((apartment) => waterReadingsApi.getMetersByApartment(apartment.apartmentId)),
      )).flat().filter((meter) => meter.isActive)
      const readings = (await Promise.all(
        blockIds.map((blockId) => waterReadingsApi.getReadingsByBlock(blockId, year, month)),
      )).flat().filter((reading) => apartmentIds.has(reading.apartmentId))
      const readingsByMeterId = new Map(readings.map((reading) => [reading.apartmentWaterMeterId, reading]))

      setResident(nextResident)
      setMeters(nextMeters)
      setRows(nextMeters.map((meter) => {
        const apartment = nextResident.apartments.find((item) => item.apartmentId === meter.apartmentId)
        const reading = readingsByMeterId.get(meter.id)

        return {
          id: `${meter.id}-${year}-${month}`,
          meterId: meter.id,
          apartmentId: meter.apartmentId,
          apartmentNumber: apartment?.apartmentNumber ?? '',
          blockId: apartment?.blockId ?? '',
          blockName: apartment?.blockName ?? '',
          staircaseName: apartment?.staircaseName ?? null,
          utilityType: meter.utilityType,
          locationType: meter.locationType,
          meterName: meter.name,
          year,
          month,
          value: reading?.value ?? null,
          submittedAt: reading?.submittedAt ?? null,
        }
      }))
    } catch (nextError) {
      setResident(null)
      setMeters([])
      setRows([])
      setError(nextError instanceof Error ? nextError.message : 'Water index data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [account.residentId, month, year])

  const submitReading = React.useCallback(async (meterId: string, value: number) => {
    setSubmitting(true)
    try {
      await waterReadingsApi.createReading({
        apartmentWaterMeterId: meterId,
        month,
        value,
        year,
      })
      await load()
    } finally {
      setSubmitting(false)
    }
  }, [load, month, year])

  const submitReadings = React.useCallback(async (readings: Array<{ meterId: string, value: number }>) => {
    setSubmitting(true)
    try {
      for (const reading of readings) {
        await waterReadingsApi.createReading({
          apartmentWaterMeterId: reading.meterId,
          month,
          value: reading.value,
          year,
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
