import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Divider, Paper, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslation } from 'react-i18next'
import type { FinanceBasis, ResidentBillDetail } from '../../types/finance'

type Props = { detail: ResidentBillDetail; onClose: () => void }

const ResidentBillBreakdown = ({ detail, onClose }: Props) => {
  const { t, i18n } = useTranslation()
  const { bill, breakdown } = detail
  const { row } = breakdown
  const money = (amount: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: bill.currency }).format(amount)
  const number = (amount: number, digits = 2) => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: digits }).format(amount)
  const unit = (basis: FinanceBasis) => basis === 'People' ? t('residentFinance.units.people')
    : basis === 'Equal' ? t('residentFinance.units.apartments') : basis === 'Area' || basis === 'HeatingMp' ? 'm²' : 'm³'
  const adjustments = row.adjustmentDetails ?? []
  const inputs: [string, string][] = [[t('finance.billing.declaredOccupants'), number(row.declaredOccupants)]]
  if (row.heatingMode || row.charges.some(line => line.basis === 'HeatingMp')) inputs.push([t('finance.billing.heatingMp'), `${number(row.heatingMp, 1)} m²`])
  for (const utility of ['cold', 'hot'] as const) {
    const hasSupply = breakdown.chargeContexts.some(context => context.utilityType === (utility === 'cold' ? 'ColdWater' : 'HotWater'))
    if (hasSupply || row.charges.some(line => line.basis === (utility === 'cold' ? 'ColdConsumption' : 'HotConsumption'))) {
      inputs.push([t(`finance.billing.${utility}Consumption`), `${number(utility === 'cold' ? row.coldConsumption : row.hotConsumption)} m³`],
        [t(`finance.billing.${utility}Difference`), `${number(utility === 'cold' ? row.coldDifference : row.hotDifference)} m³`],
        [t(utility === 'cold' ? 'finance.billing.billedCold' : 'finance.billing.billedHot'), `${number(utility === 'cold' ? row.billedColdConsumption : row.billedHotConsumption)} m³`])
    }
  }
  const penalties = adjustments.filter(x => x.kind === 'Penalty').reduce((sum, x) => sum + x.amount, 0)
  const totalLine = (label: string, amount: number, strong = false) => <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
    <Typography sx={strong ? { fontWeight: 700 } : undefined}>{label}</Typography>
    <Typography sx={{ fontWeight: strong ? 700 : 400, whiteSpace: 'nowrap' }}>{money(amount)}</Typography>
  </Box>
  const summary = [
    [t('resident.bills.summary.expenses'), row.currentCharges],
    [t('resident.bills.summary.balance'), bill.remainingAmount],
    [t('resident.bills.summary.debts'), row.arrears],
    [t('resident.bills.summary.penalties'), penalties],
  ] as const
  return <Box sx={{ display: 'grid', gap: 2, minWidth: 0, overflowWrap: 'anywhere' }}>
    <Button startIcon={<ArrowBackIcon />} onClick={onClose} sx={{ justifySelf: 'start' }}>{t('resident.bills.backToBills')}</Button>
    <Box>
      <Typography variant="h5" component="h2">{t('resident.bills.detailsTitle')}</Typography>
      <Typography color="text.secondary">{bill.reference} · {new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(bill.year, bill.month - 1, 1))}</Typography>
      <Typography>{[bill.blockName, bill.staircaseName, t('finance.billing.apartmentNumber', { number: bill.apartmentNumber })].filter(Boolean).join(' / ')}</Typography>
      <Typography variant="body2">{t('financePublication.dueDate')}: {new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(`${bill.dueDate}T12:00:00`))}</Typography>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
      {summary.map(([label, amount]) => <Paper key={label} variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h6">{money(amount)}</Typography>
      </Paper>)}
    </Box>
    <Paper variant="outlined" sx={{ p: 2, display: 'grid', gap: 1 }}>
      <Typography variant="h6">{t('resident.bills.summary.title')}</Typography>
      {totalLine(t('resident.bills.summary.expenses'), row.currentCharges)}
      {totalLine(t('resident.bills.summary.debts'), row.arrears)}
      {totalLine(t('finance.billing.adjustments'), row.adjustments)}
      <Divider />
      {totalLine(t('residentFinance.reportTotal'), row.totalDue, true)}
      {bill.carriedForwardArrears > 0 && <>
        <Typography variant="body2" color="text.secondary">{t('residentFinance.carryExplanation', { amount: money(bill.carriedForwardArrears) })}</Typography>
        {totalLine(t('residentFinance.thisBill'), bill.originalAmount, true)}
      </>}
      {bill.paidAmount > 0 && totalLine(t('residentFinance.paidAmount'), bill.paidAmount)}
      {totalLine(t('resident.bills.summary.balance'), bill.remainingAmount, true)}
    </Paper>
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{t('residentFinance.inputsTitle')}</Typography>
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 1 }}>
        {inputs.map(([label, value]) => <Box key={label} sx={{ display: 'contents' }}>
          <Typography component="dt" variant="body2">{label}</Typography><Typography component="dd" variant="body2" sx={{ m: 0 }}>{value}</Typography>
        </Box>)}
      </Box>
    </Paper>
    <Typography variant="h6">{t('resident.bills.breakdown.title')}</Typography>
    {row.charges.map((line, index) => {
      const context = breakdown.chargeContexts.find(x => x.chargeId === line.chargeId)
      const manual = line.basis === 'Manual'
      const scope = context?.scope ?? 'Block'
      const isRate = context?.amountMode === 'Rate'
      const water = line.basis === 'ColdConsumption' ? 'cold' : line.basis === 'HotConsumption' ? 'hot' : undefined
      return <Accordion key={`${line.chargeId}:${index}`} defaultExpanded={index === 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'grid', gap: 0.5, width: '100%', minWidth: 0, pr: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>{line.name}</Typography><Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{money(line.amount)}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{context?.description || t(manual ? 'residentFinance.manualPurpose' : `residentFinance.scope.${scope}`)}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'grid', gap: 1 }}>
          <Typography variant="body2">{t(manual ? 'residentFinance.manualCalculation' : isRate ? 'residentFinance.rateCalculation' : 'residentFinance.poolCalculation', {
            method: t(`finance.billing.values.${line.basis}`), quantity: number(line.quantity), unit: unit(line.basis),
            denominator: number(line.denominator), rate: money(line.rate), pool: money(line.rate * line.denominator), amount: money(line.amount),
          })}</Typography>
          {manual && <Typography variant="body2">{t('finance.billing.reason')}: {line.explanation}</Typography>}
          {!manual && <Typography variant="caption" color="text.secondary">{t('residentFinance.rounding')}</Typography>}
          {water && <Typography variant="body2">{t('residentFinance.waterCalculation', {
            actual: number(water === 'cold' ? row.coldConsumption : row.hotConsumption),
            difference: number(water === 'cold' ? row.coldDifference : row.hotDifference),
            billed: number(water === 'cold' ? row.billedColdConsumption : row.billedHotConsumption),
          })}</Typography>}
          {line.basis === 'HeatingMp' && <Typography variant="body2">{t(row.heatingMode === 'Percentage' ? 'residentFinance.heatingPercentage' : 'residentFinance.heatingManual', {
            area: number(row.usableSqm ?? 0), percentage: number(row.heatingPercentage ?? 0, 1), mp: number(row.heatingMp, 1),
          })}</Typography>}
        </AccordionDetails>
      </Accordion>
    })}
    {adjustments.length > 0 && <Box sx={{ display: 'grid', gap: 1 }}>
      <Typography variant="h6">{t('resident.bills.adjustments.title')}</Typography>
      {adjustments.map(entry => <Paper key={entry.id} variant="outlined" sx={{ p: 1.5, display: 'grid', gap: 0.75, borderColor: entry.kind === 'Penalty' ? 'warning.main' : 'divider' }}>
        {totalLine(entry.name, entry.amount, true)}
        <Typography variant="body2" color="text.secondary">{t(`residentFinance.adjustment.${entry.kind}`)}</Typography>
        <Typography variant="body2">{t('finance.billing.reason')}: {entry.reason}</Typography>
      </Paper>)}
    </Box>}
    <Alert severity="info">{t('residentFinance.savedReport', { revision: breakdown.revision })}</Alert>
  </Box>
}
export default ResidentBillBreakdown
