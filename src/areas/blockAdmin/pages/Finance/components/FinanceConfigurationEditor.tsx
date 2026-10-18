import React from 'react'
import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Paper, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import ActionButtons from '../../../../../components/shared/ActionButtons'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { EntityListItem } from '../../../../../components/shared/EntityPresentation'
import { financeApi } from '../../../../../services/financeApi'
import type { FinanceApartment, FinanceBasis, FinanceBlock, FinanceConfiguration, FinanceWorkspace } from '../../../../../types/finance'
import { useFinanceActionScope } from '../../../../../hooks/useFinanceWorkspace'
import { FinanceNumber, FinanceScopeFields, FinanceSelect } from './FinanceFields'
import { financeGrid } from './financePresentation'
import FinanceSection from './FinanceSection'

const bases: FinanceBasis[] = ['People', 'Equal', 'Area', 'HeatingMp', 'ColdConsumption', 'HotConsumption', 'Manual']
type Props = { workspace: FinanceWorkspace; block: FinanceBlock; refresh: () => void; onDirty: (dirty: boolean) => void }
const FinanceConfigurationEditor: React.FC<Props> = ({ workspace, block, refresh, onDirty }) => {
  const { t, i18n } = useTranslation()
  const [config, setConfig] = React.useState<FinanceConfiguration>(() => structuredClone(workspace.configuration))
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const active = useFinanceActionScope()
  const update = (next: FinanceConfiguration) => { setConfig(next); setDirty(true); onDirty(true) }
  const number = (value?: number | null) => value === null || value === undefined ? '—' : new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)
  const save = async () => {
    setSaving(true); setError(null)
    try {
      const configuration = { ...config, charges: config.charges.map((charge) => {
        const group = config.supplyGroups.find((item) => item.id === charge.supplyGroupId)
        return group ? { ...charge, scope: group.scope, staircaseId: group.staircaseId, apartmentIds: group.apartmentIds } : charge
      }) }
      await financeApi.saveConfiguration(block.id, workspace.configurationEditVersion, configuration)
      if (!active.current) return
      setDirty(false); onDirty(false); refresh()
    } catch (nextError) { if (active.current) setError(nextError instanceof Error ? nextError.message : t('finance.billing.saveFailed')) }
    finally { if (active.current) setSaving(false) }
  }
  const updateHeating = (apartmentId: string, changes: Partial<FinanceConfiguration['apartmentHeating'][number]>) => {
    const existing = config.apartmentHeating.find((item) => item.apartmentId === apartmentId)
    update({ ...config, apartmentHeating: [...config.apartmentHeating.filter((item) => item.apartmentId !== apartmentId), { apartmentId, mode: 'Percentage', ...existing, ...changes }] })
  }
  const heatingMode = (row: FinanceApartment) => <FinanceSelect inline label={t('finance.billing.heatingMode')} value={config.apartmentHeating.find((item) => item.apartmentId === row.id)?.mode ?? ''} empty options={['Manual', 'Percentage']} onChange={(mode) => { if (mode) updateHeating(row.id, { mode }) }} />
  const heatingInput = (row: FinanceApartment) => {
    const item = config.apartmentHeating.find((entry) => entry.apartmentId === row.id)
    return !item ? '—' : item.mode === 'Manual'
      ? <FinanceNumber inline decimal={1} label={t('finance.billing.manualMp')} value={item.manualMp} onChange={(manualMp) => updateHeating(row.id, { manualMp })} />
      : <FinanceNumber inline decimal={1} label={t('finance.billing.percentageOverride')} helperText={t('finance.billing.defaultPercentageHint', { value: number(config.defaultHeatingPercentage) })} value={item.percentageOverride} onChange={(percentageOverride) => updateHeating(row.id, { percentageOverride })} />
  }
  const heatingMp = (row: FinanceApartment) => {
    const item = config.apartmentHeating.find((entry) => entry.apartmentId === row.id)
    const percentage = item?.percentageOverride ?? config.defaultHeatingPercentage
    const effective = item?.mode === 'Manual' ? item.manualMp : item?.mode === 'Percentage' && row.usableSqm != null && percentage != null ? Math.round((row.usableSqm * percentage / 100 + Number.EPSILON) * 10) / 10 : null
    return <Typography sx={{ fontWeight: 700 }}>{number(effective)} m²</Typography>
  }
  const heatingColumns: DataColumn<FinanceApartment>[] = [
    { key: 'number', label: t('finance.billing.apartment'), cardRole: 'primary', render: (row) => `${row.staircaseName ? `${row.staircaseName} / ` : ''}${row.number}` },
    { key: 'contact', label: t('finance.billing.contact'), cardRole: 'secondary', render: (row) => row.contactName || '—' },
    { key: 'area', label: t('finance.billing.usableArea'), render: (row) => row.usableSqm == null ? '—' : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(row.usableSqm) },
    { key: 'mode', label: t('finance.billing.heatingMode'), render: (row) => <Box sx={{ width: 260 }}>{heatingMode(row)}</Box> },
    { key: 'input', label: t('finance.billing.heatingInput'), render: (row) => <Box sx={{ width: 220 }}>{heatingInput(row)}</Box> },
    { key: 'effective', label: t('finance.billing.heatingMp'), render: heatingMp },
  ]
  return <Box component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: 'grid', gap: 2 }}>
    <FinanceSection title={t('finance.billing.configurationTitle', { block: block.name })}>
      <Typography color="text.secondary" variant="body2">{t('finance.billing.configurationHelp')}</Typography>
      <Box sx={financeGrid}>
        <AppDatePicker monthOnly confirmOnAccept label={t('finance.billing.effectiveFrom')} value={`${config.effectiveFromYear}-${String(config.effectiveFromMonth).padStart(2, '0')}`} onChange={(value) => { const [effectiveFromYear, effectiveFromMonth] = value.split('-').map(Number); update({ ...config, effectiveFromYear, effectiveFromMonth }) }} />
        <AppDatePicker monthOnly confirmOnAccept label={t('finance.billing.effectiveTo')} value={config.effectiveToYear && config.effectiveToMonth ? `${config.effectiveToYear}-${String(config.effectiveToMonth).padStart(2, '0')}` : ''} onChange={(value) => { const [effectiveToYear, effectiveToMonth] = value.split('-').map(Number); update({ ...config, effectiveToYear, effectiveToMonth }) }} />
        <FinanceNumber decimal={1} label={t('finance.billing.defaultPercentage')} value={config.defaultHeatingPercentage} helperText={t('finance.billing.defaultPercentageHelp')} onChange={(defaultHeatingPercentage) => update({ ...config, defaultHeatingPercentage })} />
      </Box>
      {config.effectiveToYear && <Button onClick={() => update({ ...config, effectiveToYear: null, effectiveToMonth: null })}>{t('finance.billing.clearEnd')}</Button>}
    </FinanceSection>
    <FinanceSection title={t('finance.billing.supplyGroups')}>
      <Typography color="text.secondary" variant="body2">{t('finance.billing.supplyGroupsHelp')}</Typography>
      {config.supplyGroups.map((group, index) => {
        const change = (changes: Partial<typeof group>) => update({ ...config, supplyGroups: config.supplyGroups.map((item, position) => position === index ? { ...item, ...changes } : item) })
        return <Paper key={group.id} variant="outlined" sx={{ p: 2, display: 'grid', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}><Typography variant="subtitle1">{group.name || t('finance.billing.newSupply')}</Typography><ActionButtons variant="row" actions={[{ id: 'remove', label: t('finance.billing.remove'), icon: <DeleteIcon />, color: 'error', onClick: () => update({ ...config, supplyGroups: config.supplyGroups.filter((_, position) => position !== index) }) }]} /></Box>
          <Box sx={financeGrid}>
            <TextField size="small" label={t('finance.billing.name')} value={group.name} onChange={(event) => change({ name: event.target.value })} />
            <FinanceSelect label={t('finance.billing.utility')} value={group.utilityType} options={['ColdWater', 'HotWater']} onChange={(utilityType) => { if (utilityType) change({ utilityType }) }} />
            <TextField size="small" label={t('finance.billing.incomingMeterName')} value={group.incomingMeterName ?? ''} onChange={(event) => change({ incomingMeterName: event.target.value || null })} />
          </Box>
          <FinanceScopeFields block={block} apartments={workspace.apartments} value={group} onChange={change} />
          <Box sx={financeGrid}>
            <FinanceSelect label={t('finance.billing.differenceMode')} value={group.differenceMode} options={['None', 'Manual', 'IncomingIndexes', 'SupplierQuantity']} onChange={(differenceMode) => { if (differenceMode) change({ differenceMode }) }} />
            {group.differenceMode !== 'None' && <FinanceSelect label={t('finance.billing.differenceBasis')} value={group.differenceBasis} options={['Equal', 'People', 'Consumption', 'Manual']} onChange={(differenceBasis) => { if (differenceBasis) change({ differenceBasis }) }} />}
            <FinanceNumber decimal={0} label={t('finance.billing.order')} value={group.order} onChange={(order) => change({ order: order ?? 0 })} />
          </Box>
        </Paper>
      })}
      <Button startIcon={<AddIcon />} variant="outlined" onClick={() => update({ ...config, supplyGroups: [...config.supplyGroups, { id: crypto.randomUUID(), name: '', utilityType: 'ColdWater', scope: 'Block', apartmentIds: [], differenceMode: 'None', differenceBasis: 'Equal', order: config.supplyGroups.length }] })}>{t('finance.billing.addSupply')}</Button>
    </FinanceSection>
    <FinanceSection title={t('finance.billing.chargeDefinitions')}>
      <Typography color="text.secondary" variant="body2">{t('finance.billing.chargesHelp')}</Typography>
      {config.charges.map((charge, index) => {
        const change = (changes: Partial<typeof charge>) => update({ ...config, charges: config.charges.map((item, position) => position === index ? { ...item, ...changes } : item) })
        return <Paper key={charge.id} variant="outlined" sx={{ p: 2, display: 'grid', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}><Typography variant="subtitle1">{charge.name || t('finance.billing.newCharge')}</Typography><ActionButtons variant="row" actions={[{ id: 'remove', label: t('finance.billing.remove'), icon: <DeleteIcon />, color: 'error', onClick: () => update({ ...config, charges: config.charges.filter((_, position) => position !== index) }) }]} /></Box>
          <Box sx={financeGrid}>
            <TextField size="small" label={t('finance.billing.name')} value={charge.name} onChange={(event) => change({ name: event.target.value })} />
            <FinanceSelect label={t('finance.billing.amountMode')} value={charge.amountMode} options={['Pool', 'Rate', 'Manual']} onChange={(amountMode) => { if (amountMode) change({ amountMode, basis: amountMode === 'Manual' ? 'Manual' : amountMode === 'Rate' && charge.basis === 'Manual' ? 'Equal' : charge.basis }) }} />
            <FinanceSelect label={t('finance.billing.basis')} value={charge.basis} options={bases} onChange={(basis) => { if (basis) change({ basis }) }} />
            {charge.amountMode === 'Rate' && <FinanceNumber decimal={6} label={t('finance.billing.rate')} value={charge.rate} onChange={(rate) => change({ rate })} />}
            <TextField select size="small" label={t('finance.billing.supplyGroup')} value={charge.supplyGroupId ?? ''} onChange={(event) => { const group = config.supplyGroups.find((item) => item.id === event.target.value); change({ supplyGroupId: group?.id ?? null, ...(group ? { scope: group.scope, staircaseId: group.staircaseId, apartmentIds: group.apartmentIds } : {}) }) }}>
              <MenuItem value="">{t('finance.billing.noSupplyGroup')}</MenuItem>
              {config.supplyGroups.map((group) => <MenuItem key={group.id} value={group.id}>{group.name || t('finance.billing.newSupply')}</MenuItem>)}
            </TextField>
            <FinanceNumber decimal={0} label={t('finance.billing.order')} value={charge.order} onChange={(order) => change({ order: order ?? 0 })} />
            {charge.amountMode === 'Pool' && <FinanceSelect label={t('finance.billing.remainderBasis')} empty value={charge.remainderBasis ?? ''} options={bases.filter((basis) => basis !== 'Manual')} onChange={(remainderBasis) => change({ remainderBasis: remainderBasis || null })} />}
          </Box>
          {charge.supplyGroupId ? <Alert severity="info">{t('finance.billing.scopeFromSupply', { name: config.supplyGroups.find((group) => group.id === charge.supplyGroupId)?.name })}</Alert> : <FinanceScopeFields block={block} apartments={workspace.apartments} value={charge} onChange={change} />}
          <Box sx={financeGrid}>
            <AppDatePicker monthOnly confirmOnAccept label={t('finance.billing.effectiveFrom')} value={charge.effectiveFromYear && charge.effectiveFromMonth ? `${charge.effectiveFromYear}-${String(charge.effectiveFromMonth).padStart(2, '0')}` : ''} onChange={(value) => { const [effectiveFromYear, effectiveFromMonth] = value.split('-').map(Number); change({ effectiveFromYear, effectiveFromMonth }) }} />
            <AppDatePicker monthOnly confirmOnAccept label={t('finance.billing.effectiveTo')} value={charge.effectiveToYear && charge.effectiveToMonth ? `${charge.effectiveToYear}-${String(charge.effectiveToMonth).padStart(2, '0')}` : ''} onChange={(value) => { const [effectiveToYear, effectiveToMonth] = value.split('-').map(Number); change({ effectiveToYear, effectiveToMonth }) }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel label={t('finance.billing.enabled')} control={<Checkbox checked={charge.enabled} onChange={(event) => change({ enabled: event.target.checked })} />} />
            <FormControlLabel label={t('finance.billing.required')} control={<Checkbox checked={charge.required} onChange={(event) => change({ required: event.target.checked })} />} />
            <FormControlLabel label={t('finance.billing.oneOff')} control={<Checkbox checked={charge.oneOff} onChange={(event) => change({ oneOff: event.target.checked, ...(event.target.checked && !charge.effectiveFromYear ? { effectiveFromYear: workspace.year, effectiveFromMonth: workspace.month } : {}) })} />} />
          </Box>
        </Paper>
      })}
      <Button startIcon={<AddIcon />} variant="outlined" onClick={() => update({ ...config, charges: [...config.charges, { id: crypto.randomUUID(), name: '', scope: 'Block', apartmentIds: [], amountMode: 'Pool', basis: 'People', required: true, enabled: true, order: config.charges.length, oneOff: false }] })}>{t('finance.billing.addCharge')}</Button>
    </FinanceSection>
    <FinanceSection title={t('finance.billing.apartmentHeating')}>
      <Typography color="text.secondary" variant="body2">{t('finance.billing.heatingHelp')}</Typography>
      <Button variant="outlined" disabled={config.defaultHeatingPercentage == null} onClick={() => update({ ...config, apartmentHeating: [...config.apartmentHeating, ...workspace.apartments.filter((row) => !config.apartmentHeating.some((item) => item.apartmentId === row.id)).map((row) => ({ apartmentId: row.id, mode: 'Percentage' as const }))] })}>{t('finance.billing.applyDefaultHeating')}</Button>
      <ResponsiveDataView desktopTableMinWidth={1100} paginationId="finance-heating" paginationResetKey={`${block.id}:${workspace.configurationVersion}`} ariaLabel={t('finance.billing.apartmentHeating')} rows={workspace.apartments} columns={heatingColumns} getRowId={(row) => row.id} renderMobileRow={(row) => <Box component="li" sx={{ pb: 1.5 }}><EntityListItem
        title={`${row.staircaseName ? `${row.staircaseName} / ` : ''}${row.number}`}
        secondary={row.contactName || '—'} secondaryLabel={t('finance.billing.contact')}
        metadata={[
          { key: 'area', label: t('finance.billing.usableArea'), value: row.usableSqm == null ? '—' : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(row.usableSqm) },
          { key: 'effective', label: t('finance.billing.heatingMp'), value: heatingMp(row) },
          { key: 'mode', label: t('finance.billing.heatingMode'), value: heatingMode(row), fullWidth: true },
          { key: 'input', label: t(config.apartmentHeating.find((item) => item.apartmentId === row.id)?.mode === 'Manual' ? 'finance.billing.manualMp' : config.apartmentHeating.some((item) => item.apartmentId === row.id) ? 'finance.billing.percentageOverride' : 'finance.billing.heatingInput'), value: heatingInput(row), fullWidth: true },
        ]}
      /></Box>} />
    </FinanceSection>
    {error && <Alert severity="error">{error}</Alert>}
    <Button variant="contained" startIcon={<SaveIcon />} disabled={!dirty || saving} onClick={() => void save()}>{saving ? t('finance.billing.saving') : t('finance.billing.saveConfiguration')}</Button>
  </Box>
}
export default FinanceConfigurationEditor
