import React from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { waterReadingsApi } from '../services/waterReadingsApi'
import type { WaterConsumptionReportResponse } from '../types/waterReadings'
import { getConsumptionStart, getReadingPeriods } from '../utils/readingPeriods'

export const useWaterConsumptions = ({ registeredPeriodsOnly = false, submissionPeriodsOnly = false } = {}) => {
  const { account, role, accountsLoading, accountsError, refreshAccounts } = React.useContext(RoleContext)
  const [selection, setSelection] = React.useState({ scope: '', blockId: 'all' })
  const [period, setPeriod] = React.useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [revision, setRevision] = React.useState(0)
  const [result, setResult] = React.useState<{ key: string, report: WaterConsumptionReportResponse, error: string | null }>({
    key: '', report: { blocks: [], rows: [] }, error: null,
  })
  const scope = `${account.id}:${role}`
  const key = `${scope}:${period}:${revision}`
  const ready = result.key === key && !accountsLoading && !accountsError
  const blocks = result.key.startsWith(`${scope}:`) && !accountsLoading && !accountsError ? result.report.blocks : []
  const blockFilter = selection.scope === scope && (selection.blockId === 'all' || blocks.some((block) => block.id === selection.blockId))
    ? selection.blockId : 'all'
  const availablePeriods = getReadingPeriods(blocks, blockFilter)
  const minimumPeriod = submissionPeriodsOnly ? getConsumptionStart(blocks, blockFilter) : null
  const invalidPeriod = ready && !result.error && period !== 'all' && (
    (registeredPeriodsOnly && !availablePeriods.includes(period)) || (minimumPeriod !== null && period < minimumPeriod))

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [year, month] = period === 'all' ? [null, null] : period.split('-').map(Number)
        const report = role === 'Admin' || role === 'Censor'
          ? await waterReadingsApi.getConsumptions(year, month, role) : { blocks: [], rows: [] }
        if (!cancelled) {
          const selectedBlock = selection.scope === scope ? selection.blockId : 'all'
          const minimum = submissionPeriodsOnly ? getConsumptionStart(report.blocks, selectedBlock) : null
          if (minimum && period < minimum) setPeriod(minimum)
          if (registeredPeriodsOnly && period !== 'all'
            && !getReadingPeriods(report.blocks, selectedBlock).includes(period)) setPeriod('all')
          setResult({ key, report, error: null })
        }
      } catch (error) {
        if (!cancelled) setResult({ key, report: { blocks: [], rows: [] }, error: error instanceof Error ? error.message : 'Unable to load consumption.' })
      }
    }
    if (!accountsLoading && !accountsError) void load()
    return () => { cancelled = true }
  }, [accountsError, accountsLoading, key, period, role, registeredPeriodsOnly, submissionPeriodsOnly, scope, selection.scope, selection.blockId])

  return {
    blocks, availablePeriods, minimumPeriod, blockFilter, setBlockFilter: (blockId: string) => {
      setSelection({ scope, blockId })
      const minimum = submissionPeriodsOnly ? getConsumptionStart(blocks, blockId) : null
      if (minimum && period < minimum) setPeriod(minimum)
      if (registeredPeriodsOnly && period !== 'all') {
        if (!getReadingPeriods(blocks, blockId).includes(period)) setPeriod('all')
      }
    }, period, setPeriod,
    rows: ready && !invalidPeriod ? result.report.rows.filter((row) => {
      const start = submissionPeriodsOnly ? getConsumptionStart(blocks, row.apartment.blockId) : null
      return (blockFilter === 'all' || row.apartment.blockId === blockFilter) && (!start || period >= start)
    }) : [],
    loading: accountsLoading || invalidPeriod || (!accountsError && result.key !== key),
    error: accountsError || (result.key === key ? result.error : null),
    refresh: () => {
      if (accountsError) void refreshAccounts()
      setRevision((value) => value + 1)
    },
  }
}
