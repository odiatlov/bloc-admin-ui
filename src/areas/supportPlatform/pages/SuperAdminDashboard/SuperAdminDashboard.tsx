import React from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ApartmentIcon from '@mui/icons-material/Apartment'
import GroupsIcon from '@mui/icons-material/Groups'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import PersonIcon from '@mui/icons-material/Person'
import DomainDisabledIcon from '@mui/icons-material/DomainDisabled'
import { useTranslation } from 'react-i18next'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import MetricCard from '../../../../components/shared/MetricCard'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import { superAdminApi, type SuperAdminDashboardResponse } from '../../../../services/superAdminApi'
import { mockPlatformActivity } from '../../mocks/platformMockData'
import type { PlatformActivity } from '../../types'

const emptyStats: SuperAdminDashboardResponse = {
  totalBlocks: 0,
  totalUsers: 0,
  totalAdmins: 0,
  totalResidents: 0,
  totalCensors: 0,
  pendingAdminInvites: 0,
  suspendedAdminAccounts: 0,
  blocksWithoutAdmin: 0,
}

const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = React.useState<SuperAdminDashboardResponse>(emptyStats)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadDashboard = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setStats(await superAdminApi.getDashboard())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const activityColumns: DataColumn<PlatformActivity>[] = [
    { key: 'activity', label: t('superAdmin.dashboard.columns.activity'), cardRole: 'primary', render: (activity) => t(activity.titleKey) },
    { key: 'description', label: t('superAdmin.dashboard.columns.description'), render: (activity) => t(activity.descriptionKey) },
    { key: 'createdAt', label: t('superAdmin.common.createdAt'), render: (activity) => activity.createdAt },
  ]

  return (
    <Box>
      <PageHeader title={t('superAdmin.dashboard.title')} description={t('superAdmin.dashboard.description')} />

      <Box sx={{ display: 'grid', gap: 2 }}>
        {isLoading ? (
          <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">{t('superAdmin.dashboard.loading')}</Typography>
          </Paper>
        ) : error ? (
          <LoadErrorState
            helperText={t('superAdmin.dashboard.errors.loadFailed')}
            onRetry={loadDashboard}
          />
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
            <MetricCard icon={<ApartmentIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalBlocks')} value={stats.totalBlocks} />
            <MetricCard icon={<PersonIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalUsers')} value={stats.totalUsers} />
            <MetricCard icon={<GroupsIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalResidents')} value={stats.totalResidents} />
            <MetricCard icon={<HowToRegIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalAdmins')} value={stats.totalAdmins} />
            <MetricCard icon={<PersonSearchIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalCensors')} value={stats.totalCensors} />
            <MetricCard icon={<MarkEmailUnreadIcon color="warning" />} label={t('superAdmin.dashboard.metrics.pendingAdminInvites')} value={stats.pendingAdminInvites} />
            <MetricCard icon={<DomainDisabledIcon color="warning" />} label={t('superAdmin.dashboard.metrics.suspendedAdminAccounts')} value={stats.suspendedAdminAccounts} />
            <MetricCard icon={<DomainDisabledIcon color="warning" />} label={t('superAdmin.dashboard.metrics.blocksWithoutAdmin')} value={stats.blocksWithoutAdmin} />
          </Box>
        )}

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>{t('superAdmin.dashboard.activity.title')}</Typography>
          <ResponsiveDataView
            ariaLabel={t('superAdmin.dashboard.activity.title')}
            columns={activityColumns}
            getRowId={(activity) => activity.id}
            rows={mockPlatformActivity}
          />
        </Paper>
      </Box>
    </Box>
  )
}

export default SuperAdminDashboard
