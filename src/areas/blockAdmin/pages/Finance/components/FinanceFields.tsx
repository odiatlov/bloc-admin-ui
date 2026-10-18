import React from 'react'
import { Box, MenuItem, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { FinanceApartment, FinanceBlock, FinanceScope } from '../../../../../types/finance'
import { financeGrid } from './financePresentation'

export const FinanceNumber: React.FC<{ label: string; value?: number | null; onChange: (value: number | null) => void; decimal?: number; min?: number; helperText?: string; disabled?: boolean; inline?: boolean }> = ({ label, value, onChange, decimal = 2, min = 0, helperText, disabled, inline = false }) => <TextField fullWidth size="small" label={inline ? undefined : label} type="number" value={value ?? ''} helperText={helperText} disabled={disabled} slotProps={{ htmlInput: { min, step: 10 ** -decimal, ...(inline ? { 'aria-label': label } : {}) } }} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} />

export const FinanceSelect = <T extends string,>({ label, value, options, onChange, empty = false, inline = false }: { label: string; value: T | ''; options: readonly T[]; onChange: (value: T | '') => void; empty?: boolean; inline?: boolean }) => {
  const { t } = useTranslation()
  return <TextField fullWidth select size="small" label={inline ? undefined : label} value={value} slotProps={{ select: { displayEmpty: inline && empty, SelectDisplayProps: inline ? { 'aria-label': label } : undefined } }} onChange={(event) => onChange(event.target.value as T | '')}>
    {empty && <MenuItem value="">{t('finance.billing.notSet')}</MenuItem>}
    {options.map((option) => <MenuItem key={option} value={option}>{t(`finance.billing.values.${option}`)}</MenuItem>)}
  </TextField>
}

export const FinanceScopeFields: React.FC<{ value: { scope: FinanceScope; staircaseId?: string | null; apartmentIds: string[] }; block: FinanceBlock; apartments: FinanceApartment[]; onChange: (value: { scope: FinanceScope; staircaseId?: string | null; apartmentIds: string[] }) => void }> = ({ value, block, apartments, onChange }) => {
  const { t } = useTranslation()
  return <Box sx={financeGrid}>
    <FinanceSelect label={t('finance.billing.scope')} value={value.scope} options={block.hasStaircases ? ['Block', 'Staircase', 'Apartments'] : ['Block', 'Apartments']} onChange={(scope) => { if (scope) onChange({ scope, staircaseId: null, apartmentIds: [] }) }} />
    {value.scope === 'Staircase' && <TextField select size="small" label={t('finance.billing.staircase')} value={value.staircaseId ?? ''} onChange={(event) => onChange({ ...value, staircaseId: event.target.value })}>
      <MenuItem value="">{t('finance.billing.notSet')}</MenuItem>
      {block.staircases.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
    </TextField>}
    {value.scope === 'Apartments' && <TextField select size="small" label={t('finance.billing.apartments')} value={value.apartmentIds} slotProps={{ select: { multiple: true, renderValue: (ids) => (ids as string[]).map((id) => { const apartment = apartments.find((item) => item.id === id); return apartment ? `${apartment.staircaseName ?? ''}/${apartment.number}` : '' }).join(', ') } }} onChange={(event) => onChange({ ...value, apartmentIds: typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value })}>
      {apartments.map((item) => <MenuItem key={item.id} value={item.id}>{item.staircaseName ? `${item.staircaseName} / ` : ''}{item.number} — {item.contactName}</MenuItem>)}
    </TextField>}
  </Box>
}
