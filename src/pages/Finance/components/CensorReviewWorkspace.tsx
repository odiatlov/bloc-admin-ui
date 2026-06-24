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
import RateReviewIcon from '@mui/icons-material/RateReview'
import RuleIcon from '@mui/icons-material/Rule'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../components/shared/EmptyState'
import InvoiceBreakdownDrawer from '../../../components/shared/InvoiceBreakdownDrawer'
import MetricCard from '../../../components/shared/MetricCard'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../components/shared/StatusChip'
import { formatApartment, formatCurrency, formatFriendlyDateTime, formatMonth, formatNumber, useCensorReviews } from '../../../hooks/useApartmentData'
import type { CensorReview, ReviewState } from '../../../types/apartment'

const reviewActions: ReviewState[] = ['needs_changes', 'rejected', 'approved']

const CensorReviewWorkspace: React.FC = () => {
  const { t } = useTranslation()
  const { anomalyReviews, invoiceReviews, maintenanceReviews, pendingCount, rejectedCount, reviewItems, setReviewState } = useCensorReviews()
  const formatReviewDate = (value: string) => formatFriendlyDateTime(value, { atLabel: t('common.at'), todayLabel: t('common.today') })
  const [tab, setTab] = React.useState(0)
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null)
  const [activeReview, setActiveReview] = React.useState<CensorReview | null>(null)
  const selectedInvoice = invoiceReviews.find((item) => item.invoice.id === invoiceId)?.invoice ?? null
  const renderTabLabel = (fullKey: string, shortKey: string) => (
    <>
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{t(fullKey)}</Box>
      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{t(shortKey)}</Box>
    </>
  )

  const openDecision = (review: CensorReview) => setActiveReview(review)
  const applyDecision = (state: ReviewState) => {
    if (activeReview) setReviewState(activeReview.id, state)
    setActiveReview(null)
  }

  const invoiceColumns: DataColumn<(typeof invoiceReviews)[number]>[] = [
    { key: 'invoice', label: t('finance.columns.invoice'), cardRole: 'primary', render: ({ invoice }) => invoice.id },
    { key: 'apartment', label: t('finance.columns.apartment'), cardRole: 'secondary', render: ({ invoice }) => invoice.familyLabel },
    { key: 'month', label: t('finance.columns.month'), render: ({ invoice }) => formatMonth(invoice.month) },
    { key: 'amount', label: t('finance.columns.amount'), render: ({ invoice }) => formatCurrency(invoice.totalAmount) },
    { key: 'invoiceStatus', label: t('finance.columns.status'), cardRole: 'status', render: ({ invoice }) => <StatusChip status={invoice.status} label={t(`status.invoice.${invoice.status}`)} /> },
    { key: 'reviewState', label: t('censor.columns.reviewState'), cardRole: 'status', render: ({ review }) => <StatusChip status={review.state} label={t(`status.review.${review.state}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: ({ invoice, review }) => (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setInvoiceId(invoice.id)}>
            {t('resident.bills.viewDetails')}
          </Button>
          <Button size="small" startIcon={<RateReviewIcon />} onClick={() => openDecision(review)}>
            {t('censor.actions.review')}
          </Button>
        </Box>
      ),
    },
  ]

  const maintenanceColumns: DataColumn<(typeof maintenanceReviews)[number]>[] = [
    { key: 'run', label: t('censor.columns.reviewItem'), cardRole: 'primary', render: ({ run }) => t('finance.maintenance.blockMonth', { block: run.blockId.replace('block-', '').toUpperCase(), month: formatMonth(run.month) }) },
    { key: 'generatedAt', label: t('censor.columns.generatedAt'), render: ({ run }) => formatReviewDate(run.generatedAt) },
    { key: 'apartments', label: t('censor.columns.apartments'), render: ({ run }) => run.apartmentTotals.length },
    { key: 'total', label: t('finance.columns.amount'), render: ({ run }) => formatCurrency(run.apartmentTotals.reduce((sum, total) => sum + total.total, 0)) },
    { key: 'state', label: t('censor.columns.reviewState'), cardRole: 'status', render: ({ review }) => <StatusChip status={review.state} label={t(`status.review.${review.state}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: ({ review }) => (
        <Button size="small" startIcon={<RateReviewIcon />} onClick={() => openDecision(review)}>
          {t('censor.actions.review')}
        </Button>
      ),
    },
  ]

  const anomalyColumns: DataColumn<(typeof anomalyReviews)[number]>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), cardRole: 'primary', render: ({ anomaly }) => formatApartment(anomaly.apartment) },
    { key: 'month', label: t('finance.columns.month'), render: ({ anomaly }) => formatMonth(anomaly.month) },
    { key: 'usage', label: t('consumption.columns.usage'), render: ({ anomaly }) => formatNumber(anomaly.usageValue) },
    { key: 'anomaly', label: t('consumption.columns.anomaly'), cardRole: 'status', render: ({ anomaly }) => <StatusChip status={anomaly.anomaly} label={t(`status.anomaly.${anomaly.anomaly}`)} /> },
    { key: 'state', label: t('censor.columns.reviewState'), cardRole: 'status', render: ({ review }) => <StatusChip status={review.state} label={t(`status.review.${review.state}`)} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: ({ review }) => (
        <Button size="small" startIcon={<RateReviewIcon />} onClick={() => openDecision(review)}>
          {t('censor.actions.review')}
        </Button>
      ),
    },
  ]

  const historyColumns: DataColumn<CensorReview['history'][number] & { reviewId: string }>[] = [
    { key: 'review', label: t('censor.columns.reviewItem'), cardRole: 'primary', render: (entry) => entry.reviewId },
    { key: 'at', label: t('censor.columns.reviewedAt'), render: (entry) => formatReviewDate(entry.at) },
    { key: 'actor', label: t('censor.columns.actor'), render: (entry) => entry.actor },
    { key: 'state', label: t('censor.columns.reviewState'), cardRole: 'status', render: (entry) => <StatusChip status={entry.state} label={t(`status.review.${entry.state}`)} /> },
    { key: 'note', label: t('finance.columns.notes'), render: (entry) => t(entry.noteKey) },
  ]
  const historyRows = reviewItems.flatMap((review) => review.history.map((entry) => ({ ...entry, reviewId: review.id })))

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <MetricCard icon={<FactCheckIcon color="primary" />} label={t('censor.metrics.pending')} value={pendingCount} />
        <MetricCard icon={<WarningAmberIcon color="warning" />} label={t('censor.metrics.anomalies')} value={anomalyReviews.length} />
        <MetricCard icon={<RuleIcon color="error" />} label={t('censor.metrics.needsAttention')} value={rejectedCount} />
      </Box>

      <Paper sx={{ maxWidth: '100%', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, nextTab: number) => setTab(nextTab)} variant="fullWidth">
          <Tab label={renderTabLabel('censor.tabs.invoices', 'censor.tabsShort.invoices')} sx={{ minWidth: 0 }} />
          <Tab label={renderTabLabel('censor.tabs.maintenance', 'censor.tabsShort.maintenance')} sx={{ minWidth: 0 }} />
          <Tab label={renderTabLabel('censor.tabs.anomalies', 'censor.tabsShort.anomalies')} sx={{ minWidth: 0 }} />
          <Tab label={renderTabLabel('censor.tabs.history', 'censor.tabsShort.history')} sx={{ minWidth: 0 }} />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <ResponsiveDataView
          ariaLabel={t('censor.tabs.invoices')}
          columns={invoiceColumns}
          emptyState={(
            <EmptyState
              actionLabel={t('censor.actions.viewAnomalies')}
              actionTo="/admin/consumption"
              headline={t('emptyState.headline', { information: t('emptyState.information.reviews') })}
              helperText={t('emptyState.helper.reviews')}
            />
          )}
          getRowId={({ review }) => review.id}
          rows={invoiceReviews}
        />
      )}
      {tab === 1 && (
        <ResponsiveDataView
          ariaLabel={t('censor.tabs.maintenance')}
          columns={maintenanceColumns}
          emptyState={(
            <EmptyState
              actionLabel={t('censor.actions.viewAnomalies')}
              actionTo="/admin/consumption"
              headline={t('emptyState.headline', { information: t('emptyState.information.reviews') })}
              helperText={t('emptyState.helper.reviews')}
            />
          )}
          getRowId={({ review }) => review.id}
          rows={maintenanceReviews}
        />
      )}
      {tab === 2 && (
        <ResponsiveDataView
          ariaLabel={t('censor.tabs.anomalies')}
          columns={anomalyColumns}
          emptyState={(
            <EmptyState
              actionLabel={t('censor.actions.openQueue')}
              actionTo="/admin/finance"
              headline={t('emptyState.headline', { information: t('emptyState.information.reviews') })}
              helperText={t('emptyState.helper.reviews')}
            />
          )}
          getRowId={({ review }) => review.id}
          rows={anomalyReviews}
        />
      )}
      {tab === 3 && (
        <ResponsiveDataView
          ariaLabel={t('censor.tabs.history')}
          columns={historyColumns}
          emptyState={(
            <EmptyState
              actionLabel={t('censor.actions.openQueue')}
              actionTo="/admin/finance"
              headline={t('emptyState.headline', { information: t('emptyState.information.reviews') })}
              helperText={t('emptyState.helper.reviews')}
            />
          )}
          getRowId={(entry) => entry.id}
          rows={historyRows}
        />
      )}

      <InvoiceBreakdownDrawer invoice={selectedInvoice} onClose={() => setInvoiceId(null)} formatCurrency={formatCurrency} />

      <Dialog
        open={Boolean(activeReview)}
        onClose={() => setActiveReview(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { p: 3 } } }}
      >
        <DialogTitle sx={{ p: 0, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {t('censor.dialog.title')}
          {activeReview && (
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 999,
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                color: 'warning.light',
                fontSize: '0.75rem',
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              {t(`status.review.${activeReview.state}`)}
            </Box>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 0, pt: 2.5, pb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography>{activeReview ? t(activeReview.noteKey) : null}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 0, pt: 2.5, justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Button
            onClick={() => setActiveReview(null)}
            sx={{ color: 'text.secondary', px: 0, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
          >
            {t('common.cancel')}
          </Button>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {reviewActions.map((state) => (
              <Button
                key={state}
                variant={state === 'approved' ? 'contained' : 'outlined'}
                onClick={() => applyDecision(state)}
                color={state === 'approved' ? 'success' : state === 'rejected' ? 'error' : 'warning'}
                sx={state === 'approved' ? undefined : { bgcolor: 'transparent' }}
              >
                {t(`censor.actions.${state}`)}
              </Button>
            ))}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CensorReviewWorkspace
