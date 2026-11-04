import { Box, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { FinanceCharge } from '../../../../../types/finance'
import { FinanceSelect } from './FinanceFields'
import { financeGrid } from './financePresentation'

export default function FinanceChargeClassification({ charge, onChange }: { charge: FinanceCharge; onChange: (changes: Partial<FinanceCharge>) => void }) {
  const { t } = useTranslation()
  const isExpense = !charge.kind || charge.kind === 'Expense'
  return <Box sx={{ display: 'grid', gap: 1 }}>
    <Box sx={financeGrid}>
      <FinanceSelect label={t('finance.billing.entryKind')} value={charge.kind ?? 'Expense'} options={['Expense', 'Arrears', 'Penalty', 'Credit', 'Adjustment']}
        onChange={kind => { if (kind) onChange({ kind, ...(kind === 'Expense' ? {} : { amountMode: 'Manual', basis: 'Manual', rate: null, remainderBasis: null, supplyGroupId: null, includeInMiscellaneous: false }) }) }} />
      {isExpense && <TextField select fullWidth size="small" label={t('finance.billing.chargeCategory')} value={charge.category ?? ''}
        onChange={event => onChange({ category: event.target.value || null, includeInMiscellaneous: event.target.value === 'Other' })}>
        <MenuItem value="">{t('finance.billing.legacyCategory')}</MenuItem>
        {['Heating', 'HotWater', 'ColdWater', 'HotWaterSupply', 'Gas', 'Waste', 'Electricity', 'Administration', 'Other'].map(category =>
          <MenuItem key={category} value={category}>{t(`finance.billing.chargeCategories.${category}`)}</MenuItem>)}
      </TextField>}
    </Box>
    {isExpense ? <FormControlLabel label={t('finance.billing.includeInMiscellaneous')}
      control={<Checkbox checked={charge.includeInMiscellaneous === true} indeterminate={charge.includeInMiscellaneous == null}
        onChange={event => onChange({ includeInMiscellaneous: event.target.checked })} />} />
      : <Typography variant="body2" color="text.secondary">{t('finance.billing.balanceEntryHelp')}</Typography>}
  </Box>
}
