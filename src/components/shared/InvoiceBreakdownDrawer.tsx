import React from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useTranslation } from 'react-i18next'
import type { ApartmentMaintenanceTotal, InvoiceCalculationInput, InvoiceLine } from '../../types/apartment'
import { formatMonth, formatNumber } from '../../utils/formatters'

type InvoiceWithBreakdown = {
  id: string
  month: string
  familyLabel: string
  totalAmount: number
  paidAmount: number
  maintenanceTotal?: ApartmentMaintenanceTotal | null
}

type InvoiceBreakdownDrawerProps = {
  invoice: InvoiceWithBreakdown | null
  onClose: () => void
  formatCurrency: (value: number) => string
}

const getLineKey = (line: InvoiceLine) => `${line.expenseId}-${line.categoryId}`

const InvoiceBreakdownDrawer: React.FC<InvoiceBreakdownDrawerProps> = ({ formatCurrency, invoice, onClose }) => {
  const { t } = useTranslation()
  const maintenanceTotal = invoice?.maintenanceTotal
  const expenseTotal = maintenanceTotal?.lines.reduce((total, line) => total + line.amount, 0) ?? invoice?.totalAmount ?? 0
  const debtTotal = maintenanceTotal?.debts.reduce((total, debt) => total + debt.principal, 0) ?? 0
  const penaltyTotal = maintenanceTotal?.penalties.reduce((total, penalty) => total + penalty.amount, 0) ?? 0
  const balance = invoice ? Math.max(invoice.totalAmount - invoice.paidAmount, 0) : 0
  const appendUnit = (value: string, unitKey?: string) => {
    if (!unitKey) return value
    const unit = t(unitKey)
    return unit.startsWith('/') ? `${value}${unit}` : `${value} ${unit}`
  }
  const formatInputValue = (input: InvoiceCalculationInput) => {
    if (typeof input.value === 'number' && input.valueType === 'currency') return appendUnit(formatCurrency(input.value), input.unitKey)
    if (typeof input.value === 'number') return appendUnit(formatNumber(input.value), input.unitKey)
    return input.value
  }
  const formatLineFormula = (line: InvoiceLine) =>
    t(line.formulaKey, {
      amount: formatCurrency(line.amount),
      allocationPercentage: typeof line.values.allocationPercentage === 'number' ? formatNumber(line.values.allocationPercentage) : line.values.allocationPercentage,
      basis: formatNumber(line.basis),
      basisWithUnit: `${formatNumber(line.basis)}${line.allocationBasis.unitKey ? ` ${t(line.allocationBasis.unitKey)}` : ''}`,
      expenseTotal: typeof line.values.expenseTotal === 'number' ? formatCurrency(line.values.expenseTotal) : line.values.expenseTotal,
      percentage: typeof line.values.percentage === 'number' ? formatNumber(line.values.percentage) : line.values.percentage,
      taxableAmount: typeof line.values.taxableAmount === 'number' ? formatCurrency(line.values.taxableAmount) : line.values.taxableAmount,
      totalBasis: formatNumber(line.totalBasis),
      totalBasisWithUnit: `${formatNumber(line.totalBasis)}${line.allocationBasis.unitKey ? ` ${t(line.allocationBasis.unitKey)}` : ''}`,
      unitPrice: typeof line.values.unitPrice === 'number' ? formatCurrency(line.values.unitPrice) : line.values.unitPrice,
      unitPriceWithUnit: typeof line.values.unitPrice === 'number'
        ? appendUnit(formatCurrency(line.values.unitPrice), 'maintenance.invoiceLines.units.perCubicMeter')
        : line.values.unitPrice,
    })
  const formatAllocationBasis = (line: InvoiceLine) => {
    const unit = line.allocationBasis.unitKey ? ` ${t(line.allocationBasis.unitKey)}` : ''
    const value = `${formatNumber(line.allocationBasis.value)}${unit}`

    if (line.allocationBasis.totalValue === line.allocationBasis.value) return value

    return `${value} / ${formatNumber(line.allocationBasis.totalValue)}${unit}`
  }
  const renderInvoiceLine = (line: InvoiceLine, depth = 0, defaultExpanded = false) => (
    <Accordion key={getLineKey(line)} defaultExpanded={defaultExpanded} disableGutters={depth > 0} sx={depth > 0 ? { boxShadow: 'none', borderLeft: 2, borderColor: 'divider' } : undefined}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%', pr: 1, pl: depth }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{t(line.labelKey)}</Typography>
            <Tooltip title={t('resident.bills.breakdown.methodTooltip', { method: t(`settings.allocation.${line.allocationType}`) })}>
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
          <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatCurrency(line.amount)}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ display: 'grid', gap: 1.25, pl: 2 + depth }}>
        <Typography variant="body2" color="text.secondary">
          {t(line.explanationKey, {
            label: t(line.labelKey),
            amount: formatCurrency(line.amount),
            basis: formatNumber(line.basis),
            totalBasis: formatNumber(line.totalBasis),
            unitPrice: typeof line.values.unitPrice === 'number' ? formatCurrency(line.values.unitPrice) : line.values.unitPrice,
          })}
        </Typography>
        <Box sx={{ display: 'grid', gap: 0.75 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }} color="text.secondary">
            {t('resident.bills.breakdown.formula')}
          </Typography>
          <Typography variant="body2">{formatLineFormula(line)}</Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 0.75 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }} color="text.secondary">
            {t('resident.bills.breakdown.inputs')}
          </Typography>
          {line.calculationInputs.map((input) => (
            <Box key={`${line.expenseId}-${input.labelKey}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">{t(input.labelKey)}</Typography>
              <Typography variant="body2">{formatInputValue(input)}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            {t('resident.bills.breakdown.method')}: {t(`settings.allocation.${line.allocationType}`)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('resident.bills.breakdown.basis')}: {t(line.allocationBasis.labelKey)} - {formatAllocationBasis(line)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('resident.bills.breakdown.result')}: {formatCurrency(line.amount)}
          </Typography>
        </Box>
        {line.adjustments?.map((adjustment) => (
          <Box key={adjustment.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, color: adjustment.amount < 0 ? 'success.main' : 'warning.main' }}>
            <Typography variant="body2">{t(adjustment.labelKey)}</Typography>
            <Typography variant="body2">{formatCurrency(adjustment.amount)}</Typography>
          </Box>
        ))}
        {line.children?.length ? (
          <Box sx={{ display: 'grid', gap: 1 }}>
            {line.children.map((child) => renderInvoiceLine(child, depth + 1))}
          </Box>
        ) : null}
      </AccordionDetails>
    </Accordion>
  )

  return (
    <Drawer anchor="right" open={Boolean(invoice)} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 560 }, p: 2 } } }}>
      {invoice && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={onClose}>
              {t('resident.bills.backToBills')}
            </Button>
            <Box>
              <Typography variant="h5">{t('resident.bills.detailsTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('resident.bills.invoiceContext', { invoice: invoice.id, month: formatMonth(invoice.month) })}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t('resident.bills.summary.expenses')}
              </Typography>
              <Typography variant="h6">{formatCurrency(expenseTotal)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t('resident.bills.summary.balance')}
              </Typography>
              <Typography variant="h6">{formatCurrency(balance)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t('resident.bills.summary.debts')}
              </Typography>
              <Typography variant="h6">{formatCurrency(debtTotal)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderColor: penaltyTotal > 0 ? 'warning.main' : 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {penaltyTotal > 0 && <WarningAmberIcon color="warning" fontSize="small" />}
                <Typography variant="body2" color="text.secondary">
                  {t('resident.bills.summary.penalties')}
                </Typography>
              </Box>
              <Typography variant="h6">{formatCurrency(penaltyTotal)}</Typography>
            </Paper>
          </Box>

          <Paper sx={{ p: 2, display: 'grid', gap: 1 }}>
            <Typography variant="subtitle1">{t('resident.bills.summary.title')}</Typography>
            <Box sx={{ display: 'grid', gap: 0.75 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2">{t('resident.bills.summary.expenses')}</Typography>
                <Typography variant="body2">{formatCurrency(expenseTotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2">{t('resident.bills.summary.debts')}</Typography>
                <Typography variant="body2">{formatCurrency(debtTotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2">{t('resident.bills.summary.penalties')}</Typography>
                <Typography variant="body2">{formatCurrency(penaltyTotal)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{t('resident.bills.summary.total')}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatCurrency(invoice.totalAmount)}</Typography>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography variant="h6">{t('resident.bills.breakdown.title')}</Typography>
            {maintenanceTotal?.lines.map((line, index) => renderInvoiceLine(line, 0, index === 0))}
          </Box>

          {(maintenanceTotal?.debts.length || maintenanceTotal?.penalties.length) ? (
            <Paper variant="outlined" sx={{ p: 1.5, display: 'grid', gap: 1, borderColor: penaltyTotal > 0 ? 'warning.main' : 'divider' }}>
              <Typography variant="subtitle2">{t('resident.bills.adjustments.title')}</Typography>
              {maintenanceTotal.debts.map((debt) => (
                <Box key={debt.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="body2">{t(debt.descriptionKey)}</Typography>
                  <Typography variant="body2">{formatCurrency(debt.principal)}</Typography>
                </Box>
              ))}
              {maintenanceTotal.penalties.map((penalty) => (
                <Box key={penalty.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, color: 'warning.main' }}>
                  <Typography variant="body2">{t(penalty.reasonKey)}</Typography>
                  <Typography variant="body2">{formatCurrency(penalty.amount)}</Typography>
                </Box>
              ))}
            </Paper>
          ) : null}
        </Box>
      )}
    </Drawer>
  )
}

export default InvoiceBreakdownDrawer
