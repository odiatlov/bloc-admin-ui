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
import type { ApartmentMaintenanceTotal } from '../../types/apartment'
import { formatMonth } from '../../utils/formatters'

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

const InvoiceBreakdownDrawer: React.FC<InvoiceBreakdownDrawerProps> = ({ formatCurrency, invoice, onClose }) => {
  const { t } = useTranslation()
  const maintenanceTotal = invoice?.maintenanceTotal
  const expenseTotal = maintenanceTotal?.lines.reduce((total, line) => total + line.amount, 0) ?? invoice?.totalAmount ?? 0
  const debtTotal = maintenanceTotal?.debts.reduce((total, debt) => total + debt.principal, 0) ?? 0
  const penaltyTotal = maintenanceTotal?.penalties.reduce((total, penalty) => total + penalty.amount, 0) ?? 0
  const balance = invoice ? Math.max(invoice.totalAmount - invoice.paidAmount, 0) : 0

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
            {maintenanceTotal?.lines.map((line, index) => (
              <Accordion key={line.expenseId} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%', pr: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography sx={{ fontWeight: 700 }}>{t(line.labelKey)}</Typography>
                      <Tooltip title={t('resident.bills.breakdown.methodTooltip', { method: t(`settings.allocation.${line.allocationType}`) })}>
                        <InfoOutlinedIcon fontSize="small" color="action" />
                      </Tooltip>
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>{formatCurrency(line.amount)}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ display: 'grid', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t(line.textKey, {
                      label: t(line.labelKey),
                      amount: formatCurrency(line.amount),
                      basis: line.basis,
                      totalBasis: line.totalBasis,
                    })}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('resident.bills.breakdown.method')}: {t(`settings.allocation.${line.allocationType}`)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('resident.bills.breakdown.basis')}: {line.basis} / {line.totalBasis}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
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
