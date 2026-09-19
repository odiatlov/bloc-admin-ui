import React from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { waterReadingsApi } from '../services/waterReadingsApi'
import type { WaterConsumptionReportResponse } from '../types/waterReadings'

export const useWaterConsumptions = () => {
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
  const blocks = ready ? result.report.blocks : []
  const blockFilter = selection.scope === scope && (selection.blockId === 'all' || blocks.some((block) => block.id === selection.blockId))
    ? selection.blockId : 'all'

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [year, month] = period.split('-').map(Number)
        const report = role === 'Admin' || role === 'Censor'
          ? await waterReadingsApi.getConsumptions(year, month, role) : { blocks: [], rows: [] }
        if (!cancelled) setResult({ key, report, error: null })
      } catch (error) {
        if (!cancelled) setResult({ key, report: { blocks: [], rows: [] }, error: error instanceof Error ? error.message : 'Unable to load consumption.' })
      }
    }
    if (!accountsLoading && !accountsError) void load()
    return () => { cancelled = true }
  }, [accountsError, accountsLoading, key, period, role])

  return {
    blocks, blockFilter, setBlockFilter: (blockId: string) => setSelection({ scope, blockId }), period, setPeriod,
    rows: ready ? result.report.rows.filter((row) => blockFilter === 'all' || row.apartment.blockId === blockFilter) : [],
    loading: accountsLoading || (!accountsError && result.key !== key),
    error: accountsError || (result.key === key ? result.error : null),
    refresh: () => {
      if (accountsError) void refreshAccounts()
      setRevision((value) => value + 1)
    },
  }
}
