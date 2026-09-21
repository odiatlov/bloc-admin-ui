import { useEffect, useState } from 'react'
import { superAdminWaterApi, type SuperAdminConsumptionReport, type WaterAdministrator } from '../services/superAdminWaterApi'
import { getConsumptionStart } from '../../../utils/readingPeriods'

export const useSuperAdminConsumption = () => {
  const [admin, setAdmin] = useState('all')
  const [block, setBlock] = useState('all')
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [revision, setRevision] = useState(0)
  const [administrators, setAdministrators] = useState<WaterAdministrator[]>([])
  const [result, setResult] = useState<{ key: string, report: SuperAdminConsumptionReport, error: boolean }>()
  const key = `${admin}:${block}:${period}:${revision}`
  const ready = result?.key === key
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const admins = await superAdminWaterApi.administrators()
        const report = await superAdminWaterApi.consumption(period, admin, block)
        if (cancelled) return
        setAdministrators(admins)
        const validAdmin = admin === 'all' || admin === 'unassigned' || admins.some((item) => item.id === admin)
        if (!validAdmin) { setAdmin('all'); setBlock('all') }
        const validBlock = block === 'all' || report.blocks.some((item) => item.id === block)
        if (!validBlock) setBlock('all')
        const start = getConsumptionStart(report.blocks, validBlock ? block : 'all')
        if (start && period < start) setPeriod(start)
        setResult({ key, report, error: false })
      } catch {
        if (!cancelled) setResult({ key, report: { blocks: [], rows: [] }, error: true })
      }
    }
    void load()
    return () => { cancelled = true }
  }, [key, admin, block, period, revision])
  const report = ready && !result.error ? result.report : undefined
  const blocks = report?.blocks ?? []
  return {
    admin, setAdmin: (value: string) => { setAdmin(value); setBlock('all') },
    block, setBlock, period, setPeriod, administrators, blocks,
    minimumPeriod: getConsumptionStart(blocks, block),
    rows: (report?.rows ?? []).filter((row) => {
      const start = getConsumptionStart(blocks, row.apartment.blockId)
      return !start || period >= start
    }),
    loading: !ready, error: ready && result.error,
    refresh: () => setRevision((value) => value + 1),
  }
}
