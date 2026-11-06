import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import OpacityIcon from '@mui/icons-material/Opacity'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import { useNavigate } from 'react-router-dom'
import ActivityFeed from './AdminActivityFeed'
import AlertsPanel from './AdminAlertsPanel'
import LoadingState from '../../../../../components/shared/LoadingState'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { useBlocks } from '../../../../../hooks/useBlocks'
import { useFinanceRequest } from '../../../../../hooks/useFinanceWorkspace'
import { formatCurrency, useFinance } from '../../../../../hooks/useApartmentData'
import { financeApi } from '../../../../../services/financeApi'
import { ActionBar, DashboardHeader, DashboardPage, StatCard, StatGrid } from './DashboardSystem'

type PropertyStatProps = {
  label: string
  shortLabel?: string
  value: number
}

const PropertyStat: React.FC<PropertyStatProps> = ({ label, shortLabel, value }) => (
  <Box sx={{ minWidth: 0, textAlign: 'center' }}>
    <Box component="span" sx={{ display: 'block', typography: 'h5', fontWeight: 700, lineHeight: 1 }}>
      {value}
    </Box>
    <Box
      component="span"
      sx={{
        display: 'block',
        typography: 'caption',
        color: 'text.secondary',
        fontSize: { xs: '0.65rem', sm: '0.75rem' },
        lineHeight: 1.25,
        mt: 0.75,
        wordBreak: 'normal',
      }}
    >
      <Box component="span" sx={{ display: { xs: shortLabel ? 'none' : 'inline', sm: 'inline' } }}>
        {label}
      </Box>
      {shortLabel && (
        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
          {shortLabel}
        </Box>
      )}
    </Box>
  </Box>
)

const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { role } = React.useContext(RoleContext)
  const { cashAwaitingVerification, financeAvailable, monthlyRevenue, unpaidInvoices } = useFinance()
  const finance = useFinanceRequest('admin-dashboard', financeApi.dashboard, role === 'Admin' && !financeAvailable)
  const summary = finance.data
  const money = summary && new Intl.NumberFormat(i18n.language, { style: 'currency', currency: summary.currency })
  const counts = new Intl.NumberFormat(i18n.language)
  const month = summary && new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' })
    .format(new Date(summary.year, summary.month - 1, 1))
  const unavailable = finance.error ? t('common.notAvailable') : undefined
  const metricLoading = finance.loading ? <LoadingState variant="compact" label={t('finance.billing.loading')} /> : undefined
  const { blocks: blockOverviews } = useBlocks()
  const blockCount = blockOverviews.length
  const apartmentCount = blockOverviews.reduce((sum, overview) => sum + overview.apartmentCount, 0)
  const residentCount = blockOverviews.reduce((sum, overview) => sum + overview.residentCount, 0)

  return (
    <DashboardPage>
      <DashboardHeader title={t('dashboard.admin.title')} description={t('dashboard.admin.description')} />

      <ActionBar title={t('dashboard.admin.quickActions')}>
        <Button startIcon={<ReceiptLongIcon />} variant="contained" onClick={() => navigate('/admin/finance')}>
          {t('finance.billing.prepareMonth')}
        </Button>
        <Button startIcon={<OpacityIcon />} variant="outlined" onClick={() => navigate('/admin/consumption')}>
          {t('dashboard.admin.options.addWaterReading')}
        </Button>
        <Button startIcon={<FileDownloadIcon />} variant="text" onClick={() => navigate('/admin/reports')}>
          {t('dashboard.admin.options.exportExcel')}
        </Button>
      </ActionBar>

      <StatGrid>
        <StatCard
          label={t(financeAvailable ? 'dashboard.admin.keyMetrics.monthlyRevenue' : 'dashboard.admin.keyMetrics.administrationReceipts')}
          value={financeAvailable ? formatCurrency(monthlyRevenue) : summary && money ? money.format(summary.administrationReceipts) : unavailable}
          secondary={month ? t('dashboard.admin.keyMetrics.billedForMonth', { month }) : undefined}
          badge={financeAvailable && (
            <>
              <Chip size="small" color="success" icon={<TrendingUpIcon />} label={t('dashboard.admin.keyMetrics.monthlyRevenueTrendShort')} sx={{ display: { xs: 'inline-flex', sm: 'none' }, justifySelf: 'start' }} />
              <Chip size="small" color="success" icon={<TrendingUpIcon />} label={t('dashboard.admin.keyMetrics.monthlyRevenueTrend')} sx={{ display: { xs: 'none', sm: 'inline-flex' }, justifySelf: 'start' }} />
            </>
          )}
        >{metricLoading}</StatCard>
        <StatCard
          label={t('dashboard.admin.keyMetrics.outstanding')}
          value={financeAvailable ? t('dashboard.admin.keyMetrics.outstandingValue', { count: unpaidInvoices })
            : summary ? counts.format(summary.overdueBillCount) : unavailable}
          secondary={summary ? t('dashboard.admin.keyMetrics.overdueHelp') : undefined}
          badge={financeAvailable && (
            <>
              <Chip size="small" color="warning" icon={<WarningAmberIcon />} label={t('dashboard.admin.keyMetrics.outstandingTrendShort')} sx={{ display: { xs: 'inline-flex', sm: 'none' }, justifySelf: 'start' }} />
              <Chip size="small" color="warning" icon={<WarningAmberIcon />} label={t('dashboard.admin.keyMetrics.outstandingTrend')} sx={{ display: { xs: 'none', sm: 'inline-flex' }, justifySelf: 'start' }} />
            </>
          )}
        >{metricLoading}</StatCard>
        <StatCard
          label={t('dashboard.admin.keyMetrics.cashVerification')}
          value={financeAvailable ? t('dashboard.admin.keyMetrics.cashVerificationValue', { count: cashAwaitingVerification })
            : summary ? counts.format(summary.pendingCashRequestCount) : unavailable}
          secondary={summary ? t('dashboard.admin.keyMetrics.pendingCashRequests') : undefined}
          badge={financeAvailable && <Chip size="small" color="info" icon={<TaskAltIcon />} label={t('dashboard.admin.keyMetrics.pendingReview')} sx={{ justifySelf: 'start' }} />}
        >{metricLoading}</StatCard>
        <StatCard label={t('dashboard.admin.overview.propertyStats')}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 0.5, sm: 1 } }}>
            <PropertyStat label={t('dashboard.admin.overview.blocks')} shortLabel={t('dashboard.admin.overview.blocksShort')} value={blockCount} />
            <PropertyStat label={t('dashboard.admin.overview.apartments')} shortLabel={t('dashboard.admin.overview.apartmentsShort')} value={apartmentCount} />
            <PropertyStat label={t('dashboard.admin.overview.persons')} shortLabel={t('dashboard.admin.overview.residentsShort')} value={residentCount} />
          </Box>
        </StatCard>
      </StatGrid>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.85fr) minmax(320px, 1fr)' },
          gridAutoRows: '1fr',
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <ActivityFeed activity={summary?.activity ?? []} loading={finance.loading} error={!!finance.error}
          onRetry={finance.refresh} isDemo={financeAvailable} />
        <AlertsPanel />
      </Box>
    </DashboardPage>
  )
}

export default AdminDashboard
