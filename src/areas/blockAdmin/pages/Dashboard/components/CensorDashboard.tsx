import React from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import OpacityIcon from '@mui/icons-material/Opacity'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import LoadingState from '../../../../../components/shared/LoadingState'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { useBlocks } from '../../../../../hooks/useBlocks'
import type { BlockOverview } from '../../../../../types/block'
import { ActionBar, ContentCard, DashboardHeader, DashboardPage } from './DashboardSystem'

const CensorDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { blocks, isLoading, error, refresh } = useBlocks({ filterSearch: false })
  const columns: DataColumn<BlockOverview>[] = [
    { key: 'name', label: t('settings.fields.block'), cardRole: 'primary', render: block => block.displayName },
    { key: 'address', label: t('blocks.columns.address'), render: block => block.address || '—' },
  ]
  return <DashboardPage>
    <DashboardHeader title={t('dashboard.censor.title')} description={t('persons.censorDashboard.description')} />
    <ActionBar title={t('persons.censorAssignment.title')}>
      <Button component={RouterLink} to="/admin/reviews" variant="contained" startIcon={<FactCheckIcon />}>{t('sidebar.reviews')}</Button>
      <Button component={RouterLink} to="/admin/consumption" variant="outlined" startIcon={<OpacityIcon />}
        disabled={isLoading || Boolean(error) || blocks.length === 0}>{t('sidebar.consumption')}</Button>
    </ActionBar>
    <Alert severity="info">{t('financeReview.dashboardHelp')}</Alert>
    <ContentCard title={t('persons.censorDashboard.blocks')}>
      {isLoading ? <LoadingState label={t('persons.loading')} /> : error
        ? <LoadErrorState onRetry={() => { void refresh() }} />
        : <ResponsiveDataView columns={columns} rows={blocks} getRowId={block => block.id}
          ariaLabel={t('persons.censorDashboard.blocks')} paginationId="CensorAssignedBlocks"
          emptyState={<EmptyState headline={t('persons.censorDashboard.empty')} helperText={t('persons.censorDashboard.emptyHelp')} />} />}
    </ContentCard>
  </DashboardPage>
}

export default CensorDashboard
