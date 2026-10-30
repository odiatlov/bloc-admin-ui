import React from 'react'
import { usePageFilter } from '../../../../../hooks/usePageFilter'
import { Alert, Box, CircularProgress, MenuItem, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import AppDialog from '../../../../../components/shared/AppDialog'
import EmptyState from '../../../../../components/shared/EmptyState'
import FilterBar from '../../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import { useFinanceBlocks, useFinancePeriodBounds, useFinanceWorkspace } from '../../../../../hooks/useFinanceWorkspace'
import type { FinanceBlock, FinanceWorkspace } from '../../../../../types/finance'

type Props = { children: (workspace: FinanceWorkspace, block: FinanceBlock, refresh: () => void, onDirty: (dirty: boolean) => void) => React.ReactNode }
const FinanceWorkspacePanel: React.FC<Props> = ({ children }) => {
  const { t } = useTranslation()
  const [search] = useSearchParams()
  const blocks = useFinanceBlocks()
  const initialSelection = () => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - 1)
    return { blockId: search.get('blockId') ?? '', period: /^\d{4}-(0[1-9]|1[0-2])$/.test(search.get('period') ?? '') ? search.get('period')! : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` }
  }
  const [savedSelection, setSelection] = usePageFilter('finance.selection', initialSelection,
    search.has('blockId') || search.has('period') ? initialSelection() : undefined)
  const block = blocks.blocks.find((item) => item.id === savedSelection.blockId) ?? blocks.blocks.at(0)
  const bounds = useFinancePeriodBounds(block?.id ?? '')
  const period = bounds.minimumPeriod > bounds.maximumPeriod || savedSelection.period > bounds.maximumPeriod ? bounds.maximumPeriod
    : savedSelection.period < bounds.minimumPeriod && bounds.minimumPeriod <= bounds.maximumPeriod ? bounds.minimumPeriod
      : savedSelection.period
  const selection = { blockId: block?.id ?? '', period }
  const [dirty, setDirty] = React.useState(false)
  const [pending, setPending] = React.useState<typeof selection | null>(null)
  const workspace = useFinanceWorkspace(!bounds.loading && !bounds.error ? block?.id ?? '' : '', period)
  const refresh = React.useCallback(() => {
    bounds.refresh()
    workspace.refresh()
  }, [bounds.refresh, workspace.refresh])
  const changeSelection = (next: typeof selection) => {
    if (next.blockId === selection.blockId && next.period === selection.period) return
    if (dirty) setPending(next)
    else setSelection(next)
  }
  if (blocks.error) return <LoadErrorState helperText={blocks.error} onRetry={blocks.refresh} />
  if (blocks.loading) return <CircularProgress aria-label={t('finance.billing.loading')} />
  if (!block) return <EmptyState headline={t('finance.billing.noBlocks')} helperText={t('finance.billing.noBlocksHelp')} actionLabel={t('finance.billing.manageBlocks')} actionTo="/admin/blocks" />
  return <Box sx={{ display: 'grid', gap: 2 }}>
    <FilterBar>
      <TextField select size="small" label={t('finance.billing.block')} value={block.id} onChange={(event) => changeSelection({ ...selection, blockId: event.target.value })}>
        {blocks.blocks.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
      </TextField>
      <AppDatePicker monthOnly confirmOnAccept label={t('finance.billing.billingMonth')} value={period}
        minDate={`${bounds.minimumPeriod}-01`} maxDate={`${bounds.maximumPeriod}-01`}
        disabled={bounds.loading || !!bounds.error || bounds.minimumPeriod > bounds.maximumPeriod}
        onChange={(period) => changeSelection({ blockId: block.id, period })} />
    </FilterBar>
    {(bounds.loading || workspace.loading) && <CircularProgress aria-label={t('finance.billing.loading')} />}
    {bounds.error ? <LoadErrorState helperText={bounds.error} onRetry={bounds.refresh} />
      : workspace.error && <LoadErrorState helperText={workspace.error} onRetry={workspace.refresh} />}
    {!bounds.loading && !bounds.error && workspace.data && children(workspace.data, block, refresh, setDirty)}
    <AppDialog open={!!pending} title={t('finance.billing.unsavedTitle')} cancelLabel={t('common.cancel')} confirmLabel={t('finance.billing.discard')} onCancel={() => setPending(null)} onConfirm={() => { if (pending) setSelection(pending); setDirty(false); setPending(null) }}>
      <Alert severity="warning">{t('finance.billing.unsavedBody')}</Alert>
    </AppDialog>
  </Box>
}
export default FinanceWorkspacePanel
