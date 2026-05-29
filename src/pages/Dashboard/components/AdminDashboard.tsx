import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import Paper from '@mui/material/Paper'
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
import { RoleContext } from '../../../contexts/RoleContext'
import { apartments, blocks, residents } from '../../../mocks/apartmentData'
import { formatCurrency, useBlocksOverview, useFinance } from '../../../hooks/useApartmentData'

type KpiCardProps = {
  label: string
  value?: string
  badge?: React.ReactNode
  children?: React.ReactNode
}

const KpiCard: React.FC<KpiCardProps> = ({ badge, children, label, value }) => (
  <Paper
    sx={{
      p: 2,
      minHeight: 136,
      height: '100%',
      display: 'grid',
      alignContent: 'space-between',
      gap: 1.25,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Box>
      {value && (
        <Typography variant="h5" sx={{ lineHeight: 1.15 }}>
          {value}
        </Typography>
      )}
      {children}
    </Box>
    {badge}
  </Paper>
)

type PropertyStatProps = {
  label: string
  value: number
}

const PropertyStat: React.FC<PropertyStatProps> = ({ label, value }) => (
  <Box sx={{ minWidth: 0, textAlign: 'center' }}>
    <Typography variant="h5" sx={{ lineHeight: 1 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
      {label}
    </Typography>
  </Box>
)

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account } = React.useContext(RoleContext)
  const { cashAwaitingVerification, monthlyRevenue, unpaidInvoices } = useFinance()
  const { blockOverviews } = useBlocksOverview()
  const usesScopedDashboardStats = Boolean(account.dataMode && account.dataMode !== 'mock-populated')
  const populatedBlocks = blocks.filter((block) => block.id !== 'block-new-setup')
  const populatedApartments = apartments.filter((apartment) => apartment.blockId !== 'block-new-setup')
  const populatedResidents = residents.filter((resident) => resident.id !== 'R-NEW-BLOCK')
  const blockCount = usesScopedDashboardStats ? blockOverviews.length : populatedBlocks.length
  const apartmentCount = usesScopedDashboardStats ? blockOverviews.reduce((sum, overview) => sum + overview.apartmentCount, 0) : populatedApartments.length
  const residentCount = usesScopedDashboardStats ? blockOverviews.reduce((sum, overview) => sum + overview.residentCount, 0) : populatedResidents.length

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          {t('dashboard.admin.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.admin.description')}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('dashboard.admin.quickActions')}
        </Typography>
        <Paper sx={{ p: 1.5, width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button startIcon={<ReceiptLongIcon />} variant="contained" onClick={() => navigate('/admin/finance')}>
            {t('dashboard.admin.options.newInvoice')}
          </Button>
          <Button startIcon={<OpacityIcon />} variant="outlined" onClick={() => navigate('/admin/consumption')}>
            {t('dashboard.admin.options.addWaterReading')}
          </Button>
          <Button startIcon={<FileDownloadIcon />} variant="text" onClick={() => navigate('/admin/reports')}>
            {t('dashboard.admin.options.exportExcel')}
          </Button>
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gridAutoRows: '1fr', gap: 2 }}>
        <KpiCard
          label={t('dashboard.admin.keyMetrics.monthlyRevenue')}
          value={formatCurrency(monthlyRevenue)}
          badge={<Chip size="small" color="success" icon={<TrendingUpIcon />} label={t('dashboard.admin.keyMetrics.monthlyRevenueTrend')} sx={{ justifySelf: 'start' }} />}
        />
        <KpiCard
          label={t('dashboard.admin.keyMetrics.outstanding')}
          value={t('dashboard.admin.keyMetrics.outstandingValue', { count: unpaidInvoices })}
          badge={<Chip size="small" color="warning" icon={<WarningAmberIcon />} label={t('dashboard.admin.keyMetrics.outstandingTrend')} sx={{ justifySelf: 'start' }} />}
        />
        <KpiCard
          label={t('dashboard.admin.keyMetrics.cashVerification')}
          value={t('dashboard.admin.keyMetrics.cashVerificationValue', { count: cashAwaitingVerification })}
          badge={<Chip size="small" color="info" icon={<TaskAltIcon />} label={t('dashboard.admin.keyMetrics.pendingReview')} sx={{ justifySelf: 'start' }} />}
        />
        <KpiCard label={t('dashboard.admin.overview.propertyStats')}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
            <PropertyStat label={t('dashboard.admin.overview.blocks')} value={blockCount} />
            <PropertyStat label={t('dashboard.admin.overview.apartments')} value={apartmentCount} />
            <PropertyStat label={t('dashboard.admin.overview.residents')} value={residentCount} />
          </Box>
        </KpiCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.85fr) minmax(320px, 1fr)' },
          gridAutoRows: '1fr',
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <ActivityFeed />
        <AlertsPanel />
      </Box>
    </Box>
  )
}

export default AdminDashboard
