import React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ApartmentIcon from '@mui/icons-material/Apartment'
import GroupsIcon from '@mui/icons-material/Groups'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DomainDisabledIcon from '@mui/icons-material/DomainDisabled'
import { useTranslation } from 'react-i18next'
import MetricCard from '../../components/shared/MetricCard'
import PageHeader from '../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../components/shared/ResponsiveDataView'
import { mockPlatformActivity, mockSuperAdminStats, type PlatformActivity } from '../../mocks/superAdmin'

const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation()

  const activityColumns: DataColumn<PlatformActivity>[] = [
    { key: 'activity', label: t('superAdmin.dashboard.columns.activity'), cardRole: 'primary', render: (activity) => t(activity.titleKey) },
    { key: 'description', label: t('superAdmin.dashboard.columns.description'), render: (activity) => t(activity.descriptionKey) },
    { key: 'createdAt', label: t('superAdmin.common.createdAt'), render: (activity) => activity.createdAt },
  ]

  return (
    <Box>
      <PageHeader title={t('superAdmin.dashboard.title')} description={t('superAdmin.dashboard.description')} />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' } }}>
          <MetricCard icon={<ApartmentIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalBlocks')} value={mockSuperAdminStats.totalBlocks} />
          <MetricCard icon={<HowToRegIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalAdmins')} value={mockSuperAdminStats.totalAdmins} />
          <MetricCard icon={<GroupsIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalResidents')} value={mockSuperAdminStats.totalResidents} />
          <MetricCard icon={<PersonSearchIcon color="primary" />} label={t('superAdmin.dashboard.metrics.totalCensors')} value={mockSuperAdminStats.totalCensors} />
          <MetricCard icon={<MarkEmailUnreadIcon color="warning" />} label={t('superAdmin.dashboard.metrics.pendingAdminInvites')} value={mockSuperAdminStats.pendingAdminInvites} />
          <MetricCard icon={<DomainDisabledIcon color="warning" />} label={t('superAdmin.dashboard.metrics.blocksWithoutAdmin')} value={mockSuperAdminStats.blocksWithoutAdmin} />
        </Box>

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
