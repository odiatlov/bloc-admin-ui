import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../components/shared/ResponsiveDataView'
import { RoleContext } from '../../contexts/RoleContext'
import { useBlocks } from '../../hooks/useBlocks'
import { formatCurrency, useBlocksOverview } from '../../hooks/useApartmentData'
import type { BlockRecord } from '../../types/block'

const Blocks: React.FC = () => {
  const { t } = useTranslation()
  const { account } = React.useContext(RoleContext)
  const shouldUseDatabaseBlocks = account.id === 'acct-demo'
  const databaseBlocks = useBlocks({ enabled: shouldUseDatabaseBlocks })
  const mockBlocksOverview = useBlocksOverview()

  const databaseColumns: DataColumn<BlockRecord>[] = [
    { key: 'block', label: t('sidebar.blocks'), render: (block) => t('common.blockValue', { block: block.name }) },
    { key: 'admin', label: t('layout.topbar.role.admin'), render: (block) => block.activeAdminName ?? t('common.notAvailable') },
    { key: 'apartments', label: t('dashboard.admin.overview.apartments'), render: (block) => block.apartmentCount },
    { key: 'residents', label: t('dashboard.admin.overview.residents'), render: (block) => block.residentCount },
    {
      key: 'staircases',
      label: t('sidebar.staircases'),
      render: (block) => block.staircaseCount > 0 ? block.staircaseCount : t('common.notAvailable'),
    },
    { key: 'invoices', label: t('blocks.metrics.totalInvoices'), render: (block) => formatCurrency(block.totalInvoices) },
    { key: 'payments', label: t('blocks.metrics.totalPayments'), render: (block) => formatCurrency(block.totalPayments) },
    { key: 'unpaid', label: t('blocks.metrics.unpaid'), render: (block) => formatCurrency(block.unpaidBalance) },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (block) => (
        <Button size="small" component={RouterLink} to={`/admin/blocks/${block.id}/overview`}>
          {t('blocks.actions.openOverview')}
        </Button>
      ),
    },
  ]

  const mockColumns: DataColumn<(typeof mockBlocksOverview.blockOverviews)[number]>[] = [
    { key: 'block', label: t('sidebar.blocks'), render: (overview) => t('common.blockValue', { block: overview.block.name }) },
    { key: 'admin', label: t('layout.topbar.role.admin'), render: (overview) => overview.activeAdmin?.name ?? t('common.notAvailable') },
    { key: 'apartments', label: t('dashboard.admin.overview.apartments'), render: (overview) => overview.apartmentCount },
    { key: 'residents', label: t('dashboard.admin.overview.residents'), render: (overview) => overview.residentCount },
    {
      key: 'staircases',
      label: t('sidebar.staircases'),
      render: (overview) => overview.block.hasStaircases ? overview.staircaseCount : t('common.notAvailable'),
    },
    { key: 'invoices', label: t('blocks.metrics.totalInvoices'), render: (overview) => formatCurrency(overview.totalInvoices) },
    { key: 'payments', label: t('blocks.metrics.totalPayments'), render: (overview) => formatCurrency(overview.totalPayments) },
    { key: 'unpaid', label: t('blocks.metrics.unpaid'), render: (overview) => formatCurrency(overview.unpaidBalance) },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (overview) => (
        <Button size="small" component={RouterLink} to={`/admin/blocks/${overview.block.id}/overview`}>
          {t('blocks.actions.openOverview')}
        </Button>
      ),
    },
  ]

  const search = shouldUseDatabaseBlocks ? databaseBlocks.search : mockBlocksOverview.search
  const setSearch = shouldUseDatabaseBlocks ? databaseBlocks.setSearch : mockBlocksOverview.setSearch
  const resultCount = shouldUseDatabaseBlocks ? databaseBlocks.blocks.length : mockBlocksOverview.blockOverviews.length

  return (
    <Box>
      <PageHeader title={t('pages.blocks.title')} description={t('pages.blocks.description')} />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper sx={{ p: 2, display: 'grid', gap: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            label={t('sidebar.searchBlocks')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Typography variant="body2" color="text.secondary">
            {t('blocks.results', { count: resultCount })}
          </Typography>
        </Paper>

        {shouldUseDatabaseBlocks ? databaseBlocks.isLoading ? (
          <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">{t('blocks.loading')}</Typography>
          </Paper>
        ) : databaseBlocks.error ? (
          <Alert
            action={(
              <Button color="inherit" size="small" onClick={databaseBlocks.refresh}>
                {t('blocks.actions.retry')}
              </Button>
            )}
            severity="error"
          >
            {t('blocks.errors.loadFailed')}
          </Alert>
        ) : (
          <ResponsiveDataView
            ariaLabel={t('pages.blocks.title')}
            columns={databaseColumns}
            desktopTableMinWidth={1200}
            emptyState={(
              <EmptyState
                actionLabel={t('emptyState.action', { information: t('emptyState.information.blocks') })}
                actionTo="/admin/settings"
                headline={t('emptyState.headline', { information: t('emptyState.information.blocks') })}
                helperText={t('emptyState.helper.settings', { information: t('emptyState.information.blocks') })}
              />
            )}
            getRowId={(block) => block.id}
            rows={databaseBlocks.blocks}
          />
        ) : (
          <ResponsiveDataView
            ariaLabel={t('pages.blocks.title')}
            columns={mockColumns}
            desktopTableMinWidth={1200}
            emptyState={(
              <EmptyState
                actionLabel={t('emptyState.action', { information: t('emptyState.information.blocks') })}
                actionTo="/admin/settings"
                headline={t('emptyState.headline', { information: t('emptyState.information.blocks') })}
                helperText={t('emptyState.helper.settings', { information: t('emptyState.information.blocks') })}
              />
            )}
            getRowId={(overview) => overview.block.id}
            rows={mockBlocksOverview.blockOverviews}
          />
        )}
      </Box>
    </Box>
  )
}

export default Blocks
