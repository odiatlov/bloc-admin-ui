import React from 'react'
import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Paper, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import ActionButtons from '../../../../../components/shared/ActionButtons'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { financeApi } from '../../../../../services/financeApi'
import type { FinanceApartment, FinanceExpense, FinancePeriodData, FinanceSupplyInput, FinanceWorkspace } from '../../../../../types/finance'
import { useFinanceActionScope } from '../../../../../hooks/useFinanceWorkspace'
import { FinanceNumber, FinanceSelect } from './FinanceFields'
import { financeGrid } from './financePresentation'
import FinanceSection from './FinanceSection'

type Props = { workspace: FinanceWorkspace; refresh: () => void; onDirty: (dirty: boolean) => void }

const FinancePeriodEditor: React.FC<Props> = ({ workspace, refresh, onDirty }) => {
  const { t, i18n } = useTranslation()
  const [data, setData] = React.useState<FinancePeriodData>(() => structuredClone(workspace.periodData))
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const active = useFinanceActionScope()
  const hasStaleInputs = workspace.periodData.expenses.some((entry) => !workspace.configuration.charges.some((charge) => charge.id === entry.chargeId)) || workspace.periodData.supplyInputs.some((entry) => !workspace.configuration.supplyGroups.some((group) => group.id === entry.supplyGroupId))
  const update = (next: FinancePeriodData) => { setData(next); setDirty(true); onDirty(true) }
  const money = (amount: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'RON' }).format(amount)
  const apartmentLabel = (id: string) => { const apartment = workspace.apartments.find((row) => row.id === id); return apartment ? `${apartment.staircaseName ? `${apartment.staircaseName} / ` : ''}${apartment.number} — ${apartment.contactName}` : '' }
  const expense = (chargeId: string): FinanceExpense => data.expenses.find((item) => item.chargeId === chargeId) ?? { chargeId, notApplicable: false, manualAmounts: [] }
  const setExpense = (chargeId: string, changes: Partial<FinanceExpense>) => update({ ...data, expenses: [...data.expenses.filter((item) => item.chargeId !== chargeId), { ...expense(chargeId), ...changes }] })
  const supply = (supplyGroupId: string): FinanceSupplyInput => data.supplyInputs.find((item) => item.supplyGroupId === supplyGroupId) ?? { supplyGroupId, manualShares: [] }
  const setSupply = (supplyGroupId: string, changes: Partial<FinanceSupplyInput>) => update({ ...data, supplyInputs: [...data.supplyInputs.filter((item) => item.supplyGroupId !== supplyGroupId), { ...supply(supplyGroupId), ...changes }] })
  const save = async () => {
    setSaving(true); setError(null)
    try {
      const payload = { ...data, expenses: data.expenses.filter((entry) => workspace.configuration.charges.some((charge) => charge.id === entry.chargeId)), supplyInputs: data.supplyInputs.filter((entry) => workspace.configuration.supplyGroups.some((group) => group.id === entry.supplyGroupId)) }
      await financeApi.savePeriod(workspace.blockId, workspace.year, workspace.month, workspace.periodVersion, payload)
      if (!active.current) return
      setDirty(false); onDirty(false); refresh()
    }
    catch (nextError) { if (active.current) setError(nextError instanceof Error ? nextError.message : t('finance.billing.saveFailed')) }
    finally { if (active.current) setSaving(false) }
  }
  const occupantColumns: DataColumn<FinanceApartment>[] = [
    { key: 'apartment', label: t('finance.billing.apartment'), cardRole: 'primary', render: (row) => apartmentLabel(row.id) },
    { key: 'occupants', label: t('finance.billing.declaredOccupants'), render: (row) => <FinanceNumber decimal={0} label={t('finance.billing.declaredOccupants')} value={data.apartmentInputs.find((item) => item.apartmentId === row.id)?.declaredOccupants ?? row.declaredOccupants} onChange={(declaredOccupants) => update({ ...data, apartmentInputs: [...data.apartmentInputs.filter((item) => item.apartmentId !== row.id), { apartmentId: row.id, declaredOccupants }] })} /> },
    { key: 'mp', label: t('finance.billing.heatingMp'), render: (row) => row.heatingMp == null ? '—' : `${row.heatingMp.toFixed(1)} m²` },
    { key: 'cold', label: t('finance.billing.coldConsumption'), render: (row) => row.coldConsumption == null ? '—' : `${row.coldConsumption} m³` },
    { key: 'hot', label: t('finance.billing.hotConsumption'), render: (row) => row.hotConsumption == null ? '—' : `${row.hotConsumption} m³` },
  ]
  const charges = workspace.configuration.charges.filter((charge) => charge.enabled && (!charge.oneOff || charge.effectiveFromYear === workspace.year && charge.effectiveFromMonth === workspace.month) && (!charge.effectiveFromYear || charge.effectiveFromYear * 12 + (charge.effectiveFromMonth ?? 1) <= workspace.year * 12 + workspace.month) && (!charge.effectiveToYear || charge.effectiveToYear * 12 + (charge.effectiveToMonth ?? 12) >= workspace.year * 12 + workspace.month)).sort((a, b) => a.order - b.order)
  return <Box component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: 'grid', gap: 2 }}>
    <Alert severity="info">{t('finance.billing.expensesHelp')}</Alert>
    {hasStaleInputs && <Alert severity="warning">{t('finance.billing.staleInputs')}</Alert>}
    {charges.map((charge) => {
      const value = expense(charge.id)
      const group = workspace.configuration.supplyGroups.find((item) => item.id === charge.supplyGroupId)
      const coverage = group ?? charge
      const eligible = workspace.apartments.filter((row) => (coverage.scope === 'Block' || (coverage.scope === 'Staircase' ? row.staircaseId === coverage.staircaseId : coverage.apartmentIds.includes(row.id))) && (!group || row.meters.some((meter) => meter.utilityType === group.utilityType)))
      const manualTotal = value.manualAmounts.reduce((sum, row) => sum + row.amount, 0)
      const apartmentAmounts = <>
        {value.manualAmounts.map((entry, index) => {
          const change = (changes: Partial<typeof entry>) => setExpense(charge.id, { manualAmounts: value.manualAmounts.map((item, position) => position === index ? { ...item, ...changes } : item) })
          return <Box key={index} sx={{ ...financeGrid, alignItems: 'start' }}>
            <TextField select size="small" label={t('finance.billing.apartment')} value={entry.apartmentId} onChange={(event) => change({ apartmentId: event.target.value })}>
              <MenuItem value="">{t('finance.billing.notSet')}</MenuItem>
              {eligible.filter((item) => item.id === entry.apartmentId || !value.manualAmounts.some((row) => row.apartmentId === item.id)).map((row) => <MenuItem key={row.id} value={row.id}>{apartmentLabel(row.id)}</MenuItem>)}
            </TextField>
            <FinanceNumber label={t('finance.billing.amount')} value={entry.amount} onChange={(amount) => change({ amount: amount ?? 0 })} />
            <TextField size="small" required label={t('finance.billing.reason')} value={entry.reason} onChange={(event) => change({ reason: event.target.value })} />
            <ActionButtons variant="row" actions={[{ id: 'remove', label: t('finance.billing.remove'), icon: <DeleteIcon />, color: 'error', onClick: () => setExpense(charge.id, { manualAmounts: value.manualAmounts.filter((_, position) => position !== index) }) }]} />
          </Box>
        })}
        <Button startIcon={<AddIcon />} variant="outlined" disabled={value.manualAmounts.length >= eligible.length} onClick={() => setExpense(charge.id, { manualAmounts: [...value.manualAmounts, { apartmentId: eligible.find((row) => !value.manualAmounts.some((entry) => entry.apartmentId === row.id))?.id ?? '', amount: 0, reason: '' }] })}>{t('finance.billing.addManualAmount')}</Button>
        {charge.amountMode === 'Pool' && value.manualAmounts.length > 0 && <Alert severity={value.amount != null && manualTotal > value.amount ? 'warning' : 'info'}>{t('finance.billing.poolReconciliation', { allocated: money(manualTotal), remaining: value.amount == null ? '—' : money(value.amount - manualTotal), method: charge.remainderBasis ? t(`finance.billing.values.${charge.remainderBasis}`) : t('finance.billing.fullManualRequired') })}</Alert>}
      </>
      return <FinanceSection key={charge.id} title={charge.name}>
        <Typography color="text.secondary" variant="body2">{t(`finance.billing.values.${charge.amountMode}`)} · {t(`finance.billing.values.${charge.basis}`)} · {charge.supplyGroupId ? workspace.configuration.supplyGroups.find((group) => group.id === charge.supplyGroupId)?.name : charge.scope === 'Staircase' ? workspace.apartments.find((row) => row.staircaseId === charge.staircaseId)?.staircaseName : t(`finance.billing.values.${charge.scope}`)}</Typography>
        {charge.amountMode === 'Rate' && <Typography>{t('finance.billing.configuredRate', { value: money(charge.rate ?? 0) })}</Typography>}
        <FormControlLabel label={t('finance.billing.notApplicable')} control={<Checkbox checked={value.notApplicable} onChange={(event) => setExpense(charge.id, { notApplicable: event.target.checked, ...(event.target.checked ? { amount: null, manualAmounts: [] } : {}) })} />} />
        {!value.notApplicable && <>
          {charge.amountMode === 'Pool' && <Box sx={financeGrid}>
            <FinanceNumber label={t('finance.billing.billTotal')} value={value.amount} onChange={(amount) => setExpense(charge.id, { amount })} />
          </Box>}
          <FinanceSection compact title={t('finance.billing.optionalDetails')}>
            <Typography color="text.secondary" variant="body2">{t('finance.billing.optionalDetailsHelp')}</Typography>
            <Box sx={financeGrid}>
              {charge.amountMode !== 'Pool' && <FinanceNumber label={t('finance.billing.controlTotal')} value={value.amount} onChange={(amount) => setExpense(charge.id, { amount })} />}
              <TextField size="small" label={t('finance.billing.supplier')} value={value.supplier ?? ''} onChange={(event) => setExpense(charge.id, { supplier: event.target.value })} />
              <TextField size="small" label={t('finance.billing.documentReference')} value={value.documentReference ?? ''} onChange={(event) => setExpense(charge.id, { documentReference: event.target.value })} />
              <TextField size="small" label={t('finance.billing.sourceDocument')} helperText={t('finance.billing.sourceDocumentHelp')} value={value.sourceDocumentId ?? ''} onChange={(event) => setExpense(charge.id, { sourceDocumentId: event.target.value || null })} />
              <FinanceNumber label={t('finance.billing.sourceTotal')} value={value.sourceTotal} onChange={(sourceTotal) => setExpense(charge.id, { sourceTotal })} />
              <TextField size="small" label={t('finance.billing.description')} value={value.description ?? ''} onChange={(event) => setExpense(charge.id, { description: event.target.value })} />
            </Box>
          </FinanceSection>
          {charge.amountMode === 'Manual' ? <>
              <Typography variant="subtitle2">{t('finance.billing.manualAmounts')}</Typography>
              {apartmentAmounts}
            </> : <FinanceSection compact title={`${t('finance.billing.apartmentExceptions')}${value.manualAmounts.length ? ` (${value.manualAmounts.length})` : ''}`}>
              {apartmentAmounts}
            </FinanceSection>
          }
        </>}
      </FinanceSection>
    })}
    {workspace.configuration.supplyGroups.filter((group) => group.differenceMode !== 'None').map((group) => {
      const value = supply(group.id)
      const eligible = workspace.apartments.filter((row) => (group.scope === 'Block' || (group.scope === 'Staircase' ? row.staircaseId === group.staircaseId : group.apartmentIds.includes(row.id))) && row.meters.some((meter) => meter.utilityType === group.utilityType))
      return <FinanceSection key={group.id} title={t('finance.billing.supplyDifference', { name: group.name })}>
        <Typography color="text.secondary" variant="body2">{t(`finance.billing.values.${group.differenceMode}`)} · {t(`finance.billing.values.${group.differenceBasis}`)}</Typography>
        <Box sx={financeGrid}>
          {group.differenceMode === 'Manual' && <FinanceNumber min={-1000000000} label={t('finance.billing.differenceQuantity')} value={value.manualDifference} onChange={(manualDifference) => setSupply(group.id, { manualDifference })} />}
          {group.differenceMode === 'IncomingIndexes' && <>
            <FinanceNumber label={t('finance.billing.previousIndex')} value={value.previousIndex} onChange={(previousIndex) => setSupply(group.id, { previousIndex })} />
            <FinanceNumber label={t('finance.billing.currentIndex')} value={value.currentIndex} onChange={(currentIndex) => setSupply(group.id, { currentIndex })} />
          </>}
          {group.differenceMode === 'SupplierQuantity' && <FinanceNumber label={t('finance.billing.supplierQuantity')} value={value.supplierQuantity} onChange={(supplierQuantity) => setSupply(group.id, { supplierQuantity })} />}
        </Box>
        {group.differenceBasis === 'Manual' && <>
          {eligible.map((row) => { const entry = value.manualShares.find((item) => item.apartmentId === row.id); const change = (changes: { quantity?: number; reason?: string }) => setSupply(group.id, { manualShares: [...value.manualShares.filter((item) => item.apartmentId !== row.id), { apartmentId: row.id, quantity: 0, reason: '', ...entry, ...changes }] }); return <Box key={row.id} sx={financeGrid}>
            <Typography>{apartmentLabel(row.id)}</Typography>
            <FinanceNumber min={-1000000000} label={t('finance.billing.differenceQuantity')} value={entry?.quantity} onChange={(quantity) => change({ quantity: quantity ?? 0 })} />
            <TextField size="small" label={t('finance.billing.reason')} value={entry?.reason ?? ''} onChange={(event) => change({ reason: event.target.value })} />
          </Box> })}
        </>}
      </FinanceSection>
    })}
    <FinanceSection title={t('finance.billing.periodApartments')}>
      <Typography color="text.secondary" variant="body2">{t('finance.billing.periodOccupantsHelp')}</Typography>
      <ResponsiveDataView paginationId="finance-occupants" paginationResetKey={`${workspace.blockId}:${workspace.year}:${workspace.month}`} ariaLabel={t('finance.billing.periodApartments')} rows={workspace.apartments} columns={occupantColumns} getRowId={(row) => row.id} />
    </FinanceSection>
    <FinanceSection title={t('finance.billing.adjustments')}>
      {data.adjustments.map((entry, index) => {
        const change = (changes: Partial<typeof entry>) => update({ ...data, adjustments: data.adjustments.map((item, position) => position === index ? { ...item, ...changes } : item) })
        return <Paper key={entry.id} variant="outlined" sx={{ p: 2, display: 'grid', gap: 1.5 }}>
          <Box sx={financeGrid}>
            <TextField select size="small" label={t('finance.billing.apartment')} value={entry.apartmentId} onChange={(event) => change({ apartmentId: event.target.value })}><MenuItem value="">{t('finance.billing.notSet')}</MenuItem>{workspace.apartments.map((row) => <MenuItem key={row.id} value={row.id}>{apartmentLabel(row.id)}</MenuItem>)}</TextField>
            <FinanceSelect label={t('finance.billing.adjustmentKind')} value={entry.kind} options={['Arrears', 'Penalty', 'Credit', 'Other']} onChange={(kind) => { if (kind) change({ kind, amount: kind === 'Credit' ? -Math.abs(entry.amount) : Math.abs(entry.amount) }) }} />
            <FinanceNumber min={entry.kind === 'Credit' ? -1000000000 : 0} label={t('finance.billing.amount')} value={entry.amount} onChange={(amount) => change({ amount: amount ?? 0 })} />
            <TextField size="small" label={t('finance.billing.name')} value={entry.name} onChange={(event) => change({ name: event.target.value })} />
            <TextField size="small" required label={t('finance.billing.reason')} value={entry.reason} onChange={(event) => change({ reason: event.target.value })} />
          </Box>
          <ActionButtons variant="row" actions={[{ id: 'remove', label: t('finance.billing.remove'), icon: <DeleteIcon />, color: 'error', onClick: () => update({ ...data, adjustments: data.adjustments.filter((_, position) => position !== index) }) }]} />
        </Paper>
      })}
      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => update({ ...data, adjustments: [...data.adjustments, { id: crypto.randomUUID(), apartmentId: '', kind: 'Arrears', name: '', amount: 0, reason: '' }] })}>{t('finance.billing.addAdjustment')}</Button>
    </FinanceSection>
    {error && <Alert severity="error">{error}</Alert>}
    <Button startIcon={<SaveIcon />} variant="contained" disabled={(!dirty && !hasStaleInputs) || saving} onClick={() => void save()}>{saving ? t('finance.billing.saving') : t('finance.billing.saveMonth')}</Button>
  </Box>
}
export default FinancePeriodEditor
