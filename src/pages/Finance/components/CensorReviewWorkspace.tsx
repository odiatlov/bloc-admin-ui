import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import RuleIcon from '@mui/icons-material/Rule'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useTranslation } from 'react-i18next'
import InvoiceBreakdownDrawer from '../../../components/shared/InvoiceBreakdownDrawer'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatApartment, formatCurrency, formatMonth, formatNumber, useCensorReviews } from '../../../hooks/useApartmentData'
import type { CensorReview, ReviewState } from '../../../types/apartment'

const reviewActions: ReviewState[] = ['approved', 'needs_changes', 'rejected']

const CensorReviewWorkspace: React.FC = () => {
  const { t } = useTranslation()
  const { anomalyReviews, invoiceReviews, maintenanceReviews, pendingCount, rejectedCount, reviewItems, setReviewState } = useCensorReviews()
  const [tab, setTab] = React.useState(0)
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null)
  const [activeReview, setActiveReview] = React.useState<CensorReview | null>(null)
  const selectedInvoice = invoiceReviews.find((item) => item.invoice.id === invoiceId)?.invoice ?? null

  const openDecision = (review: CensorReview) => setActiveReview(review)
  const applyDecision = (state: ReviewState) => {
    if (activeReview) setReviewState(activeReview.id, state)
    setActiveReview(null)
  }

  const invoiceColumns: DataColumn<(typeof invoiceReviews)[number]>[] = [
    { key: 'invoice', label: t('finance.columns.invoice'), render: ({ invoice }) => invoice.id },
    { key: 'apartment', label: t('finance.columns.apartment'), render: ({ invoice }) => invoice.familyLabel },
    { key: 'month', label: t('finance.columns.month'), render: ({ invoice }) => formatMonth(invoice.month) },
    { key: 'amount', label: t('finance.columns.amount'), render: ({ invoice }) => formatCurrency(invoice.totalAmount) },
    { key: 'invoiceStatus', label: t('finance.columns.status'), render: ({ invoice }) => <StatusChip status={invoice.status} label={t(`status.invoice.${invoice.status}`)} /> },
    { key: 'reviewState', label: t('censor.columns.reviewState'), render: ({ review }) => <StatusChip status={review.state} label={t(`status.review.${review.state}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      render: ({ invoice, review }) => (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" onClick={() => setInvoiceId(invoice.id)}>
            {t('resident.bills.viewDetails')}
          </Button>
          <Button size="small" onClick={() => openDecision(review)}>
            {t('censor.actions.review')}
          </Button>
        </Box>
      ),
    },
  ]

  const maintenanceColumns: DataColumn<(typeof maintenanceReviews)[number]>[] = [
    { key: 'run', label: t('censor.columns.reviewItem'), render: ({ run }) => t('finance.maintenance.blockMonth', { block: run.blockId.replace('block-', '').toUpperCase(), month: formatMonth(run.month) }) },
    { key: 'generatedAt', label: t('censor.columns.generatedAt'), render: ({ run }) => run.generatedAt },
    { key: 'apartments', label: t('censor.columns.apartments'), render: ({ run }) => run.apartmentTotals.length },
    { key: 'total', label: t('finance.columns.amount'), render: ({ run }) => formatCurrency(run.apartmentTotals.reduce((sum, total) => sum + total.total, 0)) },
    { key: 'state', label: t('censor.columns.reviewState'), render: ({ review }) => <StatusChip status={review.state} label={t(`status.review.${review.state}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      render: ({ review }) => (
        <Button size="small" onClick={() => openDecision(review)}>
          {t('censor.actions.review')}
        </Button>
      ),
    },
  ]

  const anomalyColumns: DataColumn<(typeof anomalyReviews)[number]>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), render: ({ anomaly }) => formatApartment(anomaly.apartment) },
    { key: 'month', label: t('finance.columns.month'), render: ({ anomaly }) => formatMonth(anomaly.month) },
    { key: 'usage', label: t('consumption.columns.usage'), render: ({ anomaly }) => formatNumber(anomaly.usageValue) },
    { key: 'anomaly', label: t('consumption.columns.anomaly'), render: ({ anomaly }) => <StatusChip status={anomaly.anomaly} label={t(`status.anomaly.${anomaly.anomaly}`)} /> },
    { key: 'state', label: t('censor.columns.reviewState'), render: ({ review }) => <StatusChip status={review.state} label={t(`status.review.${review.state}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      render: ({ review }) => (
        <Button size="small" onClick={() => openDecision(review)}>
          {t('censor.actions.review')}
        </Button>
      ),
    },
  ]

  const historyColumns: DataColumn<CensorReview['history'][number] & { reviewId: string }>[] = [
    { key: 'review', label: t('censor.columns.reviewItem'), render: (entry) => entry.reviewId },
    { key: 'at', label: t('censor.columns.reviewedAt'), render: (entry) => new Date(entry.at).toLocaleString() },
    { key: 'actor', label: t('censor.columns.actor'), render: (entry) => entry.actor },
    { key: 'state', label: t('censor.columns.reviewState'), render: (entry) => <StatusChip status={entry.state} label={t(`status.review.${entry.state}`)} /> },
    { key: 'note', label: t('finance.columns.notes'), render: (entry) => t(entry.noteKey) },
  ]
  const historyRows = reviewItems.flatMap((review) => review.history.map((entry) => ({ ...entry, reviewId: review.id })))

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <FactCheckIcon color="primary" />
          <Typography variant="body2" color="text.secondary">
            {t('censor.metrics.pending')}
          </Typography>
          <Typography variant="h5">{pendingCount}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <WarningAmberIcon color="warning" />
          <Typography variant="body2" color="text.secondary">
            {t('censor.metrics.anomalies')}
          </Typography>
          <Typography variant="h5">{anomalyReviews.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <RuleIcon color="error" />
          <Typography variant="body2" color="text.secondary">
            {t('censor.metrics.needsAttention')}
          </Typography>
          <Typography variant="h5">{rejectedCount}</Typography>
        </Paper>
      </Box>

      <Paper>
        <Tabs value={tab} onChange={(_, nextTab: number) => setTab(nextTab)} variant="scrollable" scrollButtons="auto">
          <Tab label={t('censor.tabs.invoices')} />
          <Tab label={t('censor.tabs.maintenance')} />
          <Tab label={t('censor.tabs.anomalies')} />
          <Tab label={t('censor.tabs.history')} />
        </Tabs>
      </Paper>

      {tab === 0 && <ResponsiveDataView ariaLabel={t('censor.tabs.invoices')} columns={invoiceColumns} getRowId={({ review }) => review.id} rows={invoiceReviews} />}
      {tab === 1 && <ResponsiveDataView ariaLabel={t('censor.tabs.maintenance')} columns={maintenanceColumns} getRowId={({ review }) => review.id} rows={maintenanceReviews} />}
      {tab === 2 && <ResponsiveDataView ariaLabel={t('censor.tabs.anomalies')} columns={anomalyColumns} getRowId={({ review }) => review.id} rows={anomalyReviews} />}
      {tab === 3 && <ResponsiveDataView ariaLabel={t('censor.tabs.history')} columns={historyColumns} getRowId={(entry) => entry.id} rows={historyRows} />}

      <InvoiceBreakdownDrawer invoice={selectedInvoice} onClose={() => setInvoiceId(null)} formatCurrency={formatCurrency} />

      <Dialog open={Boolean(activeReview)} onClose={() => setActiveReview(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('censor.dialog.title')}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1 }}>
          <Typography>{activeReview ? t(activeReview.noteKey) : null}</Typography>
          {activeReview && <StatusChip status={activeReview.state} label={t(`status.review.${activeReview.state}`)} />}
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap' }}>
          <Button onClick={() => setActiveReview(null)}>{t('common.cancel')}</Button>
          {reviewActions.map((state) => (
            <Button key={state} variant={state === 'approved' ? 'contained' : 'outlined'} onClick={() => applyDecision(state)}>
              {t(`censor.actions.${state}`)}
            </Button>
          ))}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CensorReviewWorkspace
